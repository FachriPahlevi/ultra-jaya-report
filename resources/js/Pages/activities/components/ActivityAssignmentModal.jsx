import BtnDefault from "@/Components/Button/BtnDefault"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"

export default function ActivityAssignmentModal({ isOpen, activity, values, options, processing, onChange, onClose, onSubmit }) {
  if (!activity) return null

  const isSubActivity = Boolean(activity.activity_id)
  const roleLabel = isSubActivity ? "Ticket closers" : "Reviewers"

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel width="sm">
        <ModalHeader title={isSubActivity ? "Assign ticket closers" : "Assign reviewers"} description={activity.name} onClose={onClose} />
        <ModalBody>
          <form id="activity-assignment-form" onSubmit={onSubmit}>
          <FilterMultiSelect label={roleLabel} values={values} options={options} onChange={onChange} placeholder={`No ${isSubActivity ? "ticket closers" : "reviewers"} assigned`} />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {isSubActivity
              ? "Select users with permission to close tickets. They must also be assigned to the matching sub-area."
              : "Select users with review permission. This assignment applies to reports under this activity."}
          </p>
          </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault type="button" variant="outline" onClick={onClose} className="w-full">Cancel</BtnDefault>
          <BtnDefault form="activity-assignment-form" type="submit" loading={processing} className="w-full">Save assignees</BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
