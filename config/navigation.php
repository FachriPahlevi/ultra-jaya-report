<?php

return [
    ['route' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'dashboard', 'any_permission' => []],
    ['route' => 'reports.index', 'label' => 'Laporan', 'icon' => 'reports', 'any_permission' => ['reports.view.own', 'reports.view.all', 'reports.solve.own.area', 'reports.review.area']],
    ['route' => 'areas.index', 'label' => 'Area', 'icon' => 'areas', 'any_permission' => ['areas.view']],
    ['route' => 'activities.index', 'label' => 'Aktivitas', 'icon' => 'activities', 'any_permission' => ['activities.view']],
    ['route' => 'settings.index', 'label' => 'Pengaturan', 'icon' => 'settings', 'any_permission' => ['settings.view']],
];
