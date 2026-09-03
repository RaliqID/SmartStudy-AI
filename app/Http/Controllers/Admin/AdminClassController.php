<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Klass;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminClassController extends Controller
{
    public function index(): Response
    {
        $classes = Klass::query()
            ->with(['teacher:id,name', 'subject:id,name,icon,color'])
            ->withCount('students')
            ->latest('id')
            ->get()
            ->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'description'    => $c->description,
                'join_code'      => $c->join_code,
                'is_active'      => $c->is_active,
                'teacher'        => $c->teacher ? ['id' => $c->teacher->id, 'name' => $c->teacher->name] : null,
                'subject'        => $c->subject ? ['id' => $c->subject->id, 'name' => $c->subject->name, 'icon' => $c->subject->icon, 'color' => $c->subject->color] : null,
                'students_count' => $c->students_count,
                'created_at'     => $c->created_at?->toDateString(),
            ]);

        return Inertia::render('Admin/Classes/Index', [
            'classes' => $classes,
        ]);
    }

    public function destroy(Klass $class): RedirectResponse
    {
        $name = $class->name;
        $class->delete();

        return redirect()->route('admin.classes.index')->with('success', "Class {$name} deleted.");
    }
}
