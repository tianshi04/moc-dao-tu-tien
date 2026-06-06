# Hướng Dẫn Nâng Cấp: Kiến Trúc Telemetry v2 & Mô Hình Vận Hành

Xin chúc mừng đội ngũ phát triển đã nâng cấp thành công kiến trúc cốt lõi của Backend Mộc Đạo Tu Tiên! Dưới đây là tổng hợp những gì đã thay đổi và cách sử dụng hệ thống mới.

## 1. Tóm tắt các Thay Đổi Kỹ Thuật (Changelog)

Việc tách bạch rõ ràng giữa "Nhận dữ liệu IoT" và "Tính điểm Tu Vi" giúp Backend chịu tải hàng ngàn thiết bị dễ dàng hơn và tiết kiệm pin tối đa cho thiết bị phần cứng.

| Tính năng cũ | Kiến trúc mới (v2) | Lợi ích |
| :--- | :--- | :--- |
| **Tính EXP Event-driven:** Mỗi khi nhận tín hiệu MQTT, lập tức chạy hàm tính Tu Vi. | **Tính EXP Batch Định Kỳ:** Telemetry chỉ cập nhật state mới nhất. `APScheduler` sẽ quét Database mỗi 1 phút để cộng Tu Vi. | Tối ưu hóa Database, chống Spam. Mở đường cho Firmware hoạt động chế độ Delta Sync. |
| **Gửi IoT Định kỳ:** ESP32 phải gửi data 1 phút/lần dù môi trường không đổi. | **Gửi IoT Delta Sync (Real-time):** ESP32 KHÔNG gửi định kỳ. Chỉ gửi khi có chỉ số cảm biến thay đổi đột ngột. | Tiết kiệm Pin cực mạnh cho ESP32. App hiển thị thay đổi Real-time ngay lập tức khi vừa tưới nước. |
| **1 Tài khoản - 1 Cây:** Chặn cứng logic liên kết cây thứ 2. | **Đa chậu:** Đã gỡ bỏ giới hạn trong Service và Model. | 1 người có thể trồng nhiều cây cùng lúc. |
| **Admin Provisioning:** Chỉ Admin mới sinh mã nạp ESP32. | **DIY Provisioning:** Cung cấp API để User tự sinh mã nạp ESP32. | Hỗ trợ thêm mô hình Developer/DIY tự lắp ráp chậu cây. |

---

## 2. Hướng Dẫn Sử Dụng & Tích Hợp

### 2.1. Cập nhật Firmware ESP32 (IoT)
Team Firmware (C++) cần thay đổi logic gửi MQTT:
- Bỏ hàm `delay(60000)` để gửi định kỳ.
- Đổi sang: Đọc cảm biến liên tục mỗi giây. Lưu lại giá trị cũ.
- Nếu `|Giá trị mới - Giá trị cũ| > Ngưỡng` (ví dụ độ ẩm đổi > 5%) -> Bật WiFi và Publish MQTT ngay lập tức.
- Điều này sẽ giúp App trên điện thoại nhảy số **Real-time** ngay khoảnh khắc người dùng tưới cây!

### 2.2. Kiểm tra Background Scheduler (Backend)
Khi bạn chạy lệnh backend, hãy chú ý cửa sổ Terminal. Bạn sẽ thấy log hệ thống tự động quét và cộng điểm Tu Vi:
```text
INFO     | app.scheduler | 🚀 Đã khởi động Background Scheduler (APScheduler).
...
INFO     | app.scheduler | ⏱️ Bắt đầu tiến trình cộng Tu Vi định kỳ...
INFO     | app.scheduler | ✅ Đã cộng Tu Vi cho 2 chậu cây.
```
*Lưu ý: Mặc định đang cài đặt chạy mỗi 1 phút để test. Khi lên Production, hãy vào file `backend/app/scheduler.py` đổi `minutes=1` thành `hours=1`.*

### 2.3. Sử dụng API Tự cấp mã (DIY) cho User
Khi Frontend cần làm màn hình "Tự ráp chậu cây mới", hãy gọi Endpoint sau (Yêu cầu User đã đăng nhập, gửi kèm Token):
- **Đường dẫn:** `POST /api/plants/diy-provision`
- **Kết quả trả về:**
```json
{
  "status": "success",
  "message": "Đã tạo mã liên kết...",
  "data": {
    "id": "uuid",
    "plant_code": "QZFJOLXQ",
    "verify_code": "123456",
    "created_at": "..."
  }
}
```
Sau đó User sẽ lấy `plant_code` này để nạp vào board ESP32.
