<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Klass;
use App\Models\Material;
use App\Models\Subject;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeacherMateriController extends Controller
{
    /**
     * Materials authored by this teacher, grouped by subject + unit.
     */
    public function index()
    {
        $user = Auth::user();

        $materials = Material::where('created_by', $user->id)
            ->with(['unit.subject:id,name,slug,icon,color', 'completions:user_id,material_id'])
            ->orderBy('title')
            ->get()
            ->map(fn ($m) => [
                'id'               => $m->id,
                'title'            => $m->title,
                'content_type'     => $m->content_type,
                'duration_minutes' => $m->duration_minutes,
                'is_active'        => $m->is_active,
                'completions_count'=> $m->completions->count(),
                'unit'             => $m->unit ? ['id' => $m->unit->id, 'title' => $m->unit->title] : null,
                'subject'          => $m->unit?->subject ? [
                    'id'    => $m->unit->subject->id,
                    'name'  => $m->unit->subject->name,
                    'slug'  => $m->unit->subject->slug,
                    'icon'  => $m->unit->subject->icon,
                    'color' => $m->unit->subject->color,
                ] : null,
            ]);

        // Subjects + units for the add/edit forms
        $subjects = Subject::active()->with('units:id,subject_id,title')->get(['id', 'name', 'slug', 'icon', 'color'])
            ->map(fn ($s) => [
                'id'    => $s->id,
                'name'  => $s->name,
                'icon'  => $s->icon,
                'color' => $s->color,
                'units' => $s->units->map(fn ($u) => ['id' => $u->id, 'title' => $u->title]),
            ]);

        return Inertia::render('Teacher/MateriList', [
            'materials' => $materials,
            'subjects'  => $subjects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'content_type'     => ['required', Rule::in(['text', 'video', 'pdf'])],
            'content_url'      => ['nullable', 'url', 'max:2048'],
            'text_content'     => ['nullable', 'string'],
            'unit_id'          => ['required', 'exists:units,id'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
        ]);

        if (in_array($validated['content_type'], ['video', 'pdf']) && empty($validated['content_url'])) {
            return back()->withErrors(['content_url' => 'URL is required for video/pdf materials.'])->withInput();
        }
        if ($validated['content_type'] === 'text' && empty($validated['text_content'])) {
            return back()->withErrors(['text_content' => 'Text content is required for text materials.'])->withInput();
        }

        $unit = Unit::findOrFail($validated['unit_id']);
        $maxOrder = Material::where('unit_id', $unit->id)->max('order_index');

        Material::create([
            ...$validated,
            'order_index' => ($maxOrder ?? 0) + 1,
            'is_active'   => true,
            'created_by'  => Auth::id(),
        ]);

        return redirect()->route('teacher.materials.index')->with('success', 'Material created.');
    }

    public function update(Request $request, Material $material)
    {
        abort_unless($material->created_by === Auth::id(), 403);

        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'content_type'     => ['required', Rule::in(['text', 'video', 'pdf'])],
            'content_url'      => ['nullable', 'url', 'max:2048'],
            'text_content'     => ['nullable', 'string'],
            'unit_id'          => ['required', 'exists:units,id'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        $material->update($validated);

        return redirect()->route('teacher.materials.index')->with('success', 'Material updated.');
    }

    public function destroy(Material $material)
    {
        abort_unless($material->created_by === Auth::id(), 403);

        $material->delete();

        return redirect()->route('teacher.materials.index')->with('success', 'Material deleted.');
    }
}
