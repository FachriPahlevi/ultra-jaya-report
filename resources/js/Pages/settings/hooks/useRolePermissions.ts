import { useCallback, useState } from "react";
import { syncRolePermissions } from "@/Pages/settings/api/rbacApi";

export function useRolePermissions() {
    const [isSaving, setIsSaving] = useState(false);

    const savePermissions = useCallback(async (roleId: number, permissions: string[]) => {
        setIsSaving(true);

        try {
            return await syncRolePermissions(roleId, permissions);
        } finally {
            setIsSaving(false);
        }
    }, []);

    return { isSaving, savePermissions };
}
