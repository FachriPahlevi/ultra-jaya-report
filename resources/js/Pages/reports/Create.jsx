import { useForm, usePage, Link } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { ROUTES } from "@/lib/constants.js";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";

export default function Create({ areas = [], activities = [] }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    const [photoPreview, setPhotoPreview] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type_activity: "",
        area_activity: "",
        activity: "",
        issue: "",
        photo: null,
    });

    const handlePhoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("photo", file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();
        post(ROUTES.issueReport, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPhotoPreview(null);
            },
        });
    };

    return (
        <AppLayout title="Issue Report">
            <div className="max-w-[600px]">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Create Issue Report</h2>
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
                        required
                    />

                    <InputDropdown
                        id="area_activity"
                        label="Area Activity"
                        placeholder="Select area..."
                        value={data.area_activity}
                        onChange={(e) => setData("area_activity", e.target.value)}
                        options={areas.map((area) => ({ label: area.name, value: area.id }))}
                        error={errors.area_activity}
                        required
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
                        <label htmlFor="issue" className="text-[13px] font-semibold text-foreground mb-1.5 block">
                            Issue <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            id="issue"
                            value={data.issue}
                            onChange={(e) => setData("issue", e.target.value)}
                            placeholder="Describe the issue in detail..."
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-foreground bg-background outline-none focus:border-primary transition-colors font-inherit resize-y min-h-[90px]"
                        />
                        {errors.issue && <p className="text-xs text-destructive mt-1">{errors.issue}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-semibold text-foreground mb-0">
                                Photo <span className="text-destructive">*</span>
                            </label>
                            <label
                                htmlFor="photo"
                                className="inline-flex items-center gap-1.5 bg-accent text-primary px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-primary/20"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Upload
                            </label>
                            <input id="photo" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                        </div>

                        <div
                            className="border-2 border-dashed rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center bg-muted transition-colors"
                            style={{ borderColor: photoPreview ? "var(--primary)" : "var(--border)" }}
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                            ) : (
                                <div className="text-center text-muted-foreground py-6">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 mx-auto mb-2 opacity-40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    <span className="text-[12.5px]">Click Upload to add a photo</span>
                                </div>
                            )}
                        </div>
                        {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo}</p>}
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
                            {processing ? "Submitting..." : "Submit Report"}
                        </BtnDefault>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
