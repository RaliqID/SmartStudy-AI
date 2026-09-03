<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_new_users_get_student_role(): void
    {
        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'student-role@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $user = \App\Models\User::where('email', 'student-role@example.com')->first();
        $this->assertTrue($user->hasRole('student'));
        $this->assertFalse($user->hasRole('admin'));
        $this->assertFalse($user->hasRole('teacher'));
    }
}
