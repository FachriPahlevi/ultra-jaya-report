import InputText from "@/Components/Input/InputText"
import InputSelect from "@/Components/Input/InputSelect"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"

export default function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  editTarget,
  form,
  errors,
  processing,
  parentOptions,
  onFieldChange,
  onSubActivityChange,
  isBulkSubMode,
  canManageCategory,
}) {
  const isSubActivityEdit = Boolean(editTarget?.activity_id)

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isSubActivityEdit ? "Edit sub-activity" : isBulkSubMode ? "Add sub-activity" : editTarget ? "Edit activity" : "Create activity"}
          description={isBulkSubMode ? "Add a sub-activity to this activity." : isSubActivityEdit ? "Update the selected sub-activity." : "Enter the activity name and description."}
          onClose={onClose}
        />
        <ModalBody>
          <div className="flex flex-col gap-4">
            {form.activity_id && (
              <InputText id="parent_activity" label="Activity" value={editTarget?.activity?.name ?? parentOptions.find((option) => String(option.value) === String(form.activity_id))?.label ?? "–"} disabled />
            )}

            {!isBulkSubMode && !isSubActivityEdit && (
              <InputSelect
                id="activity_status"
                label="Status"
                value={String(form.is_active)}
                onChange={(e) => onFieldChange("is_active", e.target.value === "true")}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                helperText="Inactive activities remain saved but cannot be selected in new reports."
                error={errors.is_active}
              />
            )}

            {isBulkSubMode ? (
              <div className="flex flex-col gap-3">
                {form.sub_activities.slice(0, 1).map((item, index) => (
                  <div key={index}>
                    <div className="flex flex-col gap-4">
                      <InputText
                        label="Sub-activity name"
                        placeholder="Enter sub-activity name"
                        value={item.name}
                        onChange={(e) => onSubActivityChange(index, "name", e.target.value)}
                        error={errors[`sub_activities.${index}.name`]}
                        required
                      />

                      {canManageCategory && (
                        <InputSelect
                          id={`sub_category_${index}`}
                          label="Category"
                          value={item.category}
                          onChange={(e) => onSubActivityChange(index, "category", e.target.value)}
                          options={[
                            { value: "REPORT", label: "REPORT" },
                            { value: "ISSUE", label: "ISSUE" },
                          ]}
                          helperText="Only users with category permission can change this field."
                          error={errors[`sub_activities.${index}.category`]}
                          required
                        />
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`sub_description_${index}`} className="text-[13px] font-semibold text-foreground">
                          Description
                        </label>
                        <textarea
                          id={`sub_description_${index}`}
                          rows={3}
                          value={item.description}
                          onChange={(e) => onSubActivityChange(index, "description", e.target.value)}
                          placeholder="Write a short sub-activity description"
                          className={`w-full rounded-xl border bg-card px-3.5 py-2.5 text-[13.5px] text-foreground outline-none transition-all duration-150 ${
                            errors[`sub_activities.${index}.description`]
                              ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/10"
                              : "border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          }`}
                        />
                        {errors[`sub_activities.${index}.description`] && <span className="text-[11.5px] text-destructive">{errors[`sub_activities.${index}.description`]}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InputText label={isSubActivityEdit ? "Sub-activity name" : "Activity name"} placeholder={isSubActivityEdit ? "Enter sub-activity name" : "Enter activity name"} value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} error={errors.name} required />

                {canManageCategory && (Boolean(form.activity_id) || isSubActivityEdit) && (
                  <InputSelect
                    id="activity_category"
                    label="Category"
                    value={form.category}
                    onChange={(e) => onFieldChange("category", e.target.value)}
                    options={[
                      { value: "REPORT", label: "REPORT" },
                      { value: "ISSUE", label: "ISSUE" },
                    ]}
                    helperText="Changing this category does not affect existing reports."
                    error={errors.category}
                    required
                  />
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="activity_description" className="text-[13px] font-semibold text-foreground">
                    Description
                  </label>
                  <textarea
                    id="activity_description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => onFieldChange("description", e.target.value)}
                    placeholder={isSubActivityEdit ? "Write a short sub-activity description" : "Write a short activity description"}
                    className={`w-full rounded-xl border bg-card px-3.5 py-2.5 text-[13.5px] text-foreground outline-none transition-all duration-150 ${
                      errors.description
                        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/10"
                        : "border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    }`}
                  />
                  {errors.description && <span className="text-[11.5px] text-destructive">{errors.description}</span>}
                </div>
              </>
            )}

          </div>
        </ModalBody>
        <ModalFooter>
          <BtnDefault variant="outline" onClick={onClose} className="w-full rounded-xl">Cancel</BtnDefault>
          <BtnDefault onClick={onSubmit} loading={processing} className="w-full rounded-xl">{editTarget ? "Save changes" : isBulkSubMode ? "Create sub-activity" : "Create activity"}</BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
