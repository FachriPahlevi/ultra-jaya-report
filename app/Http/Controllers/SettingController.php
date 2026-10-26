<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\User;
use App\Models\Area;
use App\Models\SubArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SettingController extends Controller
{
    public function index(Request $request): Response
    {
        $usersPerPage = (int) $request->integer('users_per_page', 10);
        if (! in_array($usersPerPage, [10, 25, 50, 100, -1], true)) {
            $usersPerPage = 10;
        }

        $activeTab = $request->string('active_tab')->toString();
        if (! in_array($activeTab, ['roles', 'users'], true)) {
            $activeTab = 'roles';
        }

        $user = $request->user();
        $userSearch = trim($request->string('user_search')->toString());
        $canViewUsers = $user->can('users.view');
        $canViewRoles = $user->can('roles.view');

        $users = User::with(['roles', 'managedAreas:id,area', 'supervisedSubAreas:id,area_id,name', 'supervisedSubAreas.area:id,area'])
            ->when(! $canViewUsers, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($userSearch !== '', fn ($query) => $query->where(function ($nestedQuery) use ($userSearch) {
                $nestedQuery->where('name', 'like', "%{$userSearch}%")
                    ->orWhere('email', 'like', "%{$userSearch}%");
            }))
            ->latest()
            ->paginate($usersPerPage === -1 ? 2147483647 : $usersPerPage)
            ->withQueryString();

        $roles = $canViewRoles || $user->can('users.create') || $user->can('users.edit')
            ? Role::with('permissions')->orderBy('name')->get()
            : collect();
        $permissions = $user->can('permissions.manage') ? $this->permissionCatalog() : [];

        return Inertia::render('settings/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
            'systemRoles' => array_keys(config('rbac.roles')),
            'areas' => Area::with(['subAreas' => fn ($query) => $query->where('is_active', true)->withCount('supervisors')])->where('is_active', true)->orderBy('area')->get(),
            'filters' => [
                'users_per_page' => $usersPerPage,
                'active_tab' => $activeTab,
                'user_search' => $userSearch,
            ],
        ]);
    }

    public function storeUser(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'password' => ['required', 'string', 'min:6'],
            'area_ids' => ['nullable', 'array'], 'area_ids.*' => ['integer', 'exists:areas,id'],
            'sub_area_ids' => ['nullable', 'array'], 'sub_area_ids.*' => ['integer', 'exists:sub_areas,id'],
        ]);

        if ($validated['role'] === 'SUPER_ADMIN' && ! Auth::user()->hasRole('SUPER_ADMIN')) {
            throw new BusinessException('Hanya SUPER_ADMIN yang dapat menetapkan role SUPER_ADMIN.');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);
        $this->syncScope($user, $validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'User berhasil dibuat', 'user' => $user], 201);
        }

        return redirect()->route('settings.index')->with('success', 'User berhasil dibuat');
    }

    public function updateUser(Request $request, User $user): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user)],
            'role' => ['required', 'string', 'exists:roles,name'],
            'password' => ['nullable', 'string', 'min:6'],
            'area_ids' => ['nullable', 'array'], 'area_ids.*' => ['integer', 'exists:areas,id'],
            'sub_area_ids' => ['nullable', 'array'], 'sub_area_ids.*' => ['integer', 'exists:sub_areas,id'],
        ]);

        if (! Auth::user()->hasRole('SUPER_ADMIN')) {
            if ($user->hasRole('SUPER_ADMIN')) {
                throw new BusinessException('Hanya SUPER_ADMIN yang dapat mengubah data user SUPER_ADMIN.');
            }

            if ($validated['role'] === 'SUPER_ADMIN') {
                throw new BusinessException('Hanya SUPER_ADMIN yang dapat menetapkan role SUPER_ADMIN.');
            }
        }

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);
        $user->syncRoles([$validated['role']]);
        $this->syncScope($user, $validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'User berhasil diupdate', 'user' => $user], 200);
        }

        return redirect()->route('settings.index')->with('success', 'User berhasil diupdate');
    }

    public function destroyUser(Request $request, User $user): JsonResponse|RedirectResponse
    {
        if ($user->id === Auth::id()) {
            throw new BusinessException('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
        }

        if ($user->hasRole('SUPER_ADMIN')) {
            throw new BusinessException('User dengan role SUPER_ADMIN tidak dapat dihapus untuk menjaga keamanan sistem.');
        }

        $userName = $user->name;
        $user->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => "User '{$userName}' berhasil dihapus dari sistem."], 200);
        }

        return redirect()->route('settings.index')->with('success', "User '{$userName}' berhasil dihapus dari sistem.");
    }

    public function storeRole(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Role berhasil dibuat', 'role' => $role], 201);
        }

        return redirect()->route('settings.index')->with('success', 'Role berhasil dibuat');
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        if ($this->isSystemRole($role)) {
            throw new BusinessException('Nama role bawaan sistem tidak dapat diubah.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role)],
        ]);

        $role->update(['name' => $validated['name']]);

        return response()->json(['message' => 'Role berhasil diupdate'], 200);
    }

    public function deleteRole(Role $role): JsonResponse
    {
        if ($this->isSystemRole($role)) {
            throw new BusinessException('Role bawaan sistem tidak dapat dihapus.');
        }

        $usersWithRole = User::role($role->name)->count();
        if ($usersWithRole > 0) {
            throw new BusinessException("Role '{$role->name}' masih digunakan oleh {$usersWithRole} user. Harap pindahkan user ke role lain terlebih dahulu.");
        }

        $roleName = $role->name;
        $role->delete();

        return response()->json(['message' => "Role '{$roleName}' berhasil dihapus dari sistem."], 200);
    }

    public function syncRolePermissions(Request $request, Role $role): JsonResponse|RedirectResponse
    {
        if ($role->name === 'SUPER_ADMIN' && ! Auth::user()->hasRole('SUPER_ADMIN')) {
            throw new BusinessException('Hanya SUPER_ADMIN yang dapat mengubah permission role SUPER_ADMIN.', 403);
        }

        $validated = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(array_keys(config('rbac.permissions')))],
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Permission berhasil disinkronkan']);
        }

        return redirect()->route('settings.index')->with('success', 'Permission berhasil disinkronkan');
    }

    public function assignRoleToUser(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::findOrFail($validated['user_id']);

        if ($validated['role'] === 'SUPER_ADMIN' && ! Auth::user()->hasRole('SUPER_ADMIN')) {
            throw new BusinessException('Hanya SUPER_ADMIN yang dapat menetapkan role SUPER_ADMIN.');
        }

        if ($user->hasRole('SUPER_ADMIN') && ! Auth::user()->hasRole('SUPER_ADMIN')) {
            throw new BusinessException('Hanya SUPER_ADMIN yang dapat mengubah role user SUPER_ADMIN.');
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->route('settings.index')->with('success', 'Role berhasil diassign ke user');
    }

    private function permissionCatalog(): array
    {
        $metadata = config('rbac.permissions');

        return Permission::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'group' => $metadata[$permission->name]['group'] ?? 'Lainnya',
                'label' => $metadata[$permission->name]['label'] ?? $permission->name,
                'description' => $metadata[$permission->name]['description'] ?? '',
            ])
            ->all();
    }

    private function isSystemRole(Role $role): bool
    {
        return array_key_exists($role->name, config('rbac.roles'));
    }

    private function syncScope(User $user, array $validated): void
    {
        $role = $validated['role']; $areaIds = $validated['area_ids'] ?? []; $subAreaIds = $validated['sub_area_ids'] ?? [];
        if ($role === 'MANAGER' && $areaIds === []) throw \Illuminate\Validation\ValidationException::withMessages(['area_ids' => 'Manager wajib ditugaskan ke minimal satu area.']);
        if ($role === 'SUPERVISOR' && $subAreaIds === []) throw \Illuminate\Validation\ValidationException::withMessages(['sub_area_ids' => 'Supervisor wajib ditugaskan ke minimal satu sub-area.']);
        foreach (SubArea::whereIn('id', $subAreaIds)->withCount('supervisors')->get() as $subArea) {
            if (! $subArea->supervisors()->whereKey($user->id)->exists() && $subArea->supervisors_count >= $subArea->max_personnel) throw \Illuminate\Validation\ValidationException::withMessages(['sub_area_ids' => "Kapasitas sub-area {$subArea->name} sudah penuh."]);
        }
        $user->managedAreas()->sync($role === 'MANAGER' ? $areaIds : []);
        $user->supervisedSubAreas()->sync($role === 'SUPERVISOR' ? $subAreaIds : []);
    }
}
