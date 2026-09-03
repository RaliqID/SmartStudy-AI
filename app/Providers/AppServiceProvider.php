<?php

namespace App\Providers;

use App\Events\MaterialCompleted;
use App\Events\QuizAttemptCompleted;
use App\Events\UserLoggedIn;
use App\Listeners\AwardXpForMaterial;
use App\Listeners\AwardXpForQuiz;
use App\Listeners\CheckAchievements;
use App\Listeners\UpdateDailyQuestProgress;
use App\Listeners\UpdateStreak;
use App\Listeners\UpdateStudentProgress;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        /*
        |----------------------------------------------------------------------
        | Gamifikasi — Event/Listener wiring (master plan Bagian 5)
        | CATATAN: listener TIDAK di-wire manual di sini karena Laravel
        | auto-discovery sudah meregistrasinya (double registration kalau
        | keduanya aktif). Method name konvensi discovery:
        |   QuizAttemptCompleted → UpdateStudentProgress@handle, dst.
        | Lihat event:list untuk mapping aktif.
        |----------------------------------------------------------------------
        */
    }
}
