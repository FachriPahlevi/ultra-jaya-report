import { useForm, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlinePhotograph, HiOutlineX } from "react-icons/hi";

export default function ReportForm({ isOpen, onClose, areas = [], activities = [], users = [], report = null }) {
    const { setStatusModalProps } = useStatusModal();
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    const firstRole = currentUser?.roles?.[0];
    const userRole = firstRole?.name?.toLowerCase?.() || (typeof firstRole === "string" ? firstRole.toLowerCase() : "user");
    const [photoPreview, setPhotoPreview] = useState(null);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [selectedSubActivity, setSelectedSubActivity] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        author_id: currentUser?.id || "",
        type_activity: "",
        sub_activity_id: "",
        area_activity: "",
        activity: "",
        issue: "",
        photo: null,
    });

    useEffect(() => {
        if (!isOpen) return;

        if (report) {
            setData({
                author_id: report.author_id || currentUser?.id || "",
                type_activity: report.activity_id || "",
                sub_activity_id: report.sub_activity_id || "",
                area_activity: report.area_id || "",
                activity: report.activity || "",
                issue: report.issue || "",
                photo: null,
            });

            const authorOption = users.find((user) => user.id === report.author_id);
            const areaOption = areas.find((area) => area.id === report.area_id);
            const activityOption = activities.find((act) => act.id === report.activity_id);
            const subActivityOption = activityOption?.sub_activities?.find((act) => act.id === report.sub_activity_id);

            setSelectedAuthor(authorOption ? { value: authorOption.id, label: authorOption.name } : null);
            setSelectedArea(areaOption ? { value: areaOption.id, label: areaOption.area } : null);
            setSelectedActivity(activityOption ? { value: activityOption.id, label: activityOption.name } : null);
            setSelectedSubActivity(subActivityOption ? { value: subActivityOption.id, label: subActivityOption.name } : null);
            setPhotoPreview(null);
        } else {
            reset();
            clearErrors();
            setData("author_id", currentUser?.id || "");
            setSelectedAuthor(null);
            setSelectedArea(null);
            setSelectedActivity(null);
            setSelectedSubActivity(null);
            setPhotoPreview(null);
        }
    }, [isOpen, report]);

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("photo", file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleAuthorChange = (item) => {
        setData("author_id", item.value);
        setSelectedAuthor(item);
    };

    const handleTypeActivityChange = (item) => {
        setData("type_activity", item.value);
        setData("sub_activity_id", "");
        setSelectedActivity(item);
        setSelectedSubActivity(null);
    };

    const handleSubActivityChange = (item) => {
        setData("sub_activity_id", item.value);
        setSelectedSubActivity(item);
    };

    const handleAreaActivityChange = (item) => {
        setData("area_activity", item.value);
        setSelectedArea(item);
    };

    const handleActivityChange = (e) => {
        setData("activity", e.target.value);
    };

    const handleIssueChange = (e) => {
        setData("issue", e.target.value);
    };

    const resetForm = () => {
        reset();
        clearErrors();
        setData("author_id", currentUser?.id || "");
        setSelectedAuthor(null);
        setSelectedArea(null);
        setSelectedActivity(null);
        setSelectedSubActivity(null);
        setPhotoPreview(null);
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.author_id) {
            showStatusModal("error", "Error", "User ID is required");
            return;
        }

        const action = report ? put : post;
        const url = report ? `/reports/${report.id}` : "/reports";
        const successMessage = report ? "Report has been updated" : "Report has been created";

        action(url, {
            forceFormData: true,
            onSuccess: () => {
                showStatusModal("success", "Success", successMessage);
                resetForm();
                onClose();
                router.reload();
            },
            onError: (error) => {
                console.error("Error:", error);
                showStatusModal("error", "Error", report ? "Failed to update report" : "Failed to create report");
            },
        });
    };

    const canChangeAuthor = userRole === "super_admin" || userRole === "admin";

    const userOptions = users.map((user) => ({
        label: user.name,
        value: user.id,
    }));
    const selectedParentActivity = activities.find((activity) => String(activity.id) === String(data.type_activity));
    const subActivityOptions =
        selectedParentActivity?.sub_activities?.map((activity) => ({
            label: activity.name,
            value: activity.id,
        })) ?? [];

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleCancel}>
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px] mx-auto">
                <div className="flex justify-between sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-[-0.5px] m-0">{report ? "Edit Issue Report" : "Create Issue Report"}</h2>
                    <button onClick={handleCancel} className="flex items-center gap-2 text-foreground hover:text-destructive transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                        {canChangeAuthor ? (
                            <InputDropdown
                                id="author_id"
                                label="Name"
                                itemList={userOptions}
                                placeholder="Select user..."
                                required
                                setObject={handleAuthorChange}
                                object={selectedAuthor}
                                error={errors.author_id}
                            />
                        ) : (
                            <>
                                <InputText label="Name" value={currentUser?.name ?? ""} disabled />
                                <input type="hidden" name="author_id" value={currentUser?.id} />
                            </>
                        )}

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
                            object={selectedArea}
                            error={errors.area_activity}
                        />

                        <InputDropdown
                            id="type_activity"
                            label="Type Activity"
                            itemList={activities.map((act) => ({
                                label: act.name,
                                value: act.id,
                            }))}
                            placeholder="Select type..."
                            required
                            setObject={handleTypeActivityChange}
                            object={selectedActivity}
                            error={errors.type_activity}
                        />

                        <InputDropdown
                            id="sub_activity_id"
                            label="Sub Activity"
                            itemList={subActivityOptions}
                            placeholder={selectedParentActivity ? "Select sub activity..." : "Select parent activity first"}
                            setObject={handleSubActivityChange}
                            object={selectedSubActivity}
                            disabled={!selectedParentActivity || subActivityOptions.length === 0}
                            error={errors.sub_activity_id}
                        />

                        <InputText id="activity" label="Activity" value={data.activity} onChange={handleActivityChange} placeholder="Describe the activity..." error={errors.activity} />

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
                            {errors.issue && <p className="text-xs text-destructive mt-1">{errors.issue}</p>}
                        </div>

                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <label className="text-[13px] font-semibold text-foreground">
                                    Photo <span className="text-[11px] text-muted-foreground font-normal">(optional)</span>
                                </label>
                                <label
                                    htmlFor="photo"
                                    className="inline-flex items-center justify-center gap-1.5 bg-accent text-primary px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-primary/20 w-full sm:w-auto"
                                >
                                    <HiOutlinePhotograph className="w-3.5 h-3.5" />
                                    Upload
                                </label>
                                <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </div>

                            <div
                                className="border-2 border-dashed rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center bg-muted transition-colors"
                                style={{
                                    borderColor: photoPreview ? "var(--primary)" : "var(--border)",
                                }}
                            >
                                {photoPreview ? (
                                    <ExpandableImage src={photoPreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                                ) : report?.photo_before ? (
                                    <ExpandableImage src={`/storage/${report.photo_before}`} alt="Existing" className="w-full max-h-[240px] object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground py-6">
                                        <HiOutlinePhotograph className="w-9 h-9 mx-auto mb-2 opacity-40" />
                                        <span className="text-[12.5px]">Click Upload to add a photo</span>
                                    </div>
                                )}
                            </div>
                            {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo}</p>}
                        </div>

                        <div className="flex gap-3 mt-1">
                            <BtnDefault type="button" outline onClick={handleCancel} className="w-full sm:flex-1">
                                Cancel
                            </BtnDefault>
                            <BtnDefault type="submit" loading={processing} className="w-full">
                                {processing ? (report ? "Updating..." : "Submitting...") : report ? "Update Report" : "Submit Report"}
                            </BtnDefault>
                        </div>
                    </form>
                </div>
            </div>
        </ModalOverlay>
    );
}
