<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(): Response
    {
        $activities = Activity::with([
            'children' => fn ($query) => $query
                ->withCount(['reportsAsType', 'reportsAsSubType'])
                ->orderBy('name'),
        ])
            ->withCount(['children', 'reportsAsType', 'reportsAsSubType'])
            ->whereNull('parent_id')
            ->orderBy('name')
            ->paginate(10);

        $activities->through(function (Activity $activity) {
            return [
                'id' => $activity->id,
                'name' => $activity->name,
                'description' => $activity->description,
                'is_active' => $activity->is_active,
                'parent_id' => null,
                'parent' => null,
                'level' => 'parent',
                'children_count' => $activity->children_count,
                'usage_count' => $activity->reports_as_type_count + $activity->reports_as_sub_type_count,
                'children' => $activity->children->map(fn (Activity $child) => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'description' => $child->description,
                    'is_active' => $child->is_active,
                    'parent_id' => $child->parent_id,
                    'parent' => [
                        'id' => $activity->id,
                        'name' => $activity->name,
                    ],
                    'level' => 'sub',
                    'usage_count' => $child->reports_as_type_count + $child->reports_as_sub_type_count,
                ])->values(),
            ];
        });

        return Inertia::render('activities/Index', [
            'activities' => $activities,
            'parentActivities' => Activity::whereNull('parent_id')
                ->where('is_active', true)
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'activityTotals' => [
                'all' => Activity::count(),
                'main' => Activity::whereNull('parent_id')->count(),
                'sub' => Activity::whereNotNull('parent_id')->count(),
                'active' => Activity::where('is_active', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->storeRules($request));

        if ($request->filled('parent_id') && $request->filled('sub_activities')) {
            foreach ($validated['sub_activities'] as $subActivity) {
                Activity::create([
                    'name' => $subActivity['name'],
                    'description' => $subActivity['description'] ?? null,
                    'is_active' => true,
                    'parent_id' => $validated['parent_id'],
                ]);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Subaktivitas berhasil dibuat.',
                ]);
            }

            return redirect()->route('activities.index');
        }

        Activity::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Aktivitas berhasil dibuat.',
            ]);
        }

        return redirect()->route('activities.index');
    }

    public function update(Request $request, Activity $activity): JsonResponse|RedirectResponse
    {
        $validated = $request->validate($this->updateRules($activity));

        if (($validated['parent_id'] ?? null) && $activity->children()->exists()) {
            throw ValidationException::withMessages([
                'parent_id' => 'Aktivitas utama yang memiliki subaktivitas tidak dapat dijadikan subaktivitas.',
            ]);
        }

        $activity->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'is_active' => $activity->parent_id !== null ? true : ($validated['is_active'] ?? $activity->is_active),
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Aktivitas berhasil diperbarui.',
            ]);
        }

        return redirect()->route('activities.index');
    }

    public function updateStatus(Request $request, Activity $activity): JsonResponse
    {
        if ($activity->parent_id !== null) {
            throw new BusinessException('Subaktivitas tidak memiliki status aktif atau nonaktif. Hapus subaktivitas jika sudah tidak diperlukan.');
        }

        $validated = $request->validate(['is_active' => ['required', 'boolean']]);

        $activity->update([
            'is_active' => $validated['is_active'],
        ]);

        if ($activity->parent_id === null) {
            $activity->children()->update([
                'is_active' => $validated['is_active'],
            ]);
        }

        return response()->json([
            'message' => 'Status aktivitas berhasil diperbarui.',
        ]);
    }

    public function destroy(Activity $activity): RedirectResponse
    {
        $usageCount = $activity->reportsAsType()->count() + $activity->reportsAsSubType()->count();

        if ($usageCount > 0) {
            throw ValidationException::withMessages([
                'activity' => 'Aktivitas ini sudah digunakan pada laporan. Nonaktifkan aktivitas jika sudah tidak diperlukan.',
            ]);
        }

        if ($activity->children()->exists()) {
            throw ValidationException::withMessages([
                'activity' => 'Hapus atau pindahkan semua subaktivitas sebelum menghapus aktivitas utama ini.',
            ]);
        }

        $activity->delete();

        return redirect()->route('activities.index');
    }

    private function storeRules(Request $request): array
    {
        return [
            'name' => [
                $request->filled('parent_id') && $request->filled('sub_activities') ? 'nullable' : 'required',
                'string',
                'max:255',
                Rule::unique('activities', 'name')->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'parent_id' => [
                'nullable',
                Rule::exists('activities', 'id')->whereNull('deleted_at')->whereNull('parent_id')->where('is_active', true),
            ],
            'sub_activities' => ['nullable', 'array', 'min:1'],
            'sub_activities.*.name' => [
                'required_with:sub_activities',
                'string',
                'max:255',
                'distinct',
                Rule::unique('activities', 'name')->whereNull('deleted_at'),
            ],
            'sub_activities.*.description' => ['nullable', 'string', 'max:500'],
        ];
    }

    private function updateRules(Activity $activity): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('activities', 'name')->ignore($activity)->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'parent_id' => [
                'nullable',
                'not_in:'.$activity->id,
                Rule::exists('activities', 'id')->whereNull('deleted_at')->whereNull('parent_id')->where('is_active', true),
            ],
        ];
    }
}
