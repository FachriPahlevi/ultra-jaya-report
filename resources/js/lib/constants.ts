export const ROUTES = {
    dashboard:    '/dashboard',
    reportList:   '/reports',
    issueReport:  '/reports',
    closeTicketReport: '/reports/close',
    masterArea:   '/areas',
    masterActivity: '/activities',
    masterUser:   '/users',
    masterRole:   '/roles',
}

export const ROLES = ['Admin', 'Manager', 'Supervisor', 'User']

export const NAV_ITEMS = [
    { href: ROUTES.dashboard,       label: 'Dashboard',       icon: 'dashboard' },
    { href: ROUTES.reportList,      label: 'Report Lists',    icon: 'reports'   },
    { href: ROUTES.issueReport,     label: 'Issue Report',    icon: 'alert'     },
    { href: ROUTES.masterArea,      label: 'Master Area',     icon: 'geography' },
    { href: ROUTES.masterActivity,  label: 'Master Activity', icon: 'activity'  },
    { href: ROUTES.masterUser,      label: 'Master User',     icon: 'users'     },
]