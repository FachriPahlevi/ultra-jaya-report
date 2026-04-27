<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

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
    
    // User Management
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
        
        return redirect()->route('settings.index');
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
        
        return redirect()->route('settings.index');
    }
    
    public function destroyUser(User $user)
    {
        if ($user->hasRole('SUPER_ADMIN')) {
            return back()->with('error', 'Cannot delete SUPER_ADMIN');
        }
        
        $user->delete();
        
        return redirect()->route('settings.index');
    }
    
    // Role Management
    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);
        
        Role::create(['name' => $validated['name']]);
        
        return redirect()->route('settings.index');
    }
    
    public function updateRole(Request $request, Role $role)
    {
        if ($role->name === 'SUPER_ADMIN') {
            return back()->with('error', 'Cannot edit SUPER_ADMIN role');
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
        ]);
        
        $role->update(['name' => $validated['name']]);
        
        return redirect()->route('settings.index');
    }
    
    public function deleteRole(Role $role)
    {
        if ($role->name === 'SUPER_ADMIN') {
            return back()->with('error', 'Cannot delete SUPER_ADMIN role');
        }
        
        $role->delete();
        
        return redirect()->route('settings.index');
    }
    
    public function syncRolePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'array',
        ]);
        
        $role->syncPermissions($validated['permissions']);
        
        return redirect()->route('settings.index');
    }
    
    public function assignRoleToUser(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|string|exists:roles,name',
        ]);
        
        $user = User::find($validated['user_id']);
        $user->syncRoles([$validated['role']]);
        
        return redirect()->route('settings.index');
    }
}