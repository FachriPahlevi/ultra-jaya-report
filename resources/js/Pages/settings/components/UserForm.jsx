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
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlineX } from "react-icons/hi"

const emptyUserForm = () => ({ name: "", email: "", role: "", password: "", area_ids: [], sub_area_ids: [] })

function userToForm(user) {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.roles?.[0]?.name ?? "",
    password: "",
    area_ids: user?.managed_areas?.map((area) => String(area.id)) ?? [],
    sub_area_ids: user?.supervised_sub_areas?.map((subArea) => String(subArea.id)) ?? [],
  }
}

export default function UserForm({ isOpen, onClose, user, roles, areas, isSuperadmin }) {
  const { setStatusModalProps } = useStatusModal()
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState(emptyUserForm)

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

  const subAreaOptions = useMemo(
    () =>
      areas.flatMap((area) =>
        area.sub_areas.map((subArea) => ({
          label: subArea.name,
          value: String(subArea.id),
          description: `${area.area} · ${subArea.supervisors_count}/${subArea.max_personnel} SPV`,
          disabled: subArea.supervisors_count >= subArea.max_personnel && !form.sub_area_ids.includes(String(subArea.id)),
        })),
      ),
    [areas, form.sub_area_ids],
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
      area_ids: form.area_ids.map(Number),
      sub_area_ids: form.sub_area_ids.map(Number),
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
      showStatusModal("error", "Periksa Data Anda", getRequestErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-5 rounded-t-[28px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{user ? "Update User" : "Create User"}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">{user ? "Edit User" : "Add New User"}</h2>
            <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">{user ? `Editing ${user.name}` : "Fill in the user details and assign the proper role."}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <InputText label="Full Name" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <InputText label="Email Address" type="email" placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <InputDropdown
            id="user_role"
            label="Role"
            placeholder="Select a role"
            object={roleOptions.find((role) => role.value === form.role) ?? null}
            setObject={(role) => setForm((currentForm) => ({ ...currentForm, role: role.value }))}
            itemList={roleOptions}
            required
          />
          {form.role === "MANAGER" && (
            <MultiSelectChecklist
              label="Area review Manager"
              values={form.area_ids}
              options={areaOptions}
              onChange={(areaIds) => setForm((currentForm) => ({ ...currentForm, area_ids: areaIds }))}
              helperText="Manager hanya dapat melihat dan mereview laporan pada area yang dipilih."
              searchPlaceholder="Cari area..."
              emptyText="Area tidak ditemukan."
              selectionLabel="Area terpilih"
              emptySelectionText="Belum ada area dipilih."
            />
          )}
          {form.role === "SUPERVISOR" && (
            <MultiSelectChecklist
              label="Sub-area tanggung jawab SPV"
              values={form.sub_area_ids}
              options={subAreaOptions}
              onChange={(subAreaIds) => setForm((currentForm) => ({ ...currentForm, sub_area_ids: subAreaIds }))}
              helperText="SPV dapat melihat dan menutup laporan pada sub-area yang dipilih."
              searchPlaceholder="Cari area atau sub-area..."
              emptyText="Sub-area tidak ditemukan."
              selectionLabel="Sub-area terpilih"
              emptySelectionText="Belum ada sub-area dipilih."
            />
          )}
          <InputText
            label={user ? "New Password (optional)" : "Password"}
            type="password"
            placeholder={user ? "Leave blank to keep current" : "Enter password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <BtnDefault variant="outline" onClick={onClose} className="w-full rounded-xl sm:w-auto sm:min-w-[116px]">
              Cancel
            </BtnDefault>
            <BtnDefault type="submit" loading={processing} className="w-full rounded-xl sm:w-auto sm:min-w-[156px]">
              {user ? "Update User" : "Create User"}
            </BtnDefault>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}
