-- Supabase PostgreSQL Database Schema
-- Website Học Toán Lớp 1 (Duolingo Kids Style)
-- Phiên bản: Cách ly và tránh xung đột tuyệt đối bằng tiền tố "th_"

-- BẬT CÁC EXTENSION CẦN THIẾT
create extension if not exists "uuid-ossp";

-- 1. BẢNG PHỤ HUYNH (TH_PARENT_PROFILES) - Liên kết với Supabase Auth users
create table if not exists public.th_parent_profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null unique,
    full_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật RLS cho th_parent_profiles
alter table public.th_parent_profiles enable row level security;

-- Dọn dẹp policy cũ trước khi tạo để tránh lỗi trùng lặp
drop policy if exists "Users can view their own profile." on public.th_parent_profiles;
drop policy if exists "Users can update their own profile." on public.th_parent_profiles;
drop policy if exists "Users can insert their own profile." on public.th_parent_profiles;

create policy "Users can view their own profile." on public.th_parent_profiles
    for select using (auth.uid() = id);

create policy "Users can update their own profile." on public.th_parent_profiles
    for update using (auth.uid() = id);

create policy "Users can insert their own profile." on public.th_parent_profiles
    for insert with check (auth.uid() = id);


-- 2. BẢNG HỒ SƠ CỦA BÉ (TH_CHILDREN_PROFILES)
create table if not exists public.th_children_profiles (
    id uuid default uuid_generate_v4() primary key,
    parent_id uuid references public.th_parent_profiles(id) on delete cascade not null,
    name text not null,
    avatar text not null, -- emoji hoặc tên ảnh đại diện (vd: 'dino', 'unicorn', 'fox')
    level integer default 1 not null,
    experience_points integer default 0 not null,
    stars integer default 0 not null,
    lives integer default 5 not null, -- Tim sinh mạng (tối đa 5)
    streak_days integer default 0 not null,
    last_active_at timestamp with time zone,
    pet_name text default 'Dino' not null,
    pet_color text default 'green' not null, -- green, blue, pink, yellow
    pet_hat text default 'none' not null, -- none, cap, crown, wizard
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tạo Index an toàn
create index if not exists idx_th_children_parent on public.th_children_profiles(parent_id);

-- Bật RLS cho th_children_profiles
alter table public.th_children_profiles enable row level security;

drop policy if exists "Parents can view their children profiles." on public.th_children_profiles;
drop policy if exists "Parents can insert their children profiles." on public.th_children_profiles;
drop policy if exists "Parents can update their children profiles." on public.th_children_profiles;
drop policy if exists "Parents can delete their children profiles." on public.th_children_profiles;

create policy "Parents can view their children profiles." on public.th_children_profiles
    for select using (auth.uid() = parent_id);

create policy "Parents can insert their children profiles." on public.th_children_profiles
    for insert with check (auth.uid() = parent_id);

create policy "Parents can update their children profiles." on public.th_children_profiles
    for update using (auth.uid() = parent_id);

create policy "Parents can delete their children profiles." on public.th_children_profiles
    for delete using (auth.uid() = parent_id);


-- 3. BẢNG PHIÊN HỌC (TH_SESSIONS)
create table if not exists public.th_sessions (
    id uuid default uuid_generate_v4() primary key,
    child_id uuid references public.th_children_profiles(id) on delete cascade not null,
    status text not null check (status in ('active', 'completed', 'failed')),
    math_types text[] not null, -- Mảng các phép tính tham gia (['addition', 'subtraction'])
    total_questions integer default 0 not null,
    correct_answers integer default 0 not null,
    wrong_answers integer default 0 not null,
    stars_earned integer default 0 not null,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ended_at timestamp with time zone
);

create index if not exists idx_th_sessions_child on public.th_sessions(child_id);

alter table public.th_sessions enable row level security;

drop policy if exists "Parents can view their children sessions." on public.th_sessions;
drop policy if exists "Parents can insert/update their children sessions." on public.th_sessions;

create policy "Parents can view their children sessions." on public.th_sessions
    for select using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_sessions.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert/update their children sessions." on public.th_sessions
    for all using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_sessions.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );


-- 4. BẢNG NHẬT KÝ CÂU HỎI (TH_QUESTION_HISTORY)
create table if not exists public.th_question_history (
    id uuid default uuid_generate_v4() primary key,
    session_id uuid references public.th_sessions(id) on delete cascade not null,
    child_id uuid references public.th_children_profiles(id) on delete cascade not null,
    math_type text not null, -- addition, subtraction, multiplication, division
    question_text text not null,
    question_visual text, -- emoji biểu diễn trực quan (🍎🍎 + 🍎)
    correct_answer integer not null,
    selected_answer integer not null,
    is_correct boolean not null,
    time_taken_seconds integer not null,
    difficulty_level text not null, -- easy, medium, hard
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_th_qhistory_child on public.th_question_history(child_id);
create index if not exists idx_th_qhistory_session on public.th_question_history(session_id);

alter table public.th_question_history enable row level security;

drop policy if exists "Parents can view children question history." on public.th_question_history;
drop policy if exists "Parents can insert/update question history." on public.th_question_history;

create policy "Parents can view children question history." on public.th_question_history
    for select using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_question_history.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert/update question history." on public.th_question_history
    for all using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_question_history.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );


