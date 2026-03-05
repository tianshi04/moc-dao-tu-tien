# Project Overview: Mộc Đạo Tu Tiên (Giai đoạn MVP)

## 1. Tên dự án
**Mộc Đạo Tu Tiên** (Flora Cultivation)

## 2. Ý tưởng & Tầm nhìn (Vision & Concept)
*   **Logline:** Ứng dụng Gamification biến việc chăm sóc cây xanh tại nhà thành một hành trình "Tu Tiên". Chậu cây của bạn là một nhân vật đang ngày đêm tích lũy kinh nghiệm (Tu Vi) để mạnh lên.
*   **Triết lý cốt lõi:**
    *   Người dùng đóng vai trò là người chăm sóc cây — khi cây được sống trong môi trường tốt, cây sẽ tích lũy điểm Tu Vi nhanh hơn.
    *   Không phải game "bấm bấm để nhận thưởng". Điểm Tu Vi phản ánh chính xác **chất lượng chăm sóc ngoài đời thực** của người dùng.
*   **Triển khai thực tế:** Hệ thống hoạt động dựa trên các thiết bị IoT (cảm biến) được cắm trực tiếp vào một chậu cây thật. Chậu cây sẽ trồng một loại cây có tuổi thọ dài (vd: Kim Tiền, Lưỡi Hổ...), đảm bảo người dùng có thể gắn bó và theo dõi cây trong thời gian dài.

## 3. Lõi Gameplay (Core Loop cho MVP)
Ở phiên bản MVP, hệ thống tập trung duy nhất vào một con số: **Tu Vi** (điểm kinh nghiệm của cây):
1.  **Thu thập dữ liệu:** Cảm biến IoT đo 2 chỉ số môi trường: **Độ ẩm đất** và **Ánh sáng**.
2.  **Đánh giá môi trường sống:** Hệ thống so sánh dữ liệu thực tế với ngưỡng lý tưởng của từng loại cây (VD: Kim Tiền ưa khô, Phát Tài ưa ẩm...).
3.  **Cộng/Trừ Tu Vi:** Dựa vào chất lượng môi trường, hệ thống cộng hoặc trừ điểm Tu Vi của cây mỗi chu kỳ (tính theo phút).

## 4. Các tính năng chính (Phạm vi MVP)
Tóm gọn trong 3 hệ thống cốt lõi:
*   **Hệ thống Đo lường Môi trường:** Nhận dữ liệu liên tục từ cảm biến. Phân loại thành các mức chất lượng: *Rất tốt, Tốt, Bình thường, Xấu, Nguy hiểm.*
*   **Hệ thống Tu Vi (Điểm EXP):** Điểm tích lũy theo thời gian. Môi trường tốt → cộng điểm nhanh; môi trường nguy hiểm → bị trừ điểm.
*   **Giao diện Trạng thái (Dashboard):** Hiển thị 3 thông tin:
    *   Chỉ số môi trường hiện tại (Độ ẩm, Ánh sáng).
    *   Đánh giá chất lượng môi trường hiện tại (Tốt/Xấu ở mức nào).
    *   Tổng điểm Tu Vi hiện có của cây.
