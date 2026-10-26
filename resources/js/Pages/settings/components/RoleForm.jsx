import { getRequestErrorMessage } from "@/lib/errorMessages"
// resources/js/Components/Settings/RoleForm.jsx
import { useState, useEffect } from "react"
import { router } from "@inertiajs/react"
import { createRole, updateRole } from "@/Pages/settings/api/rbacApi"
import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import { useStatusModal } from "@/Components/Context/StatusModalContext"

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
      <ModalPanel width="sm">
        <ModalHeader title={role ? "Edit role" : "Create role"} description="Set the role name. Manage its permissions separately." onClose={onClose} />
        <ModalBody>
        <form id="role-form" onSubmit={handleSubmit}>
          <InputText label="Role Name" placeholder="Enter role name" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
        </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault variant="outline" onClick={onClose} className="w-full rounded-xl">Cancel</BtnDefault>
          <BtnDefault form="role-form" type="submit" loading={processing} className="w-full rounded-xl">{role ? "Update Role" : "Create Role"}</BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
