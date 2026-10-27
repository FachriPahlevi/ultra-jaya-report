import { router } from "@inertiajs/react"
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react"
import { HiOutlineMinus } from "react-icons/hi"
import BtnDefault from "@/Components/Button/BtnDefault"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import { useRolePermissions } from "@/Pages/settings/hooks/useRolePermissions"
import { groupPermissions, togglePermissions } from "@/Pages/settings/utils/permissions"
import { getRequestErrorMessage } from "@/lib/errorMessages"
import type { AuthUser, Permission, Role } from "@/Pages/settings/types"
import { useAuthorization } from "@/hooks/useAuthorization"

type PermissionChangeHandler = (permissionNames: string[]) => void

type PermissionOptionProps = {
  permission: Permission
  isSelected: boolean
  isDisabled: boolean
  onChange: PermissionChangeHandler
}

function PermissionOption({ permission, isSelected, isDisabled, onChange }: PermissionOptionProps) {
  const handleChange = () => onChange([permission.name])

  return (
    <label
      aria-label={permission.label}
      htmlFor={`permission-${permission.id}`}
      className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50 has-[:checked]:bg-primary/5"
    >
      <input
        id={`permission-${permission.id}`}
        checked={isSelected}
        disabled={isDisabled}
        type="checkbox"
        onChange={handleChange}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{permission.label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{permission.description}</span>
      </span>
    </label>
  )
}

type PermissionGroupProps = {
  group: string
  permissions: Permission[]
  selectedPermissions: string[]
  isDisabled: boolean
  onChange: PermissionChangeHandler
}

function PermissionGroup({ group, permissions, selectedPermissions, isDisabled, onChange }: PermissionGroupProps) {
  const permissionNames = permissions.map(({ name }) => name)
  const selectedCount = permissionNames.filter((name) => selectedPermissions.includes(name)).length
  const isSelected = selectedCount === permissionNames.length
  const isPartiallySelected = selectedCount > 0 && !isSelected
  const handleGroupChange = () => onChange(permissionNames)

  return (
    <fieldset className="rounded-2xl border border-border bg-background p-4">
      <legend className="sr-only">Permission {group}</legend>
      <div className="mb-3 flex items-center gap-3">
        <button
          aria-checked={isPartiallySelected ? "mixed" : isSelected}
          aria-label={`Select all ${group} permissions`}
          className="flex h-4 w-4 items-center justify-center rounded border border-border bg-card text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isDisabled}
          role="checkbox"
          type="button"
          onClick={handleGroupChange}
        >
          {isSelected && <span aria-hidden="true">✓</span>}
          {isPartiallySelected && <HiOutlineMinus aria-hidden="true" className="h-3 w-3" />}
        </button>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{group}</h3>
          <p className="text-xs text-muted-foreground">
            {selectedCount} of {permissionNames.length} permissions selected
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {permissions.map((permission) => (
          <PermissionOption key={permission.id} isDisabled={isDisabled} isSelected={selectedPermissions.includes(permission.name)} permission={permission} onChange={onChange} />
        ))}
      </div>
    </fieldset>
  )
}

type PermissionEditorModalProps = {
  isOpen: boolean
  onClose: () => void
  role: Role | null
  permissions: Permission[]
  auth: { user?: AuthUser }
}

export default function PermissionEditorModal({ isOpen, onClose, role, permissions, auth }: PermissionEditorModalProps) {
  const { setStatusModalProps } = useStatusModal()
  const { can } = useAuthorization()
  const { isSaving, savePermissions } = useRolePermissions()
  const [search, setSearch] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const canManagePermissions = can("permissions.manage") && (role?.name !== "SUPER_ADMIN" || (auth.user?.roles.includes("SUPER_ADMIN") ?? false))

  useEffect(() => {
    if (isOpen) {
      setSearch("")
      setSelectedPermissions(role?.permissions.map(({ name }) => name) ?? [])
    }
  }, [isOpen, role])

  const allPermissionNames = useMemo(() => permissions.map(({ name }) => name), [permissions])
  const visibleGroups = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase()
    const groups = groupPermissions(permissions)

    if (!searchTerm) {
      return Object.entries(groups)
    }

    return Object.entries(groups)
      .map(([group, groupItems]) => [group, groupItems.filter(({ label, description }) => `${label} ${description}`.toLocaleLowerCase().includes(searchTerm))] as const)
      .filter(([, groupItems]) => groupItems.length > 0)
  }, [permissions, search])

  const updateSelection = useCallback((permissionNames: string[]) => {
    setSelectedPermissions((currentPermissions) => togglePermissions(currentPermissions, permissionNames))
  }, [])

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)
  const handleToggleAll = () => updateSelection(allPermissionNames)

  const handleSave = async () => {
    if (!role || !canManagePermissions) {
      return
    }

    try {
      await savePermissions(role.id, selectedPermissions)
      setStatusModalProps({ isOpen: true, type: "success", title: "Success", message: "Role permissions were updated.", button1: { text: "OK" }, button2: null })
      onClose()
      router.reload()
    } catch (error) {
      setStatusModalProps({
        isOpen: true,
        type: "error",
        title: "Failed",
        message: getRequestErrorMessage(error as Parameters<typeof getRequestErrorMessage>[0]),
        button1: { text: "OK" },
        button2: null,
      })
    }
  }

  if (!role) {
    return null
  }

  const isAllSelected = allPermissionNames.length > 0 && allPermissionNames.every((name) => selectedPermissions.includes(name))

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel width="wide">
        <ModalHeader title={`Permissions for ${role.name}`} description="Choose what users with this role can access and manage." onClose={onClose} />
        <ModalBody>
          {!canManagePermissions && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">You do not have permission to update this role.</p>}
          <div className="mb-5 space-y-3 border-b border-border pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BtnDefault disabled={!canManagePermissions} size="sm" onClick={handleToggleAll}>
                {isAllSelected ? "Clear all" : "Select all"}
              </BtnDefault>
              <span className="text-sm text-muted-foreground">
                {selectedPermissions.length} of {allPermissionNames.length} permissions selected
              </span>
            </div>
            <label>
              <span className="sr-only">Search permissions</span>
              <input
                value={search}
                type="search"
                placeholder="Search permissions"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                onChange={handleSearchChange}
              />
            </label>
          </div>
          <div className="space-y-4">
            {visibleGroups.map(([group, groupItems]) => (
              <PermissionGroup key={group} group={group} permissions={groupItems} selectedPermissions={selectedPermissions} isDisabled={!canManagePermissions} onChange={updateSelection} />
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <BtnDefault variant="outline" onClick={onClose} className="w-full">
            Cancel
          </BtnDefault>
          <BtnDefault disabled={!canManagePermissions} loading={isSaving} onClick={handleSave} className="w-full">
            Save Permissions
          </BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
