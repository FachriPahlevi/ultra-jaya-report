<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/RoleMaster', [
            'roles' => Role::latest()->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/RoleCreate');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Role::create($validated);

        return redirect()->route('role.index');
    }

    public function show(Role $role)
    {
        return Inertia::render('admin/RoleShow', [
            'role' => $role,
        ]);
    }

    public function edit(Role $role)
    {
        return Inertia::render('admin/RoleEdit', [
            'role' => $role,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $role->update($validated);

        return redirect()->route('role.index');
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return redirect()->route('role.index');
    }
}