-- 5. BẢNG QUẢN LÝ LỖI SAI (TH_MISTAKES) - Phục vụ Adaptive Learning
create table if not exists public.th_mistakes (
    id uuid default uuid_generate_v4() primary key,
    child_id uuid references public.th_children_profiles(id) on delete cascade not null,
    math_type text not null,
    number_a integer not null,
    number_b integer not null,
    operator text not null,
    wrong_count integer default 1 not null,
    last_attempt_correct boolean default false not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists idx_th_mistakes_unique on public.th_mistakes(child_id, math_type, number_a, number_b, operator);

alter table public.th_mistakes enable row level security;

drop policy if exists "Parents can view/update mistakes." on public.th_mistakes;

create policy "Parents can view/update mistakes." on public.th_mistakes
    for all using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_mistakes.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );


-- 6. DANH MỤC HUY HIỆU (TH_BADGES)
create table if not exists public.th_badges (
    id text primary key,
    title text not null,
    description text not null,
    icon_emoji text not null,
    reward_stars integer default 10 not null
);

-- Chèn dữ liệu huy hiệu mặc định (Không lỗi trùng lặp do ON CONFLICT)
insert into public.th_badges (id, title, description, icon_emoji, reward_stars) values
('first_victory', 'Chiến thắng đầu tiên', 'Hoàn thành bài học đầu tiên với số tim tối đa!', '🏆', 10),
('addition_master', 'Thần đồng Phép Cộng', 'Hoàn thành 5 bài học phép cộng xuất sắc!', '➕', 20),
('subtraction_master', 'Hiệp sĩ Phép Trừ', 'Hoàn thành 5 bài học phép trừ xuất sắc!', '➖', 20),
('streak_3', 'Chăm chỉ vô địch', 'Giữ streak liên tục trong 3 ngày!', '🔥', 30),
('perfect_10', 'Điểm 10 tuyệt đối', 'Đạt 10/10 câu đúng trong một bài học!', '💯', 15),
('speed_demon', 'Tốc độ tia chớp', 'Hoàn thành bài học dưới 60 giây!', '⚡', 25)
on conflict (id) do nothing;


-- 7. BẢNG HUY HIỆU ĐÃ ĐẠT ĐƯỢC (TH_CHILDREN_BADGES)
create table if not exists public.th_children_badges (
    id uuid default uuid_generate_v4() primary key,
    child_id uuid references public.th_children_profiles(id) on delete cascade not null,
    badge_id text references public.th_badges(id) on delete cascade not null,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists idx_th_children_badge_unique on public.th_children_badges(child_id, badge_id);

alter table public.th_children_badges enable row level security;

drop policy if exists "Parents can view children badges." on public.th_children_badges;
drop policy if exists "Parents can insert children badges." on public.th_children_badges;

create policy "Parents can view children badges." on public.th_children_badges
    for select using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_children_badges.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert children badges." on public.th_children_badges
    for insert with check (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_children_badges.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );


-- 8. BẢNG THỐNG KÊ (TH_STATISTICS) - Cập nhật tự động/qua API để vẽ biểu đồ nhanh
create table if not exists public.th_statistics (
    child_id uuid references public.th_children_profiles(id) on delete cascade primary key,
    total_sessions integer default 0 not null,
    total_questions integer default 0 not null,
    correct_count integer default 0 not null,
    accuracy_rate real default 0.0 not null, -- tỷ lệ đúng (%)
    avg_time_per_question real default 0.0 not null, -- giây
    strongest_topic text default 'Chưa xác định' not null,
    weakest_topic text default 'Chưa xác định' not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.th_statistics enable row level security;

drop policy if exists "Parents can view children statistics." on public.th_statistics;
drop policy if exists "Parents can insert/update statistics." on public.th_statistics;

create policy "Parents can view children statistics." on public.th_statistics
    for select using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_statistics.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert/update statistics." on public.th_statistics
    for all using (
        exists (
            select 1 from public.th_children_profiles
            where th_children_profiles.id = th_statistics.child_id
            and th_children_profiles.parent_id = auth.uid()
        )
    );


-- TRIGGER TỰ ĐỘNG TẠO STATISTICS KHI TẠO HỒ SƠ BÉ
create or replace function public.handle_new_child_profile()
returns trigger as $$
begin
    insert into public.th_statistics (child_id)
    values (new.id)
    on conflict (child_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger trước khi tạo lại để tránh lỗi
drop trigger if exists on_child_profile_created on public.th_children_profiles;

create trigger on_child_profile_created
    after insert on public.th_children_profiles
    for each row execute procedure public.handle_new_child_profile();


-- TRIGGER TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ USER MỚI QUA SUPABASE AUTH
create or replace function public.handle_new_parent_profile()
returns trigger as $$
begin
    insert into public.th_parent_profiles (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', 'Phụ Huynh')
    )
    on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.th_parent_profiles.full_name);
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger trước khi tạo lại để tránh lỗi
drop trigger if exists on_parent_user_created on auth.users;

create trigger on_parent_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_parent_profile();
