import InputText from "@/Components/Input/InputText"
import InputSelect from "@/Components/Input/InputSelect"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import { HiOutlinePlus } from "react-icons/hi"

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
  onAddSubActivityField,
  onRemoveSubActivityField,
  isBulkSubMode,
  canManageCategory,
}) {
  const isSubActivityEdit = Boolean(editTarget?.activity_id)

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isSubActivityEdit ? "Edit sub-activity" : isBulkSubMode ? "Add sub-activities" : editTarget ? "Edit activity" : "Create activity"}
          description={isBulkSubMode ? "Add one or more sub-activities to this activity." : isSubActivityEdit ? "Update the selected sub-activity." : "Enter the activity name and description."}
          onClose={onClose}
        />
        <ModalBody>
          <div className="flex flex-col gap-4">
            {form.activity_id && (
              <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                <p className="text-xs font-medium text-muted-foreground">Activity</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{editTarget?.activity?.name ?? parentOptions.find((option) => option.value === form.activity_id)?.label ?? "–"}</p>
              </div>
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
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-foreground">Sub-activities</p>
                  <BtnDefault type="button" variant="outline" onClick={onAddSubActivityField} size="sm">
                    <HiOutlinePlus className="h-5 w-5" />
                    Add row
                  </BtnDefault>
                </div>

                {form.sub_activities.map((item, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold text-foreground">Sub-activity {index + 1}</p>
                      {form.sub_activities.length > 1 && (
                        <button type="button" onClick={() => onRemoveSubActivityField(index)} className="text-[12px] font-medium text-red-600 transition-colors hover:text-red-700">
                          Remove
                        </button>
                      )}
                    </div>

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
          <BtnDefault onClick={onSubmit} loading={processing} className="w-full rounded-xl">{editTarget ? "Save changes" : isBulkSubMode ? "Create sub-activities" : "Create activity"}</BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
