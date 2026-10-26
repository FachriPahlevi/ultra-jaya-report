import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"

export default function AreaFormModal({ isOpen, onClose, onSubmit, editTarget, form, errors, processing, onFieldChange }) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={editTarget ? "Edit area" : "Create area"} description="Enter the area name. Assign managers and supervisors in User settings." onClose={onClose} />
        <ModalBody>
            <InputText label="Area Name" placeholder="Enter area name" value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} error={errors.name} required />
        </ModalBody>
        <ModalFooter>
              <BtnDefault outline onClick={onClose} className="w-full rounded-xl">
                Cancel
              </BtnDefault>
              <BtnDefault onClick={onSubmit} loading={processing} className="w-full rounded-xl">
                {processing ? "Saving..." : editTarget ? "Update Area" : "Create Area"}
              </BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
