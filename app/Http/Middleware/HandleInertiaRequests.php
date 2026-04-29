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
        ['href' => '/reports', 'label' => 'Reports', 'icon' => 'HiOutlineDocumentReport', 'permission' => 'reports.view.own'], // atau reports.view.all
        ['href' => '/areas', 'label' => 'Areas', 'icon' => 'HiOutlineMap', 'permission' => 'areas.view'],
        ['href' => '/activities', 'label' => 'Activities', 'icon' => 'HiOutlineLightningBolt', 'permission' => 'activities.view'],
        ['href' => '/settings', 'label' => 'Settings', 'icon' => 'HiOutlineCog', 'permission' => 'settings.view'],
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
