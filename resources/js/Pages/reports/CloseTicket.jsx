import { useForm, usePage, Link } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { ROUTES } from "@/lib/constants.ts";
import { formatDate } from "@/lib/format.ts";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";

export default function CloseTicket({ report = {}, areas = [], activities = [] }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    
    const [photoBeforePreview, setPhotoBeforePreview] = useState(report.photo ?? null);
    const [photoAfterPreview, setPhotoAfterPreview] = useState(report.photo_after ?? null);

    const { data, setData, post, processing, errors } = useForm({
        type_activity: report.type_activity ?? "",
        area_activity: report.area_activity ?? "",
        activity: report.activity ?? "",
        issue: report.issue ?? "",
        action_plan: report.action_plan ?? "",
        photo: null,
        photo_after: null,
        _method: "put",
    });

    const handlePhotoBefore = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("photo", file);
        setPhotoBeforePreview(URL.createObjectURL(file));
    };

    const handlePhotoAfter = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("photo_after", file);
        setPhotoAfterPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();
        post(`/edit-report/${report.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout title="Close Ticket">
            <div className="max-w-[600px]">
                <div className="mb-6">
                    <div className="text-[11px] font-bold tracking-[3px] text-primary mb-1 uppercase">UPDATE REPORT</div>
                    <h2 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Close Ticket</h2>
                    {report.id && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[12.5px] text-muted-foreground">Report #{report.id}</span>
                            <span className="w-1 h-1 rounded-full bg-border inline-block" />
                            <span className="text-[12.5px] text-muted-foreground">{formatDate(report.created_at)}</span>
                            {report.status === "closed" ? (
                                <span className="text-xs font-semibold text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-full">Closed</span>
                            ) : (
                                <span className="text-xs font-semibold text-[#d97706] bg-[#d97706]/10 px-2 py-0.5 rounded-full">Open</span>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-7 flex flex-col gap-5">
                    <InputText
                        label="Name"
                        value={currentUser?.name ?? ""}
                        disabled
                    />

                    <InputDropdown
                        id="type_activity"
                        label="Type Activity"
                        placeholder="Select type..."
                        value={data.type_activity}
                        onChange={(e) => setData("type_activity", e.target.value)}
                        options={activities.map((act) => ({ label: act.name, value: act.id }))}
                        error={errors.type_activity}
                    />

                    <InputDropdown
                        id="area_activity"
                        label="Area Activity"
                        placeholder="Select area..."
                        value={data.area_activity}
                        onChange={(e) => setData("area_activity", e.target.value)}
                        options={areas.map((area) => ({ label: area.name, value: area.id }))}
                        error={errors.area_activity}
                    />

                    <InputText
                        id="activity"
                        label="Activity"
                        value={data.activity}
                        onChange={(e) => setData("activity", e.target.value)}
                        placeholder="Describe the activity..."
                        error={errors.activity}
                    />

                    <div>
                        <label htmlFor="issue" className="text-[13px] font-semibold text-foreground mb-1.5 block">Issue</label>
                        <textarea
                            id="issue"
                            value={data.issue}
                            onChange={(e) => setData("issue", e.target.value)}
                            placeholder="Describe the issue..."
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-foreground bg-background outline-none focus:border-primary transition-colors font-inherit resize-y min-h-[90px]"
                        />
                        {errors.issue && <p className="text-xs text-destructive mt-1">{errors.issue}</p>}
                    </div>

                    <div>
                        <label htmlFor="action_plan" className="text-[13px] font-semibold text-foreground mb-1.5 block">
                            Action Plan <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            id="action_plan"
                            value={data.action_plan}
                            onChange={(e) => setData("action_plan", e.target.value)}
                            placeholder="What action was taken to solve this issue..."
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-foreground bg-background outline-none focus:border-primary transition-colors font-inherit resize-y min-h-[90px]"
                        />
                        {errors.action_plan && <p className="text-xs text-destructive mt-1">{errors.action_plan}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-semibold text-foreground mb-0">Photos</label>
                            <div className="flex gap-2">
                                <label
                                    htmlFor="photo_before"
                                    className="inline-flex items-center gap-1.5 bg-accent text-primary px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors hover:bg-primary/20"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Upload
                                </label>
                                <input id="photo_before" type="file" accept="image/*" onChange={handlePhotoBefore} className="hidden" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div
                                    className="border-2 border-dashed rounded-xl overflow-hidden min-h-[120px] flex items-center justify-center bg-muted transition-colors"
                                    style={{ borderColor: photoBeforePreview ? "var(--primary)" : "var(--border)" }}
                                >
                                    {photoBeforePreview ? (
                                        <img src={photoBeforePreview} alt="Before" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-muted-foreground p-4 text-xs">No photo</div>
                                    )}
                                </div>
                                <div className="text-center text-[11.5px] text-muted-foreground mt-1.5 font-medium">Before</div>
                            </div>

                            <div>
                                <label htmlFor="photo_after" className="cursor-pointer block">
                                    <div
                                        className="border-2 border-dashed rounded-xl overflow-hidden min-h-[120px] flex items-center justify-center bg-muted transition-colors"
                                        style={{ borderColor: photoAfterPreview ? "var(--primary)" : "var(--border)" }}
                                    >
                                        {photoAfterPreview ? (
                                            <img src={photoAfterPreview} alt="After" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-muted-foreground p-4 text-xs">Click to upload</div>
                                        )}
                                    </div>
                                </label>
                                <input id="photo_after" type="file" accept="image/*" onChange={handlePhotoAfter} className="hidden" />
                                <div className="text-center text-[11.5px] text-muted-foreground mt-1.5 font-medium">After</div>
                            </div>
                        </div>

                        {(errors.photo || errors.photo_after) && (
                            <p className="text-xs text-destructive mt-1">{errors.photo ?? errors.photo_after}</p>
                        )}
                    </div>

                    <div className="flex gap-3 mt-1">
                        <Link
                            href={ROUTES.reportList}
                            className="flex-1 py-2.5 rounded-lg border border-border text-center text-[13.5px] font-semibold text-muted-foreground no-underline bg-card transition-colors hover:bg-muted"
                        >
                            Cancel
                        </Link>
                        <BtnDefault
                            type="submit"
                            loading={processing}
                            className="flex-[2]"
                        >
                            {processing ? "Updating..." : "Update Report"}
                        </BtnDefault>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
