# Toán Cú Con 🦖 - Website Học Toán Lớp 1 (Phong cách Duolingo Kids)

Chào mừng bạn đến với **Toán Cú Con**! Một nền tảng học toán lớp 1 tương tác cao, được thiết kế đặc biệt dành riêng cho trẻ em từ 5-7 tuổi, học toán theo phong cách trò chơi (Gamification) của Duolingo Kids.

Website sở hữu giao diện rực rỡ sắc màu, bo góc lớn 3D sinh động, các nút bấm nhấp nháy đàn hồi xúc giác, masot Khủng Long Dino tương tác cảm xúc trực quan và hệ thống âm thanh/pháo hoa ăn mừng lôi cuốn.

---

## 🌟 Tính Năng Nổi Bật

1. **Giao diện Duolingo Kids:** Bo góc cực đại (`rounded-3xl`), màu sắc pastel tươi sáng, các touch-targets nút bấm khổng lồ cực kỳ tối ưu cho ngón tay trẻ nhỏ trên thiết bị di động (Mobile-First).
2. **Smart Question Generator (Bộ sinh đề thông minh):**
   * **Dạng cơ bản:** `3 + 5 = ?`
   * **Dạng trực quan (Visual):** Biểu diễn bằng emoji hoa quả dễ thương `🍎🍎🍎 + 🍎🍎 = ?` giúp bé dễ dàng đếm.
   * **Dạng đọc hiểu (Story):** Các câu chuyện ngắn bằng tiếng Việt thân quen: *"Bình có 3 quả chuối 🍌. Mẹ cho thêm 2 quả 🍌..."*
   * **Gây nhiễu thông minh:** Sinh đáp án sai gần đúng (lệch 1-2 đơn vị hoặc nhầm toán tử) chứ không sinh các số ngẫu nhiên vô nghĩa.
3. **Hệ thống Học tập Thích ứng (Adaptive Learning Engine):**
   * Tự động điều chỉnh thang số cộng/trừ/nhân/chia dựa trên Level của bé (phạm vi 10, 20, 50, 100).
   * Theo dõi lỗi sai (`mistakes`) và tự động tăng tỉ lệ sinh câu hỏi thuộc phép toán bé hay làm sai để bé ôn tập lại.
   * Đang làm bài: Đúng liên tiếp 3 câu tự tăng độ khó; Sai liên tiếp 2 câu tự động giảm độ khó hoặc chuyển sang dạng Visual trực quan.
4. **Interactive Dino Pet (Thú cưng tương tác):**
   * Bé có một chú Khủng long đồng hành phản hồi cảm xúc thời gian thực (Cười híp mắt khi đúng, mếu máo rơi lệ khi sai, nghiêng đầu suy nghĩ).
   * **Pet Shop:** Bé dùng Sao ⭐ tích lũy khi làm đúng bài để đổi thức ăn (Táo 🍎, kẹo 🍬) để hồi Tim ❤️ sinh mạng, mua màu da mới (Xanh dương 🌊, hồng 🌸, vàng 🟡) và các nón đội siêu ngầu (Mũ Cowboy 🤠, mũ Phù thủy 🧙, Vương miện 👑).
5. **Âm thanh Tự tổng hợp (Web Audio Synth):**
   * Phát trực tiếp các âm thanh chime, click, buzzer mượt mà và sinh động hoàn toàn bằng code mà không cần tải bất kỳ file mp3 bên ngoài nào, loại bỏ hoàn toàn rủi ro lỗi mạng tải âm thanh.
6. **Parent Gate & Analytics (Góc Phụ Huynh):**
   * Khóa cổng phụ huynh bằng câu đố tính nhẩm ngẫu nhiên để bé không tự ý vào chỉnh sửa thiết lập.
   * Biểu đồ trực quan sinh động bằng **Recharts** vẽ tiến độ học tập, tốc độ trả lời câu hỏi và tỉ lệ chính xác.
   * Quản lý nhật ký lỗi sai của bé và cho phép tùy biến cấu hình đề bài học tiếp theo (min/max, số câu, giới hạn giờ...).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Frontend:** React (TypeScript), Vite, Tailwind CSS v4, Framer Motion, Zustand.
* **Charts:** Recharts.
* **Database & Auth:** Supabase (PostgreSQL & RLS Policies) + Tích hợp **Dual-Layer Hybrid Mock Fallback** tự động đồng bộ mượt mà sang `LocalStorage` khi offline / không cấu hình database.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
src/
├── components/         # Các UI component có khả năng tái sử dụng (Button3D, ProgressBar, DinoPet, ConfettiEffect, GameDialog)
├── pages/              # Các trang giao diện chính (AuthPage, LessonMap, PlayRoom, PetShop, ParentDashboard)
├── hooks/              # Custom hooks (useSound)
├── stores/             # Các kho lưu trữ Zustand Store (authStore, useGameStore, useParentStore)
├── services/           # Dịch vụ kết nối API (apiService - Tự động Hybrid Mock Fallback)
├── engine/             # Bộ não sinh đề & Học tập thích ứng (generator, adaptive, antiRepeat, scoring, reward, analytics)
├── utils/              # Tiện ích bổ trợ (audioSynth)
├── animations/         # Các hiệu ứng chuyển động động (presets)
├── routes/             # Hệ thống định tuyến chính (AppRoutes)
├── supabase/           # SQL Database Schema
├── types/              # Khai báo TypeScript Interfaces
├── App.tsx             # Component chạy chính
└── main.tsx            # Điểm gắn kết DOM của React
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Cài đặt các thư viện cần thiết
Mở terminal tại thư mục gốc dự án và chạy lệnh sau:
```bash
npm install
```

### Bước 2: Khởi động Server chạy thử nghiệm (Local Dev Server)
Để mở ứng dụng trên trình duyệt cục bộ, chạy lệnh:
```bash
npm run dev
```
Sau đó truy cập đường dẫn xuất hiện trên terminal (mặc định là `http://localhost:5173`).

---

## 🗄️ Cấu hình Supabase Database (Không bắt buộc)

Ứng dụng chạy hoàn hảo **100% đầy đủ tính năng** ngay lập tức bằng chế độ **Local Mock Fallback (LocalStorage)** mà không cần cài đặt gì thêm. Bé có thể học bài, lưu lịch sử, mua đồ pet cưng, vẽ biểu đồ hoàn toàn mượt mà.

Nếu phụ huynh muốn đồng bộ dữ liệu lên máy chủ đám mây Supabase thực tế:
1. Tạo một project mới trên [Supabase](https://supabase.com/).
2. Vào phần **SQL Editor** trong Supabase Dashboard, copy toàn bộ nội dung file [schema.sql](file:///e:/AI/Tieuhoc/src/supabase/schema.sql) và chạy (Run) để tự động khởi tạo các bảng và thiết lập bảo mật Row Level Security (RLS).
3. Tạo file `.env` ở thư mục gốc dự án và khai báo cấu hình:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Chạy lại `npm run dev` để tự động chuyển sang chế độ Supabase Online đồng bộ thời gian thực!

---
Chúc các bé học tập thật vui tươi và hứng thú với **Toán Cú Con**! 🦕📚
