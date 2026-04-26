import { useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ROUTES } from "@/lib/constants.js";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { HiOutlinePhotograph, HiOutlineX } from "react-icons/hi";

export default function ReportForm({
    isOpen,
    onClose,
    areas = [],
    activities = [],
}) {
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

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("photo", file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleTypeActivityChange = (item) => {
        setData("type_activity", item.value);
    };

    const handleAreaActivityChange = (item) => {
        setData("area_activity", item.value);
    };

    const handleActivityChange = (e) => {
        setData("activity", e.target.value);
    };

    const handleIssueChange = (e) => {
        setData("issue", e.target.value);
    };

    const handleCancel = () => {
        reset();
        setPhotoPreview(null);
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ROUTES.issueReport, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPhotoPreview(null);
                onClose();
            },
        });
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleCancel}>
            <div className="bg-card rounded-2xl border border-border shadow-xl">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-bold text-foreground tracking-[-0.5px] m-0">
                        Create Issue Report
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                        aria-label="Close"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <InputText
                            label="Name"
                            value={currentUser?.name ?? ""}
                            disabled
                        />

                        <InputDropdown
                            id="area_activity"
                            label="Area Activity"
                            itemList={areas.map((area) => ({
                                label: area.area,
                                value: area.id,
                            }))}
                            placeholder="Select area..."
                            required
                            setObject={handleAreaActivityChange}
                            error={errors.area_activity}
                        />

                        <InputDropdown
                            id="type_activity"
                            label="Type Activity"
                            itemList={activities.map((act) => ({
                                label: act.description,
                                value: act.id,
                            }))}
                            placeholder="Select type..."
                            required
                            setObject={handleTypeActivityChange}
                            error={errors.type_activity}
                        />

                        <InputText
                            id="activity"
                            label="Activity"
                            value={data.activity}
                            onChange={handleActivityChange}
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
                                onChange={handleIssueChange}
                                placeholder="Describe the issue in detail..."
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-foreground bg-background outline-none focus:border-primary transition-colors font-inherit resize-y min-h-[90px]"
                            />
                            {errors.issue && (
                                <p className="text-xs text-destructive mt-1">
                                    {errors.issue}
                                </p>
                            )}
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
                                    <HiOutlinePhotograph className="w-3.5 h-3.5" />
                                    Upload
                                </label>
                                <input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </div>

                            <div
                                className="border-2 border-dashed rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center bg-muted transition-colors"
                                style={{
                                    borderColor: photoPreview
                                        ? "var(--primary)"
                                        : "var(--border)",
                                }}
                            >
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-full max-h-[240px] object-cover"
                                    />
                                ) : (
                                    <div className="text-center text-muted-foreground py-6">
                                        <HiOutlinePhotograph className="w-9 h-9 mx-auto mb-2 opacity-40" />
                                        <span className="text-[12.5px]">
                                            Click Upload to add a photo
                                        </span>
                                    </div>
                                )}
                            </div>
                            {errors.photo && (
                                <p className="text-xs text-destructive mt-1">
                                    {errors.photo}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-1">
                            <BtnDefault
                                type="button"
                                outline
                                onClick={handleCancel}
                                className="flex-1"
                                btnText="Cancel"
                            />
                            <BtnDefault
                                type="submit"
                                loading={processing}
                                className="flex-[2]"
                                btnText={processing ? "Submitting..." : "Submit Report"}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </ModalOverlay>
    );
}