import BtnDefault from "@/Components/Button/BtnDefault"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"

export default function AreaAssignmentModal({ target, options, values, onChange, onClose, onSubmit, processing, error }) {
  if (!target) return null
  const isSubArea = Boolean(target.subArea)
  return (
    <ModalOverlay isOpen onClose={onClose}>
      <ModalPanel width="sm">
        <ModalHeader title={isSubArea ? "Assign ticket closers" : "Assign reviewers"} description={isSubArea ? `${target.area.area} / ${target.subArea.name}` : target.area.area} onClose={onClose} />
        <ModalBody>
          <form id="area-assignment-form" onSubmit={onSubmit}>
            <FilterMultiSelect label={isSubArea ? "Ticket closers" : "Reviewers"} values={values} options={options} onChange={onChange} placeholder="No users assigned" selectAll />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{isSubArea ? "Ticket closers must also be assigned to the matching sub-activity." : "Select users with review permission for this area."}</p>
            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault type="button" outline onClick={onClose} className="w-full">Cancel</BtnDefault>
          <BtnDefault form="area-assignment-form" type="submit" loading={processing} className="w-full">Save assignees</BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
