<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $userData = null;
        $permissions = [];

        if ($user) {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->pluck('name')->first() ?? 'User',
            ];
            $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
                'permissions' => $permissions,
            ],
        ];
    }
}
