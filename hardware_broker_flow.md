# Luồng Dữ liệu qua Broker (MQTT Flow) — Mộc Đạo Tu Tiên

## 1. Kiến trúc kết nối (Pub/Sub)
Thay vì dùng HTTP REST truyền thống, hệ thống dùng **MQTT Broker** để tối ưu cho thiết bị IoT (tiết kiệm pin, realtime).

*   **Broker:** (VD: Mosquitto, EMQX, hoặc HiveMQ)
*   **Giao thức:** MQTT v3.1.1 / v5.0
*   **QoS:** 1 (At least once) - Đảm bảo dữ liệu không bị mất.

## 2. Cấu trúc Topic
Topic được phân cấp để dễ quản lý theo **Plant Code**:

*   **Gửi dữ liệu (Publish):** `mocdaotutien/plants/[PLANT_CODE]/sensors`
*   **Nhận lệnh/Phản hồi (Subscribe):** `mocdaotutien/plants/[PLANT_CODE]/status`

## 3. Định dạng Message (JSON)
Thiết bị gửi lên topic `sensors` định kỳ mỗi 1 phút:

**Payload:**
```json
{
  "plant_code": "A3K9P2XR",
  "data": {
    "moisture": 42.5,
    "light": 850
  },
  "timestamp": 1709635200
}
```

## 4. Cách thức hoạt động
1.  **Sensor:** Đọc giá trị từ cảm biến vật lý.
2.  **Publisher:** Thiết bị IoT đóng gói JSON và gửi (Publish) lên Broker.
3.  **Subscriber (Backend):** Server nhận dữ liệu, lưu vào database và chuyển qua bộ phận **Tính điểm Tu Vi**.
4.  **Feedback:** Server gửi kết quả (Tier hiện tại) về topic `status`. Thiết bị nhận được để hiển thị đèn LED hoặc màn hình.

---

# Quy trình Tính điểm (Scoring Process)

Hệ thống tính điểm dựa trên "Snapshot" dữ liệu cuối cùng nhận được trong mỗi cửa sổ 1 phút.

### Thuật toán tính toán (Pseudocode):

```python
def calculate_exp(plant_data, plant_config):
    # 1. Kiểm tra trạng thái Ban đêm (< 50 Lux)
    is_night = plant_data.light < 50
    
    # 2. Lấy ngưỡng lý tưởng của loài cây đó
    config = plant_config[plant_data.species]
    
    # 3. Đánh giá Ánh sáng
    if is_night:
        light_status = "OK" # Luôn đạt chuẩn ban đêm
    else:
        if config.light_min <= plant_data.light <= config.light_max:
            light_status = "PERFECT"
        elif plant_data.light > config.danger_light:
            light_status = "DANGER"
        else:
            light_status = "OK"

    # 4. Đánh giá Độ ẩm
    if config.moist_min <= plant_data.moisture <= config.moist_max:
        moist_status = "PERFECT"
    elif plant_data.moisture > config.danger_moist_high or plant_data.moisture < config.danger_moist_low:
        moist_status = "DANGER"
    else:
        moist_status = "OK"

    # 5. Quyết định Tier và Cộng điểm
    if light_status == "PERFECT" and moist_status == "PERFECT":
        return 10  # Rất tốt
    elif light_status == "DANGER" or moist_status == "DANGER":
        return -5  # Nguy hiểm
    else:
        return 2   # Bình thường
```

## 5. Lưu ý cho Lập trình viên
*   **Backend:** Cần một Worker luôn lắng nghe (Subscribe) Broker để xử lý dữ liệu ngay khi có message mới.
*   **Hardware:** Cần xử lý việc mất kết nối Internet (Re-connect logic) để không làm gián đoạn việc tu luyện.
