# SmartStudy AI

Platform e-learning berbasis AI — siswa belajar materi per subject, ngobrol sama AI Tutor streaming, ngerjain quiz auto-graded, dan dapat XP/achievement/streak dengan gamifikasi event-driven. Teacher kelola materi & quiz per kelas. Admin kelola user & sistem dengan invite flow.

**Tech Stack:** Laravel 12 · Inertia.js 2 · React 18 · TailwindCSS 4 · PostgreSQL (prod) / SQLite (dev) · spatie/laravel-permission · Three.js/R3F · Pest

## Landing Page

- Guest landing profesional dengan design system Lumina Learning (Tactile Playfulness) + glass refinement — redesigned dari spec Stitch, data real dari database (subjects, materials, quizzes, achievements)
- Hero 3D: model graduation cap (Blender → GLB, 11k tris, PBR) di-render React Three Fiber — orbit nodes, pointer tilt, lazy-loaded, `prefers-reduced-motion` aware. Source `.blend`: `assets/models/smartstudy-cap.blend`
- Text animation: word-stagger hero reveal, scroll-reveal sections (IntersectionObserver), count-up metrics — semua reduced-motion safe
- Sections: hero + 3D + daily quest mock, metrics real, subjects grid, how-it-works, AI tutor demo, achievements real (XP dari DB), CTA, footer

## Fitur

### Student
- Dashboard personal: continue learning, AI recommendation, daily goal, leaderboard
- Subjects browser + unit/material viewer (video, PDF, text) dengan progress tracking
- AI Tutor chat streaming (OpenAI-compatible API, context-aware per subject) + related topics AI-generated
- Quiz system: timer, navigasi soal, auto-grading, review jawaban + penjelasan
- Gamifikasi event-driven: XP, level, streak + streak freeze (2x/bulan gratis), achievements, daily quests, leaderboard (weekly/monthly/all-time)
- Study schedule kalender + CRUD event
- Notification center

### Teacher
- Dashboard ringkasan kelas & aktivitas siswa
- Kelola materi (CRUD per subject/unit, ownership check)
- Kelola quiz (soal + opsi, difficulty, publish/unpublish)
- Kelola kelas (join code, tambah/hapus siswa by email)
- Laporan progress siswa per kelas

### Admin
- Dashboard statistik sistem + weekly chart
- Kelola user (CRUD, role badge, aktif/nonaktif, search + filter, soft delete)
- Invite Teacher/Admin via email (set-password flow) — tidak ada self-register untuk role ini
- Kelola Subject (master data, icon/color, aktif toggle)
- Kelola Kelas + Laporan Sistem (engagement, daily active, top students)

## Arsitektur

- **Auth**: Laravel Breeze session-based, role-based redirect (student/teacher/admin), middleware `role:`
- **Gamifikasi**: Event/Listener pattern — `QuizAttemptCompleted`, `MaterialCompleted`, `UserLoggedIn` → listener XP/streak/quest/achievement/progress terpisah dari controller
- **AI**: `AiTutorService` wrapper OpenAI-compatible (xkiro), SSE streaming, response disimpan ke `ai_messages`
- **Database**: 28 migrasi portable SQLite/PostgreSQL, soft delete di users
- **Testing**: Pest, 50 test / 136 assertions

## Setup

```bash
composer install
npm install

cp .env.example .env
php artisan key:generate

# Konfigurasi DB (SQLite default) + AI + Mail di .env
touch database/database.sqlite

php artisan migrate --seed
npm run dev
```

Akun demo (setelah seed): `student@smartstudy.ai` / `teacher@smartstudy.ai` / `admin@smartstudy.ai` — password `password`.

## Testing

```bash
php artisan test
```

**Author:** Raliq Hidayat BM3
