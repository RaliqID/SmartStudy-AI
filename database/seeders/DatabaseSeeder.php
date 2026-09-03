<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['student', 'teacher', 'admin'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@smartstudy.ai'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $admin->assignRole('admin');

        // Create teacher user
        $teacher = User::firstOrCreate(
            ['email' => 'teacher@smartstudy.ai'],
            [
                'name' => 'Teacher',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $teacher->assignRole('teacher');

        // Create student user
        $student = User::firstOrCreate(
            ['email' => 'student@smartstudy.ai'],
            [
                'name' => 'Student',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $student->assignRole('student');

        // Demo content (subjects, units, materials, achievements, quests)
        $this->call(DemoContentSeeder::class);

        // Quiz data for Mathematics
        $this->call(QuizSeeder::class);
    }
}