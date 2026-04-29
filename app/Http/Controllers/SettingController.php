<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class SettingController extends Controller
{
    public function index()
    {
        $users = User::with('roles')->latest()->paginate(10);
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();

        return Inertia::render('settings/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string|exists:roles,name',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('settings.index')->with('success', 'User berhasil dibuat');
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|string|exists:roles,name',
            'password' => 'nullable|string|min:6',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->route('settings.index')->with('success', 'User berhasil diupdate');
    }

    public function destroyUser(User $user)
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
        }

        if ($user->hasRole('SUPER_ADMIN')) {
            return back()->with('error', 'User dengan role SUPER_ADMIN tidak dapat dihapus untuk menjaga keamanan sistem.');
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->route('settings.index')->with('success', "User '{$userName}' berhasil dihapus dari sistem.");
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);

        Role::create(['name' => $validated['name']]);

        return redirect()->route('settings.index')->with('success', 'Role berhasil dibuat');
    }

        public function updateRole(Request $request, Role $role)
        {
            if ($role->name === 'SUPER_ADMIN') {
                return response()->json(['message' => 'Role SUPER_ADMIN tidak dapat diedit'], 422);
            }
            
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            ]);
            
            $role->update(['name' => $validated['name']]);
            
            return response()->json(['message' => 'Role berhasil diupdate'], 200);
        }

    // SettingController.php
    public function deleteRole(Role $role)
    {
        if ($role->name === 'SUPER_ADMIN') {
            return response()->json(['message' => 'Role SUPER_ADMIN adalah role sistem yang tidak dapat dihapus.'], 422);
        }

        $usersWithRole = User::role($role->name)->count();
        if ($usersWithRole > 0) {
            return response()->json(['message' => "Role '{$role->name}' masih digunakan oleh {$usersWithRole} user. Harap pindahkan user ke role lain terlebih dahulu."], 422);
        }

        $roleName = $role->name;
        $role->delete();

        return response()->json(['message' => "Role '{$roleName}' berhasil dihapus dari sistem."], 200);
    }

    public function syncRolePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'array',
        ]);

        $role->syncPermissions($validated['permissions']);

        return redirect()->route('settings.index')->with('success', 'Permission berhasil disinkronkan');
    }

    public function assignRoleToUser(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::find($validated['user_id']);
        $user->syncRoles([$validated['role']]);

        return redirect()->route('settings.index')->with('success', 'Role berhasil diassign ke user');
    }
}
