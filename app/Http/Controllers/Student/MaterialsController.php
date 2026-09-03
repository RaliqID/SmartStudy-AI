<?php

namespace App\Http\Controllers\Student;

use App\Events\MaterialCompleted;
use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\MaterialCompletion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaterialsController extends Controller
{
    public function show(Material $material)
    {
        $user = auth()->user();
        $material->load(['unit.subject']);

        $unit = $material->unit;

        // Prev/next siblings in same unit by order_index
        $prev = Material::where('unit_id', $material->unit_id)
            ->where('order_index', '<', $material->order_index)
            ->orderByDesc('order_index')
            ->first(['id', 'title']);

        $next = Material::where('unit_id', $material->unit_id)
            ->where('order_index', '>', $material->order_index)
            ->orderBy('order_index')
            ->first(['id', 'title']);

        $isCompleted = MaterialCompletion::where('user_id', $user->id)
            ->where('material_id', $material->id)
            ->exists();

        return Inertia::render('Student/Material', [
            'material' => [
                'id' => $material->id,
                'title' => $material->title,
                'content_type' => $material->content_type,
                'content_url' => $material->content_url,
                'text_content' => $material->text_content,
                'duration_minutes' => $material->duration_minutes,
            ],
            'unit' => $unit ? [
                'id' => $unit->id,
                'title' => $unit->title,
            ] : null,
            'subject' => $unit && $unit->subject ? [
                'id' => $unit->subject->id,
                'name' => $unit->subject->name,
                'slug' => $unit->subject->slug,
                'icon' => $unit->subject->icon,
                'color' => $unit->subject->color,
            ] : null,
            'prev' => $prev ? ['id' => $prev->id, 'title' => $prev->title] : null,
            'next' => $next ? ['id' => $next->id, 'title' => $next->title] : null,
            'isCompleted' => $isCompleted,
        ]);
    }

    public function complete(Request $request, Material $material)
    {
        $user = auth()->user();

        // Idempotent: firstOrCreate — only dispatch on NEW completion
        $completion = MaterialCompletion::firstOrCreate(
            [
                'user_id' => $user->id,
                'material_id' => $material->id,
            ]
        );

        if ($completion->wasRecentlyCreated) {
            event(new MaterialCompleted($user, $material));

            return redirect()->back()->with('success', '+25 XP — Material completed!');
        }

        // Already completed — no double XP
        return redirect()->back()->with('success', 'Material already completed.');
    }
}
