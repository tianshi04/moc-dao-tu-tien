# 📂 Firmware - Mộc Đạo Tu Tiên

Thư mục này chứa mã nguồn thiết bị IoT (Firmware) của dự án **Mộc Đạo Tu Tiên**.

## Chức năng chính
- Đọc dữ liệu từ các cảm biến: Độ ẩm đất, Ánh sáng, (có thể mở rộng Nhiệt độ, Độ ẩm không khí).
- Đồng bộ dữ liệu Telemetry lên Backend Platform.
- Cấu hình mạng Wi-Fi và xác thực thiết bị thông qua **Plant Code**.

## 🧩 Phần cứng & Sơ đồ chân (Pinout)

**Vi điều khiển:** ESP32 WROOM 32

| Linh kiện | Giao tiếp | Chân trên linh kiện | Chân trên ESP32 | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **OLED 0.96"** | I2C | VCC <br> GND <br> SCL <br> SDA | 3.3V <br> GND <br> **GPIO 22** <br> **GPIO 21** | Chân I2C mặc định của ESP32 |
| **Cảm biến Ánh sáng (BH1750)** | I2C | VCC <br> GND <br> SCL <br> SDA | 3.3V <br> GND <br> **GPIO 22** <br> **GPIO 21** | Đấu chung đường I2C với màn hình OLED |
| **Cảm biến Độ ẩm đất** | Analog | VCC <br> GND <br> AOUT (SIG) | 3.3V <br> GND <br> **GPIO 34** | Thuộc ADC1, an toàn khi dùng chung WiFi |
| **Cảm biến Nhiệt, Ẩm (DHT22)**| Digital | VCC (+) <br> GND (-) <br> DATA (OUT) | 3.3V <br> GND <br> **GPIO 4** | |

*(Lưu ý: Cần sử dụng Breadboard để chia đường nguồn 3.3V và GND từ ESP32 cho tất cả các cảm biến).*

## 🛠 Môi trường phát triển
- **IDE:** Visual Studio Code + PlatformIO Extension
- **Framework:** Arduino

## 🚀 Hướng dẫn Cài đặt & Nạp Code

### 1. Nạp Firmware vào ESP32
1. Mở thư mục `firmware` bằng Visual Studio Code (đã cài extension **PlatformIO**).
2. Chờ PlatformIO tự động tải các thư viện khai báo trong `platformio.ini` (như `ArduinoJson`, `PubSubClient`, `WiFiManager`...).
3. Cắm cáp USB nối ESP32 với máy tính.
4. Bấm nút **Upload** (biểu tượng mũi tên `→` ở thanh công cụ dưới cùng của VS Code) để biên dịch và nạp code.

### 2. Cấu hình WiFi & Mã Thiết bị (Smart Provisioning)
Firmware được trang bị tính năng **WiFi Manager** lưu trữ bằng NVS (Preferences), giúp thiết bị hoàn toàn độc lập, không cần sửa code mỗi khi đổi WiFi:
1. Khi cấp nguồn, nếu ESP32 chưa có mạng, nó sẽ tự động phát ra một WiFi tên là **`MocDao_Setup`**.
2. Dùng điện thoại kết nối vào WiFi này.
3. Một trang web cài đặt sẽ tự động bật lên (Captive Portal). Bấm vào **Configure WiFi**.
4. Chọn mạng WiFi nhà bạn, nhập mật khẩu.
5. Kéo xuống ô **Mã chậu cây (Plant Code)**, nhập mã định danh duy nhất của chậu cây này (Ví dụ: `MOCDAO_001`).
6. Bấm **Save**. ESP32 sẽ lưu thông tin này vĩnh viễn vào bộ nhớ Flash, tự khởi động lại và kết nối vào mạng.

### 3. Kiểm tra Dữ liệu (MQTT Mocking)
Mạch sử dụng giao thức **MQTT** để truyền tải dữ liệu Telemetry (chu kỳ 60s/lần) siêu nhẹ và mượt mà.
- **MQTT Broker:** `broker.hivemq.com` (Port: 1883)
- **Topic:** `mocdao/telemetry/{plant_code}` (Ví dụ: `mocdao/telemetry/MOCDAO_001`)

Để kiểm tra mạch có đang hoạt động tốt không (ngay cả khi Backend chưa code xong):
1. Mở trình duyệt web, truy cập [HiveMQ Web Client](http://www.hivemq.com/demos/websocket-client/).
2. Bấm **Connect**.
3. Tại ô **Add New Topic Subscription**, nhập Topic tương ứng của mạch (VD: `mocdao/telemetry/MOCDAO_001`) và bấm **Subscribe**.
4. Chờ tối đa 60 giây, bạn sẽ thấy thông số JSON (Nhiệt, ẩm, ánh sáng, độ ẩm đất...) nhảy đều đặn lên màn hình.
