<?php

namespace App\Http\Middleware;

use App\Support\ErrorResponse;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();
        $navItems = $user ? collect(config('navigation'))
            ->filter(fn (array $item) => $item['any_permission'] === [] || $user->hasAnyPermission($item['any_permission']))
            ->map(fn (array $item) => [
                'href' => route($item['route']),
                'label' => $item['label'],
                'icon' => $item['icon'],
            ])
            ->values()
            ->all() : [];

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'navItems' => $navItems,
            'messages' => ErrorResponse::messages(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ]);
    }
}
