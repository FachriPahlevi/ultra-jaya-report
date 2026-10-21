import { usePage } from "@inertiajs/react";

type AuthorizationPageProps = {
    auth?: { user?: { permissions?: string[] } | null };
    [key: string]: unknown;
};

export function useAuthorization() {
    const { props } = usePage<AuthorizationPageProps>();
    const permissions = new Set(props.auth?.user?.permissions ?? []);

    return {
        can: (permission: string) => permissions.has(permission),
        canAny: (required: string[]) => required.some((permission) => permissions.has(permission)),
        canAll: (required: string[]) => required.every((permission) => permissions.has(permission)),
    };
}
