# Project Overview: Mộc Đạo Tu Tiên (Giai đoạn MVP)

## 1. Tên dự án
**Mộc Đạo Tu Tiên** (Flora Cultivation)

## 2. Ý tưởng & Tầm nhìn (Vision & Concept)
*   **Logline:** Ứng dụng Gamification biến việc chăm sóc cây xanh tại nhà thành một hành trình "Tu Tiên". Chậu cây của bạn là những thực thể đang ngày đêm hấp thu thiên địa linh khí để gia tăng Tu Vi.
*   **Triết lý cốt lõi (Gamification):** 
    *   Người chơi đóng vai trò là "Hộ Đạo Giả", giúp cây tu luyện bằng cách quan tâm và duy trì môi trường sống ("động phủ") lý tưởng cho chúng.
    *   Không phải game "bấm bấm để nhận thưởng". Sức mạnh của cây (Tu Vi) phản ánh chính xác **chất lượng chăm sóc ngoài đời thực** của người dùng.
*   **Triển khai thực tế:** Hệ thống hoạt động dựa trên các thiết bị IoT (cảm biến) được cắm trực tiếp vào một chậu cây thật ngoài đời. Chậu cây này sẽ trồng một loại cây có tuổi thọ dài (vd: Kim Tiền, Lưỡi Hổ...), đảm bảo người chơi có thể đồng hành và "hộ đạo" trong suốt quãng thời gian rất dài.

## 3. Lõi Gameplay (Core Loop cho MVP)
Ở phiên bản MVP (Minimum Viable Product), hệ thống sẽ giản lược tối đa, tập trung duy nhất vào con số "Tu Vi" (EXP):
1.  **Thu thập dữ liệu (Input đời thực):** Thiết bị IoT/Cảm biến đọc 2 chỉ số môi trường: **Độ ẩm** và **Ánh sáng**.
2.  **Đánh giá Động Phủ (Logic):** So sánh dữ liệu thực tế với ngưỡng "Lý tưởng" của từng loại cây (Ví dụ: Cây Kim Tiền chuộng khô, cây Phát Tài chuộng ẩm...).
3.  **Hội Tụ Linh Khí (Output MVP):** Hệ thống tiến hành cộng/trừ Tu Vi (EXP) theo thời gian (tính bằng phút) dựa vào môi trường. Giao diện thể hiện bằng một con số Tu Vi tăng/giảm liên tục.

## 4. Các tính năng chính (Phạm hiện MVP)
Do là MVP nên cắt bỏ hoạt ảnh, hình thái phức tạp, tóm gọn trong 3 hệ thống tạo ra số:
*   **Hệ thống Đo lường Môi trường:** Nhận luồng dữ liệu liên tục từ cảm biến. Phân loại thành các tầng trạng thái: *Đại Đạo Cảm Thông (Rất tốt), Tạm Ổn (Bình thường), Tẩu Hỏa (Nguy hiểm).*
*   **Hệ thống Tu Vi (EXP):** Tích lũy điểm Tu Vi liên tục. Môi trường tốt Tu Vi tăng nhanh, môi trường xấu/nguy hiểm thì Tu Vi bị trừ (Tâm ma phạt).
*   **Giao diện Trạng thái (Dashboard):** Hiển thị rõ ràng 3 thông tin:
    *   Chỉ số môi trường hiện tại (Ẩm, Sáng).
    *   Đánh giá trạng thái linh khí (Tốt/Xấu thế nào).
    *   Tổng số Tu Vi đang sở hữu.
