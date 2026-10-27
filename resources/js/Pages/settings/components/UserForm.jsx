import { getRequestErrorMessage } from "@/lib/errorMessages"
// resources/js/Components/Settings/UserForm.jsx
import { useEffect, useMemo, useState } from "react"
import { router } from "@inertiajs/react"
import http from "@/lib/http"
import InputText from "@/Components/Input/InputText"
import InputDropdown from "@/Components/Input/InputDropdown"
import MultiSelectChecklist from "@/Components/Input/MultiSelectChecklist"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { useAuthorization } from "@/hooks/useAuthorization"

const emptyUserForm = () => ({ name: "", email: "", role: "", password: "", area_ids: [] })

function userToForm(user) {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.roles?.[0]?.name ?? "",
    password: "",
    area_ids: user?.managed_areas?.map((area) => String(area.id)) ?? [],
  }
}

export default function UserForm({ isOpen, onClose, user, roles, areas, isSuperadmin }) {
  const { can } = useAuthorization()
  const { setStatusModalProps } = useStatusModal()
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState(emptyUserForm)
  const selectedRole = roles.find((role) => role.name === form.role)
  const selectedPermissions = new Set([...(selectedRole?.permissions?.map((permission) => permission.name) ?? []), ...(user?.direct_permissions ?? [])])
  const canReview = selectedPermissions.has("reports.review.area")

  const roleOptions = useMemo(
    () =>
      roles
        .filter((role) => isSuperadmin || role.name !== "SUPER_ADMIN")
        .map((role) => ({
          label: role.name,
          value: role.name,
        })),
    [isSuperadmin, roles],
  )

  const areaOptions = useMemo(
    () =>
      areas.map((area) => ({
        label: area.area,
        value: String(area.id),
      })),
    [areas],
  )

  useEffect(() => {
    if (isOpen) {
      setForm(userToForm(user))
    }
  }, [isOpen, user])

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    const submitData = {
      name: form.name,
      email: form.email,
      role: form.role,
      ...(can("users.assign.area") ? { area_ids: form.area_ids.map(Number) } : {}),
    }

    if (form.password) {
      submitData.password = form.password
    }

    try {
      if (user) {
        await http.put(`/settings/users/${user.id}`, submitData)
        showStatusModal("success", "Success", "User updated")
        router.reload()
        onClose()
      } else {
        await http.post("/settings/users", submitData)
        showStatusModal("success", "Success", "User created")
        router.reload()
        onClose()
      }
    } catch (error) {
      showStatusModal("error", "Check your information", getRequestErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={user ? "Edit user" : "Create user"} description={user ? `Update ${user.name}'s details and assignments.` : "Enter user details and assign a role."} onClose={onClose} />
        <ModalBody>
          <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputText label="Full Name" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <InputText label="Email Address" type="email" placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <InputDropdown
              id="user_role"
              label="Role"
              disabled={Boolean(user) && !can("users.promote")}
              placeholder="Select a role"
              object={roleOptions.find((role) => role.value === form.role) ?? null}
              setObject={(role) => setForm((currentForm) => ({ ...currentForm, role: role.value }))}
              itemList={roleOptions}
              required
            />
            {can("users.assign.area") && canReview && (
              <MultiSelectChecklist
                label="Reviewer areas"
                values={form.area_ids}
                options={areaOptions}
                onChange={(areaIds) => setForm((currentForm) => ({ ...currentForm, area_ids: areaIds }))}
                helperText="Choose the areas this user reviews. Activity-level assignments are managed from the Activities page."
                searchPlaceholder="Search areas..."
                emptyText="No areas found."
                selectionLabel="Selected areas"
                emptySelectionText="No areas selected."
              />
            )}
            <InputText
              label={user ? "New Password (optional)" : "Password"}
              type="password"
              placeholder={user ? "Leave blank to keep current" : "Enter password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault variant="outline" onClick={onClose} className="w-full rounded-xl">
            Cancel
          </BtnDefault>
          <BtnDefault form="user-form" type="submit" loading={processing} className="w-full rounded-xl">
            {user ? "Update User" : "Create User"}
          </BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
