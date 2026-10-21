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
        $navItems = [
            ['href' => '/', 'label' => 'Dashboard', 'icon' => 'HiOutlineViewGrid', 'permission' => null],
            ['href' => '/reports', 'label' => 'Reports', 'icon' => 'HiOutlineDocumentReport', 'permission' => 'menu.reports'],
            ['href' => '/areas', 'label' => 'Areas', 'icon' => 'HiOutlineMap', 'permission' => 'menu.areas'],
            ['href' => '/activities', 'label' => 'Activities', 'icon' => 'HiOutlineLightningBolt', 'permission' => 'menu.activities'],
            ['href' => '/settings', 'label' => 'Settings', 'icon' => 'HiOutlineCog', 'permission' => 'menu.settings'],
        ];

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->getRoleNames(),
                    'permissions' => $request->user()->getAllPermissions()->pluck('name'),
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
