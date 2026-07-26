import InputText from "@/Components/Input/InputText";
import InputSelect from "@/Components/Input/InputSelect";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { HiOutlinePlus, HiOutlineX } from "react-icons/hi";

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
}) {
    const isSubActivityEdit = Boolean(editTarget?.parent_id);

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-[560px] rounded-[28px] border border-border bg-card shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{editTarget ? "Update Activity" : "Create Activity"}</p>
                        <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">{editTarget ? "Edit Activity" : "Add New Activity"}</h2>
                        <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
                            {isBulkSubMode
                                ? "You can add multiple sub activities for one active parent in one submit."
                                : isSubActivityEdit
                                  ? "Sub activity stays available until it is deleted."
                                : form.parent_id
                                  ? "This activity will be saved as a sub activity."
                                  : "Leave parent empty to keep it as a main activity."}
                        </p>
                    </div>
                    <button onClick={onClose} className="shrink-0 rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-5">
                    <div className="flex flex-col gap-4">
                        <InputSelect
                            id="parent_activity"
                            label="Parent Activity"
                            value={form.parent_id}
                            onChange={(e) => onFieldChange("parent_id", e.target.value)}
                            options={parentOptions}
                            placeholder="No parent (main activity)"
                            helperText="Choose a parent only when this item is a sub activity."
                            error={errors.parent_id}
                        />

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
                                helperText="Inactive activity stays stored, but it will not appear in report selections."
                                error={errors.is_active}
                            />
                        )}

                        {isBulkSubMode ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[13px] font-semibold text-foreground">Sub Activities</p>
                                    <BtnDefault type="button" variant="outline" onClick={onAddSubActivityField} className="h-8 rounded-xl px-3 text-[12px]">
                                        <HiOutlinePlus className="h-4 w-4" />
                                        Add Row
                                    </BtnDefault>
                                </div>

                                {form.sub_activities.map((item, index) => (
                                    <div key={index} className="rounded-2xl border border-border p-4">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <p className="text-[12px] font-semibold text-foreground">Sub Activity {index + 1}</p>
                                            {form.sub_activities.length > 1 && (
                                                <button type="button" onClick={() => onRemoveSubActivityField(index)} className="text-[12px] font-medium text-red-600 transition-colors hover:text-red-700">
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <InputText
                                                label="Activity Name"
                                                placeholder="Enter sub activity name"
                                                value={item.name}
                                                onChange={(e) => onSubActivityChange(index, "name", e.target.value)}
                                                error={errors[`sub_activities.${index}.name`]}
                                                required
                                            />

                                            <div className="flex flex-col gap-1.5">
                                                <label htmlFor={`sub_description_${index}`} className="text-[13px] font-semibold text-foreground">
                                                    Description
                                                </label>
                                                <textarea
                                                    id={`sub_description_${index}`}
                                                    rows={3}
                                                    value={item.description}
                                                    onChange={(e) => onSubActivityChange(index, "description", e.target.value)}
                                                    placeholder="Write a short description for this sub activity"
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
                                <InputText label="Activity Name" placeholder="Enter activity name" value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} error={errors.name} required />

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="activity_description" className="text-[13px] font-semibold text-foreground">
                                        Description
                                    </label>
                                    <textarea
                                        id="activity_description"
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => onFieldChange("description", e.target.value)}
                                        placeholder="Write a short description for this activity"
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

                        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                            <BtnDefault variant="outline" onClick={onClose} className="w-full rounded-xl sm:w-auto sm:min-w-[116px]">
                                Cancel
                            </BtnDefault>
                            <BtnDefault onClick={onSubmit} loading={processing} className="w-full rounded-xl sm:w-auto sm:min-w-[156px]">
                                {processing ? "Saving..." : editTarget ? "Update Activity" : isBulkSubMode ? "Create Sub Activities" : "Create Activity"}
                            </BtnDefault>
                        </div>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}
