import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"

export default function SubAreaFormModal({ isOpen, onClose, onSubmit, area, subArea, name, error, processing, onNameChange }) {
  const isEditing = Boolean(subArea)

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel width="sm">
        <ModalHeader title={isEditing ? "Edit sub-area" : "Create sub-area"} description={`Area: ${area?.area ?? "-"}.`} onClose={onClose} />
        <ModalBody>
          <form id="sub-area-form" onSubmit={onSubmit}>
            <InputText label="Sub-area name" value={name} onChange={(event) => onNameChange(event.target.value)} error={error} placeholder="Enter sub-area name" required />
          </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault type="button" outline onClick={onClose} className="w-full rounded-xl">Cancel</BtnDefault>
          <BtnDefault form="sub-area-form" type="submit" loading={processing} className="w-full rounded-xl">{isEditing ? "Save changes" : "Create sub-area"}</BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
