<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BusinessException;
use App\Models\User;
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

class SettingController extends Controller
{
    public function index(Request $request): Response
    {
        $usersPerPage = (int) $request->integer('users_per_page', 10);
        if (! in_array($usersPerPage, [10, 25, 50, 100], true)) {
            $usersPerPage = 10;
        }

        $activeTab = $request->string('active_tab')->toString();
        if (! in_array($activeTab, ['roles', 'users'], true)) {
            $activeTab = 'roles';
        }

        $users = User::with(['roles', 'assignedAreas:id,area'])
            ->latest()
            ->paginate($usersPerPage)
            ->withQueryString();

        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();

        return Inertia::render('settings/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
            'filters' => [
                'users_per_page' => $usersPerPage,
                'active_tab' => $activeTab,
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

        Role::create(['name' => $validated['name']]);

        return redirect()->route('settings.index')->with('success', 'Role berhasil dibuat');
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        if ($role->name === 'SUPER_ADMIN') {
            throw new BusinessException('Role SUPER_ADMIN tidak dapat diedit');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role)],
        ]);

        $role->update(['name' => $validated['name']]);

        return response()->json(['message' => 'Role berhasil diupdate'], 200);
    }

    public function deleteRole(Role $role): JsonResponse
    {
        if ($role->name === 'SUPER_ADMIN') {
            throw new BusinessException('Role SUPER_ADMIN adalah role sistem yang tidak dapat dihapus.');
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
            throw new BusinessException('Hanya SUPER_ADMIN yang dapat mengubah permission SUPER_ADMIN.');
        }

        $validated = $request->validate(['permissions' => ['array']]);

        $role->syncPermissions($validated['permissions'] ?? []);

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
}
