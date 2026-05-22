-- Supabase PostgreSQL Database Schema
-- Website Học Toán Lớp 1 (Duolingo Kids Style)

-- BẬT CÁC EXTENSION CẦN THIẾT
create extension if not exists "uuid-ossp";

-- 1. BẢNG PHỤ HUYNH (PROFILES) - Liên kết với Supabase Auth users
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null unique,
    full_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật RLS cho profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile." on public.profiles
    for select using (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
    for update using (auth.uid() = id);

-- 2. BẢNG HỒ SƠ CỦA BÉ (CHILDREN_PROFILES)
create table public.children_profiles (
    id uuid default uuid_generate_v4() primary key,
    parent_id uuid references public.profiles(id) on delete cascade not null,
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

create index idx_children_parent on public.children_profiles(parent_id);

-- Bật RLS cho children_profiles
alter table public.children_profiles enable row level security;

create policy "Parents can view their children profiles." on public.children_profiles
    for select using (auth.uid() = parent_id);

create policy "Parents can insert their children profiles." on public.children_profiles
    for insert with check (auth.uid() = parent_id);

create policy "Parents can update their children profiles." on public.children_profiles
    for update using (auth.uid() = parent_id);

create policy "Parents can delete their children profiles." on public.children_profiles
    for delete using (auth.uid() = parent_id);

-- 3. BẢNG PHIÊN HỌC (SESSIONS)
create table public.sessions (
    id uuid default uuid_generate_v4() primary key,
    child_id uuid references public.children_profiles(id) on delete cascade not null,
    status text not null check (status in ('active', 'completed', 'failed')),
    math_types text[] not null, -- Mảng các phép tính tham gia (['addition', 'subtraction'])
    total_questions integer default 0 not null,
    correct_answers integer default 0 not null,
    wrong_answers integer default 0 not null,
    stars_earned integer default 0 not null,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ended_at timestamp with time zone
);

create index idx_sessions_child on public.sessions(child_id);

alter table public.sessions enable row level security;

create policy "Parents can view their children sessions." on public.sessions
    for select using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = sessions.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert/update their children sessions." on public.sessions
    for all using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = sessions.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

-- 4. BẢNG NHẬT KÝ CÂU HỎI (QUESTION_HISTORY)
create table public.question_history (
    id uuid default uuid_generate_v4() primary key,
    session_id uuid references public.sessions(id) on delete cascade not null,
    child_id uuid references public.children_profiles(id) on delete cascade not null,
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

create index idx_qhistory_child on public.question_history(child_id);
create index idx_qhistory_session on public.question_history(session_id);

alter table public.question_history enable row level security;

create policy "Parents can view children question history." on public.question_history
    for select using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = question_history.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert/update question history." on public.question_history
    for all using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = question_history.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

-- 5. BẢNG QUẢN LÝ LỖI SAI (MISTAKES) - Phục vụ Adaptive Learning
create table public.mistakes (
    id uuid default uuid_generate_v4() primary key,
    child_id uuid references public.children_profiles(id) on delete cascade not null,
    math_type text not null,
    number_a integer not null,
    number_b integer not null,
    operator text not null,
    wrong_count integer default 1 not null,
    last_attempt_correct boolean default false not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index idx_mistakes_unique on public.mistakes(child_id, math_type, number_a, number_b, operator);

alter table public.mistakes enable row level security;

create policy "Parents can view/update mistakes." on public.mistakes
    for all using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = mistakes.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

-- 6. DANH MỤC HUY HIỆU (BADGES)
create table public.badges (
    id text primary key,
    title text not null,
    description text not null,
    icon_emoji text not null,
    reward_stars integer default 10 not null
);

-- Chèn dữ liệu huy hiệu mặc định
insert into public.badges (id, title, description, icon_emoji, reward_stars) values
('first_victory', 'Chiến thắng đầu tiên', 'Hoàn thành bài học đầu tiên với số tim tối đa!', '🏆', 10),
('addition_master', 'Thần đồng Phép Cộng', 'Hoàn thành 5 bài học phép cộng xuất sắc!', '➕', 20),
('subtraction_master', 'Hiệp sĩ Phép Trừ', 'Hoàn thành 5 bài học phép trừ xuất sắc!', '➖', 20),
('streak_3', 'Chăm chỉ vô địch', 'Giữ streak liên tục trong 3 ngày!', '🔥', 30),
('perfect_10', 'Điểm 10 tuyệt đối', 'Đạt 10/10 câu đúng trong một bài học!', '💯', 15),
('speed_demon', 'Tốc độ tia chớp', 'Hoàn thành bài học dưới 60 giây!', '⚡', 25)
on conflict (id) do nothing;

-- 7. BẢNG HUY HIỆU ĐÃ ĐẠT ĐƯỢC (CHILDREN_BADGES)
create table public.children_badges (
    id uuid default uuid_generate_v4() primary key,
    child_id uuid references public.children_profiles(id) on delete cascade not null,
    badge_id text references public.badges(id) on delete cascade not null,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index idx_children_badge_unique on public.children_badges(child_id, badge_id);

alter table public.children_badges enable row level security;

create policy "Parents can view children badges." on public.children_badges
    for select using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = children_badges.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert children badges." on public.children_badges
    for insert with check (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = children_badges.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

-- 8. BẢNG THỐNG KÊ (STATISTICS) - Cập nhật tự động/qua API để vẽ biểu đồ nhanh
create table public.statistics (
    child_id uuid references public.children_profiles(id) on delete cascade primary key,
    total_sessions integer default 0 not null,
    total_questions integer default 0 not null,
    correct_count integer default 0 not null,
    accuracy_rate real default 0.0 not null, -- tỷ lệ đúng (%)
    avg_time_per_question real default 0.0 not null, -- giây
    strongest_topic text default 'Chưa xác định' not null,
    weakest_topic text default 'Chưa xác định' not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.statistics enable row level security;

create policy "Parents can view children statistics." on public.statistics
    for select using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = statistics.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

create policy "Parents can insert/update statistics." on public.statistics
    for all using (
        exists (
            select 1 from public.children_profiles
            where children_profiles.id = statistics.child_id
            and children_profiles.parent_id = auth.uid()
        )
    );

-- TRIGGER TỰ ĐỘNG TẠO STATISTICS KHI TẠO HỒ SƠ BÉ
create or replace function public.handle_new_child_profile()
returns trigger as $$
begin
    insert into public.statistics (child_id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_child_profile_created
    after insert on public.children_profiles
    for each row execute procedure public.handle_new_child_profile();
