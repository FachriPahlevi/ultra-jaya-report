<?php

return [
    'permissions' => [
        'reports.view.own' => ['group' => 'Reports', 'label' => 'View own reports', 'description' => 'View reports created by the current user.'],
        'reports.view.all' => ['group' => 'Reports', 'label' => 'View all reports', 'description' => 'View reports from all areas and users.'],
        'reports.create' => ['group' => 'Reports', 'label' => 'Create reports', 'description' => 'Create a new finding report.'],
        'reports.export' => ['group' => 'Reports', 'label' => 'Export reports', 'description' => 'Download accessible reports as Excel or PDF.'],
        'reports.edit.own' => ['group' => 'Reports', 'label' => 'Edit own reports', 'description' => 'Edit open reports created by the current user.'],
        'reports.edit.all' => ['group' => 'Reports', 'label' => 'Edit all reports', 'description' => 'Edit open reports created by any user.'],
        'reports.delete.own' => ['group' => 'Reports', 'label' => 'Delete own reports', 'description' => 'Delete open reports created by the current user.'],
        'reports.delete.all' => ['group' => 'Reports', 'label' => 'Delete all reports', 'description' => 'Delete open reports created by any user.'],
        'reports.solve.own.area' => ['group' => 'Reports', 'label' => 'Close assigned issues', 'description' => 'Close an open issue in an assigned sub-area, subject to the active sub-activity access rules.'],
        'reports.solve.all' => ['group' => 'Reports', 'label' => 'Close all issues', 'description' => 'Close issues in every area.'],
        'reports.review.area' => ['group' => 'Reports', 'label' => 'Review activity reports', 'description' => 'View reports within the active reviewer access scope.'],
        'activities.category.manage' => ['group' => 'Activities', 'label' => 'Manage sub-activity categories', 'description' => 'Set a sub-activity as ISSUE or REPORT; requires permission to create or edit sub-activities.'],

        'areas.view' => ['group' => 'Areas', 'label' => 'View areas', 'description' => 'View the list of accessible areas.'],
        'areas.view.all' => ['group' => 'Areas', 'label' => 'View all areas', 'description' => 'View all areas, including archived areas.'],
        'areas.create' => ['group' => 'Areas', 'label' => 'Create areas', 'description' => 'Add new areas.'],
        'areas.edit' => ['group' => 'Areas', 'label' => 'Edit areas', 'description' => 'Edit an area name, status, and person in charge.'],
        'areas.delete' => ['group' => 'Areas', 'label' => 'Delete areas', 'description' => 'Archive, restore, or permanently delete areas without report history.'],
        'activities.view' => ['group' => 'Activities', 'label' => 'View activities', 'description' => 'View activities and sub-activities.'],
        'activities.create' => ['group' => 'Activities', 'label' => 'Create activities', 'description' => 'Add activities or sub-activities.'],
        'activities.edit' => ['group' => 'Activities', 'label' => 'Edit activities', 'description' => 'Edit activities and their status.'],
        'activities.delete' => ['group' => 'Activities', 'label' => 'Delete activities', 'description' => 'Delete activities that have not been used in reports.'],

        'users.view' => ['group' => 'Users', 'label' => 'View users', 'description' => 'View the user list.'],
        'users.create' => ['group' => 'Users', 'label' => 'Create users', 'description' => 'Add new users.'],
        'users.edit' => ['group' => 'Users', 'label' => 'Edit users', 'description' => 'Edit user details and roles.'],
        'users.delete' => ['group' => 'Users', 'label' => 'Delete users', 'description' => 'Delete users other than the current account and SUPER_ADMIN.'],
        'users.assign.area' => ['group' => 'Users', 'label' => 'Assign user areas', 'description' => 'Assign users as an area person in charge.'],
        'users.promote' => ['group' => 'Users', 'label' => 'Change user roles', 'description' => 'Assign roles to users.'],

        'settings.view' => ['group' => 'Settings', 'label' => 'View settings', 'description' => 'Open user and role settings.'],
        'roles.view' => ['group' => 'Roles & Permissions', 'label' => 'View roles', 'description' => 'View the role list.'],
        'roles.create' => ['group' => 'Roles & Permissions', 'label' => 'Create roles', 'description' => 'Create custom roles.'],
        'roles.edit' => ['group' => 'Roles & Permissions', 'label' => 'Edit roles', 'description' => 'Rename custom roles.'],
        'roles.delete' => ['group' => 'Roles & Permissions', 'label' => 'Delete roles', 'description' => 'Delete unused custom roles.'],
        'permissions.manage' => ['group' => 'Roles & Permissions', 'label' => 'Manage role permissions', 'description' => 'Change permissions and sub-activity access assigned to roles.'],
    ],

    'roles' => [
        'SUPER_ADMIN' => ['label' => 'Super Admin', 'description' => 'Manage all application and RBAC settings.', 'permissions' => ['*']],
        'ADMIN' => ['label' => 'Admin', 'description' => 'Manage users, areas, activities, and report operations.', 'permissions' => [
            'areas.view', 'areas.view.all', 'areas.create', 'areas.edit', 'areas.delete',
            'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign.area', 'users.promote',
            'reports.view.all', 'reports.create', 'reports.export', 'reports.delete.all', 'reports.solve.all', 'settings.view',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'permissions.manage',
        ]],
        'MANAGER' => ['label' => 'Manager', 'description' => 'Review reports for assigned activities; capabilities can be adjusted through permissions.', 'permissions' => [
            'areas.view', 'activities.view',
            'reports.review.area', 'reports.export',
        ]],
        'SUPERVISOR' => ['label' => 'Supervisor', 'description' => 'Create reports and handle issues within assigned areas.', 'permissions' => [
            'reports.view.own', 'reports.create', 'reports.export', 'reports.edit.own', 'reports.delete.own', 'reports.solve.own.area', 'areas.view', 'activities.view',
        ]],
        'USER' => ['label' => 'User', 'description' => 'Create and manage their own reports.', 'permissions' => [
            'reports.view.own', 'reports.create', 'reports.export', 'reports.edit.own', 'reports.delete.own',
        ]],
    ],
];
