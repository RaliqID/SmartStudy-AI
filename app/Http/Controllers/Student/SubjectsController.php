<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Inertia\Inertia;

class SubjectsController extends Controller
{
    public function index()
    {
        $subjects = Subject::active()
            ->with(['units' => function ($query) {
                $query->active()->orderBy('order_index');
            }])
            ->get();

        return Inertia::render('Student/Subjects', [
            'subjects' => $subjects,
        ]);
    }

    public function show(Subject $subject)
    {
        $subject->load(['units' => function ($query) {
            $query->active()->orderBy('order_index')->with(['materials' => function ($q) {
                $q->active()->orderBy('order_index');
            }]);
        }]);

        return Inertia::render('Student/SubjectDetail', [
            'subject' => $subject,
            'slug' => $subject->slug,
        ]);
    }
}