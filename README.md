# RbVietJet - Shop Nạp Robux (Node.js + Express + JSON Storage)

Phiên bản nâng cấp với backend Express + lưu dữ liệu file JSON (persistent khi deploy).

## Tính năng nổi bật

- Backend Express + API đầy đủ
- Dữ liệu users & orders lưu trên server (file JSON)
- Đăng ký yêu cầu Email
- Quên mật khẩu → Zalo Support
- Nút Zalo Support nổi
- Đổi mật khẩu trong Hồ sơ
- Admin Dashboard đầy đủ (tìm kiếm, duyệt đơn)
- Loading avatar Roblox + Toast notification đẹp
- Mobile friendly (Hamburger menu, nút back)

## Chạy local

```bash
npm install
node server.js
```

Mở trình duyệt: `http://localhost:3000`

**Tài khoản Admin mặc định:**
- Username: `Kjc88`
- Password: `20298393)₫!"?*`

## Deploy lên Render.com (Khuyến nghị)

### Bước 1: Chuẩn bị
1. Tải code ZIP
2. Giải nén
3. Đẩy code lên GitHub repository (khuyến khích)

### Bước 2: Deploy trên Render
1. Vào [render.com](https://render.com) → đăng nhập bằng GitHub
2. Bấm **New +** → **Web Service**
3. Chọn repository của bạn
4. Cấu hình:

| Field                  | Value                              |
|------------------------|------------------------------------|
| **Name**               | rbvietjet (hoặc tên bạn thích)     |
| **Region**             | Singapore                          |
| **Branch**             | main                               |
| **Build Command**      | `npm install`                      |
| **Start Command**      | `node server.js`                   |
| **Instance Type**      | Free                               |

5. Bấm **Create Web Service**

Render sẽ tự động build và deploy. Link sẽ có dạng: `https://your-app.onrender.com`

**Lưu ý:**
- Lần đầu deploy có thể mất 3–5 phút.
- Dữ liệu được lưu trong thư mục `data/` trên server.

## Cấu trúc thư mục

```
rbvietjet/
├── data/                  # Dữ liệu (users.json, orders.json) - tự tạo
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       └── roblox-avatar.js
├── server.js              # Express server + API
├── package.json
└── README.md
```

## API Endpoints (nội bộ)

- `POST /api/register`
- `POST /api/login`
- `POST /api/change-password`
- `GET /api/orders`
- `POST /api/orders`
- `PUT /api/orders/:id`
- `GET /api/users`
- `GET /api/roblox-avatar?username=xxx`

---

**Phiên bản hiện tại:** Đã nâng cấp backend + một phần frontend gọi API.

Nếu cần hỗ trợ thêm (chuyển nốt frontend, thêm database thật, v.v.) cứ nói nhé!