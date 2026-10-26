import type { Permission } from "@/Pages/settings/types"

export function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    const group = permission.group || "Lainnya"
    groups[group] ??= []
    groups[group].push(permission)

    return groups
  }, {})
}

export function togglePermissions(currentPermissions: string[], permissionNames: string[]): string[] {
  const isEveryPermissionSelected = permissionNames.every((permission) => currentPermissions.includes(permission))

  return isEveryPermissionSelected ? currentPermissions.filter((permission) => !permissionNames.includes(permission)) : [...new Set([...currentPermissions, ...permissionNames])]
}
