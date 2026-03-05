## 1. Quy tắc tính điểm đơn giản
Hệ thống kiểm tra dữ liệu mỗi **1 phút**.

*   **Quy tắc Ban đêm:** Khi Ánh sáng < 50 Lux (trời tối), hệ thống coi như chỉ số Ánh sáng **luôn đạt chuẩn**. Điểm chỉ còn phụ thuộc vào Độ ẩm.
*   **Quy tắc Ban ngày:** Ánh sáng phải nằm trong khoảng lý tưởng của từng loại cây.

### Bảng điểm chung (Mỗi phút)
| Trạng thái | Điều kiện | Điểm |
|:---:|:---|:---:|
| **Rất tốt** | Cả Ẩm và Sáng đều đạt chuẩn | +10 |
| **Bình thường** | Một trong hai chỉ số bị lệch nhẹ | +2 |
| **Nguy hiểm** | Chỉ số rơi vào ngưỡng đe dọa (úng, khô hạn) | -5 |

## 2. Thông số lý tưởng cho từng loài

### A. Cây Kim Tiền (Hệ Kim)
*Ưa khô thoáng, sợ úng nước.*
*   **Độ ẩm lý tưởng:** 30% - 50% (Trên 70% là Nguy hiểm)
*   **Ánh sáng lý tưởng:** 500 - 1,000 Lux (Trên 3,000 Lux là Nguy hiểm)

### B. Cây Lưỡi Hổ (Hệ Thổ)
*Sức sống mạnh, chịu hạn cực tốt.*
*   **Độ ẩm lý tưởng:** 40% - 60% (Trên 80% là Nguy hiểm)
*   **Ánh sáng lý tưởng:** 1,000 - 5,000 Lux

### C. Cây Vạn Niên Thanh (Hệ Mộc)
*Ưa ẩm, không chịu được nắng gắt.*
*   **Độ ẩm lý tưởng:** 50% - 70% (Dưới 20% là Nguy hiểm)
*   **Ánh sáng lý tưởng:** 1,000 - 2,000 Lux (Trên 3,000 Lux là Nguy hiểm)

## 3. Xử lý đặc biệt
*   **Trời tối:** Như đã nêu, khi Ánh sáng < 50 Lux → Chỉ xét Độ ẩm để cộng điểm.
*   **Dừng tính điểm:** Nếu mất kết nối quá 30 phút → EXP = 0.
*   **Giới hạn:** Tu Vi không bao giờ bị trừ xuống dưới 0.
