<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    // app/Http/Middleware/HandleInertiaRequests.php
    // app/Http/Middleware/HandleInertiaRequests.php
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
        ]);
    }
}

