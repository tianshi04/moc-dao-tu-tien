# Plant Identity — Hệ thống Định danh & Xác thực (MVP)

## 1. Tổng quan mô hình

Hệ thống dùng **2 bước xác thực** tách biệt:
1. **Đăng nhập:** Người dùng đăng nhập bằng tài khoản Google.
2. **Claim thiết bị:** Sau khi đăng nhập, nhập **Plant Code** in trên thiết bị để liên kết chậu cây vào tài khoản.

## 2. Luồng người dùng

```
[Mở app]
    ↓
[Đăng nhập bằng Google]
    ↓
[Nhập Plant Code in trên thiết bị]
    ↓
[Hệ thống xác minh mã + gắn cây vào tài khoản]
    ↓
[Vào Dashboard của cây]
```

## 3. Plant Code

*   **Định dạng:** 8 ký tự alphanumeric — VD: `A3K9P2XR`
*   In cố định lên thiết bị IoT, không thay đổi.
*   Một Plant Code chỉ được claim bởi **1 tài khoản Google duy nhất**.
*   Nếu muốn chuyển chủ sở hữu: cần unclaim từ tài khoản cũ trước.

## 4. Cấu trúc dữ liệu Plant

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `plant_code` | string | Mã định danh thiết bị (VD: `A3K9P2XR`) |
| `owner_uid` | string | Google UID của người đã claim |
| `plant_name` | string | Tên cây do người dùng đặt |
| `species` | enum | Loài cây (Kim Tiền, Lưỡi Hổ...) |
| `device_id` | string | ID phần cứng thiết bị IoT |
| `tu_vi` | number | Điểm Tu Vi tích lũy hiện tại |
| `created_at` | datetime | Thời điểm claim thiết bị |

## 5. Bảo mật

*   **Brute force Plant Code:** Rate limiting — sau 5 lần nhập sai → khóa IP 15 phút.
*   **Quyền chỉnh sửa:** Chỉ `owner_uid` mới được sửa thông tin cây. Các tài khoản khác không thể claim mã đã được dùng.
*   **Mất quyền truy cập:** Đăng nhập lại bằng Google là đủ — không bao giờ mất dữ liệu Tu Vi.

## 6. Giới hạn MVP
*   Mỗi tài khoản Google chỉ claim được 1 chậu cây.
*   Không có tính năng chia sẻ quyền xem hoặc chuyển quyền sở hữu trong phiên bản này.
