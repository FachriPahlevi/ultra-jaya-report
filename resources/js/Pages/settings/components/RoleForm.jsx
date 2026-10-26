import { getRequestErrorMessage } from "@/lib/errorMessages"
// resources/js/Components/Settings/RoleForm.jsx
import { useState, useEffect } from "react"
import { router } from "@inertiajs/react"
import { createRole, updateRole } from "@/Pages/settings/api/rbacApi"
import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlineX } from "react-icons/hi"

export default function RoleForm({ isOpen, onClose, role }) {
  const { setStatusModalProps } = useStatusModal()
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState({ name: "" })

  useEffect(() => {
    if (isOpen) {
      setForm({ name: role?.name || "" })
    }
  }, [isOpen, role])

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

    try {
      if (role) {
        await updateRole(role.id, form)
        showStatusModal("success", "Success", "Role updated")
        router.reload()
        onClose()
      } else {
        await createRole(form)
        showStatusModal("success", "Success", "Role created")
        router.reload()
        onClose()
      }
    } catch (error) {
      const message = getRequestErrorMessage(error)
      showStatusModal("error", "Error", message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-5 rounded-t-[28px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{role ? "Update Role" : "Create Role"}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">{role ? "Edit Role" : "Add New Role"}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <InputText label="Role Name" placeholder="Enter role name" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <BtnDefault variant="outline" onClick={onClose} className="w-full rounded-xl sm:w-auto sm:min-w-[116px]">
              Cancel
            </BtnDefault>
            <BtnDefault type="submit" loading={processing} className="w-full rounded-xl sm:w-auto sm:min-w-[132px]">
              {role ? "Update Role" : "Create Role"}
            </BtnDefault>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}
