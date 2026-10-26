<?php

return [
    ['route' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'dashboard', 'any_permission' => []],
    ['route' => 'reports.index', 'label' => 'Reports', 'icon' => 'reports', 'any_permission' => ['reports.view.own', 'reports.view.all', 'reports.create', 'reports.edit.own', 'reports.edit.all', 'reports.delete.own', 'reports.delete.all', 'reports.solve.all', 'reports.solve.own.area', 'reports.review.area']],
    ['route' => 'areas.index', 'label' => 'Area', 'icon' => 'areas', 'any_permission' => ['areas.view']],
    ['route' => 'activities.index', 'label' => 'Activities', 'icon' => 'activities', 'any_permission' => ['activities.view']],
    ['route' => 'settings.index', 'label' => 'Settings', 'icon' => 'settings', 'any_permission' => ['settings.view']],
];
