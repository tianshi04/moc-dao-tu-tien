#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <BH1750.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

// --- THƯ VIỆN MỚI CHO GIAI ĐOẠN 2 ---
#include <WiFiManager.h>  // Quản lý WiFi và Web Portal
#include <Preferences.h>  // Lưu trữ dữ liệu vào bộ nhớ vĩnh viễn (NVS)

// ================= LƯU TRỮ & CẤU HÌNH =================
Preferences preferences;
char plantCode[20] = "MOCDAO_DEFAULT"; // Biến chứa mã cây (sẽ được ghi đè bằng dữ liệu đã lưu)
String publishTopic;

const char* mqtt_server = "broker.hivemq.com"; 
const int   mqtt_port = 1883;

// NTP Time
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0;
const int   daylightOffset_sec = 0;

// ================= CẤU HÌNH CẢM BIẾN =================
#define I2C_SDA 21
#define I2C_SCL 22
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_MOIST_PIN 34

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64 
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

WiFiClient espClient;
PubSubClient client(espClient);

void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT...");
    String clientId = "MocDao-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println(" Thanh cong!");
    } else {
      Serial.println(" That bai! Thu lai sau 5s...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- MOC DAO TU TIEN - SETUP MODE ---");

  Wire.begin(I2C_SDA, I2C_SCL);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  dht.begin();
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23, &Wire);

  // --- BƯỚC 1: ĐỌC DỮ LIỆU ĐÃ LƯU TRONG BỘ NHỚ ---
  // Mở không gian nhớ tên là "mocdao" (chế độ Read/Write)
  preferences.begin("mocdao", false); 
  // Lấy giá trị plantCode đã lưu từ trước. Nếu chưa từng lưu thì trả về rỗng ("")
  String savedCode = preferences.getString("plantCode", "");
  if (savedCode.length() > 0) {
    savedCode.toCharArray(plantCode, 20);
    Serial.println("Da tim thay Plant Code trong bo nho: " + savedCode);
  }

  // --- BƯỚC 2: KHỞI TẠO WIFI MANAGER (CẤU HÌNH BẰNG ĐIỆN THOẠI) ---
  WiFiManager wm;
  
  // Nếu bạn muốn XÓA TẤT CẢ WiFi đã lưu để test lại từ đầu, hãy bỏ comment dòng dưới đây:
  // wm.resetSettings();

  // Tạo một ô nhập liệu (Text box) trên giao diện Web để người dùng nhập Plant Code
  WiFiManagerParameter custom_plant_code("plantCode", "Mã chậu cây (Plant Code)", plantCode, 20);
  wm.addParameter(&custom_plant_code);

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("CHO CAI DAT WIFI");
  display.println("Dung dien thoai");
  display.println("Bat WiFi va vao:");
  display.println("-> MocDao_Setup");
  display.display();

  // wm.autoConnect() sẽ thử kết nối WiFi cũ. 
  // Nếu thất bại (hoặc mạch mới tinh), nó sẽ tạo 1 trạm WiFi tên là "MocDao_Setup"
  // Mạch sẽ DỪNG LẠI Ở ĐÂY chờ người dùng thiết lập xong mới chạy tiếp!
  if (!wm.autoConnect("MocDao_Setup")) {
    Serial.println("Cai dat WiFi that bai hoac bi huy. Khoi dong lai mạch...");
    delay(3000);
    ESP.restart();
  }

  // --- NẾU CODE CHẠY XUỐNG ĐÂY NGHĨA LÀ ĐÃ CÓ WIFI ---
  Serial.println("\nWiFi da ket noi thanh cong!");
  
  // --- BƯỚC 3: LƯU LẠI PLANT CODE NẾU NGƯỜI DÙNG VỪA SỬA TRÊN WEB ---
  String newCode = String(custom_plant_code.getValue());
  // Xóa khoảng trắng thừa ở 2 đầu (nếu có)
  newCode.trim(); 
  
  if (newCode != String(plantCode) && newCode.length() > 0) {
    newCode.toCharArray(plantCode, 20);
    preferences.putString("plantCode", plantCode); // Lưu chết vào bộ nhớ flash
    Serial.println("Da cap nhat va luu Plant Code moi: " + newCode);
  }

  // Khởi tạo Topic MQTT với mã thiết bị vừa lưu
  publishTopic = String("mocdao/telemetry/") + String(plantCode);
  Serial.println("Topic hien tai: " + publishTopic);

  // Cấu hình MQTT & Thời gian
  client.setServer(mqtt_server, mqtt_port);
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("WiFi: OK!");
  display.println("Code: " + String(plantCode));
  display.display();
  delay(2000);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // --- ĐỌC CẢM BIẾN ---
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float lux = lightMeter.readLightLevel();
  int rawMoisture = analogRead(SOIL_MOIST_PIN);
  float soil_moisture = constrain(map(rawMoisture, 4095, 0, 0, 100), 0, 100);
  if (isnan(h) || isnan(t)) { h = 0; t = 0; }

  // --- LẤY THỜI GIAN ---
  struct tm timeinfo;
  char timestamp[30];
  if(!getLocalTime(&timeinfo)){
    strcpy(timestamp, "1970-01-01T00:00:00Z");
  } else {
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  }

  // --- TẠO JSON ---
  JsonDocument doc;
  doc["device_id"] = plantCode;
  doc["timestamp"] = timestamp;
  
  JsonObject sensors = doc["sensors"].to<JsonObject>();
  sensors["soil_moisture"] = soil_moisture;
  sensors["light"] = lux;
  sensors["temperature"] = t;
  sensors["humidity"] = h;

  String jsonOutput;
  serializeJson(doc, jsonOutput);

  // --- PUBLISH ---
  Serial.println("\n>>> DANG PUBLISH DU LIEU...");
  if(client.publish(publishTopic.c_str(), jsonOutput.c_str())) {
    Serial.println("-> Gui thanh cong!");
  } else {
    Serial.println("-> Gui THAT BAI!");
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("MQTT OK!");
  display.print("Nhiet: "); display.print(t, 1); display.println("C");
  display.print("Am KK: "); display.print(h, 1); display.println("%");
  display.print("Dat  : "); display.print(soil_moisture, 0); display.println("%");
  display.display();

  delay(60000); 
}
