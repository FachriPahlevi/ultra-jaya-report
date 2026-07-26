import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import BtnDefault from "@/Components/Button/BtnDefault";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlinePlus } from "react-icons/hi";
import ActivityListSection from "./components/ActivityListSection";
import ActivityFormModal from "./components/ActivityFormModal";

const INITIAL_FORM = {
    name: "",
    description: "",
    is_active: true,
    parent_id: "",
    sub_activities: [{ name: "", description: "" }],
};

export default function Index({ activities = { data: [], links: [], meta: {} }, parentActivities = [], activityTotals = { all: 0 } }) {
    const { props } = usePage();
    const { setStatusModalProps } = useStatusModal();
    const permissions = props.auth?.user?.permissions || [];
    const canAdd = permissions.includes("activities.create");
    const canEdit = permissions.includes("activities.edit");
    const canDelete = permissions.includes("activities.delete");

    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [isBulkSubMode, setIsBulkSubMode] = useState(false);

    const totalActivities = activityTotals.all || activities.meta?.total || activities.data.length;
    const parentOptions = parentActivities.filter((item) => !editTarget || item.id !== editTarget.id).map((item) => ({ label: item.name, value: String(item.id) }));

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const reloadActivities = () => {
        router.reload({ only: ["activities", "parentActivities"] });
    };

    const showRequestError = (error, fallbackMessage) => {
        if (error.response?.status === 422) {
            const payloadErrors = error.response.data.errors || {};
            setErrors(payloadErrors);
            const firstError = Object.values(payloadErrors)[0];
            showStatusModal("error", "Validation Error", Array.isArray(firstError) ? firstError[0] : firstError);
            return;
        }

        const errorMessage = error.response?.data?.message || error.message || fallbackMessage;
        showStatusModal("error", "Error", errorMessage);
    };

    const openAdd = (parentActivity = null) => {
        setEditTarget(null);
        setForm({
            ...INITIAL_FORM,
            parent_id: parentActivity ? String(parentActivity.id) : "",
            is_active: true,
            sub_activities: [{ name: "", description: "" }],
        });
        setIsBulkSubMode(Boolean(parentActivity));
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (activity) => {
        setEditTarget(activity);
        setForm({
            name: activity.name,
            description: activity.description ?? "",
            is_active: activity.is_active ?? true,
            parent_id: activity.parent_id ? String(activity.parent_id) : "",
            sub_activities: [{ name: "", description: "" }],
        });
        setIsBulkSubMode(false);
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTarget(null);
        setForm(INITIAL_FORM);
        setIsBulkSubMode(false);
        setErrors({});
    };

    const handleFormChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: "" }));
        }
    };

    const handleSubActivityChange = (index, key, value) => {
        setForm((prev) => ({
            ...prev,
            sub_activities: prev.sub_activities.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
        }));
        const errorKey = `sub_activities.${index}.${key}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: "" }));
        }
    };

    const addSubActivityField = () => {
        setForm((prev) => ({
            ...prev,
            sub_activities: [...prev.sub_activities, { name: "", description: "" }],
        }));
    };

    const removeSubActivityField = (index) => {
        setForm((prev) => ({
            ...prev,
            sub_activities: prev.sub_activities.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;

        setProcessing(true);
        setErrors({});

        const submitData = {
            name: form.name,
            description: form.description || null,
            is_active: form.is_active,
            parent_id: form.parent_id || null,
            sub_activities: isBulkSubMode
                ? form.sub_activities.map((item) => ({
                      name: item.name,
                      description: item.description || null,
                  }))
                : undefined,
        };

        try {
            if (editTarget) {
                await axios.put(`/activities/${editTarget.id}`, submitData);
                showStatusModal("success", "Success", `Activity "${form.name}" has been updated`);
            } else {
                await axios.post("/activities", submitData);
                showStatusModal("success", "Success", `Activity "${form.name}" has been created`);
            }

            reloadActivities();
            closeModal();
        } catch (error) {
            showRequestError(error, "Something went wrong. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const confirmToggleStatus = (activity) => {
        const nextStatus = !activity.is_active;

        setStatusModalProps({
            isOpen: true,
            type: "warning",
            title: `${nextStatus ? "Activate" : "Deactivate"} Activity`,
            message: nextStatus ? `Activity "${activity.name}" will be available again in report selection.` : `Activity "${activity.name}" will stay stored, but it will no longer appear in report selection.`,
            button1: {
                text: nextStatus ? "Activate" : "Deactivate",
                onClick: async () => {
                    try {
                        await axios.patch(`/activities/${activity.id}/status`, { is_active: nextStatus });
                        showStatusModal("success", "Success", `Activity "${activity.name}" has been ${nextStatus ? "activated" : "deactivated"}`);
                        reloadActivities();
                    } catch (error) {
                        showRequestError(error, "Failed to update activity status");
                    }
                },
            },
            button2: { text: "Cancel" },
        });
    };

    const confirmDelete = (activity) => {
        setStatusModalProps({
            isOpen: true,
            type: "warning",
            title: "Delete Activity",
            message:
                activity.children_count > 0
                    ? `Activity "${activity.name}" still has ${activity.children_count} sub activities. Remove or move them first.`
                    : `Activity "${activity.name}" will be removed from the directory.`,
            button1: {
                text: "Delete",
                variant: "danger",
                onClick: () => {
                    router.delete(`/activities/${activity.id}`, {
                        onSuccess: () => {
                            showStatusModal("success", "Success", `Activity "${activity.name}" has been deleted`);
                            reloadActivities();
                        },
                        onError: (error) => {
                            showRequestError(error, "Failed to delete activity");
                        },
                    });
                },
            },
            button2: { text: "Cancel" },
        });
    };

    if (!activities || !activities.data) {
        return (
            <AppLayout title="Master Activity">
                <Head>
                    <title>Master Activity</title>
                </Head>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Master Activity">
            <Head>
                <title>Master Activity</title>
            </Head>

            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Activity</h1>
                    {canAdd && (
                        <BtnDefault onClick={() => openAdd()} size="md" className="h-11 min-w-[132px] gap-2 rounded-2xl px-4 shadow-none sm:min-w-[148px] sm:px-5">
                            <HiOutlinePlus className="h-4 w-4" />
                            Add Activity
                        </BtnDefault>
                    )}
                </div>

                <ActivityListSection
                    activities={activities}
                    totalActivities={totalActivities}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onAddSub={openAdd}
                    onEdit={openEdit}
                    onDelete={confirmDelete}
                    onToggleStatus={confirmToggleStatus}
                />
            </div>

            <ActivityFormModal
                isOpen={showModal}
                onClose={closeModal}
                onSubmit={submit}
                editTarget={editTarget}
                form={form}
                errors={errors}
                processing={processing}
                parentOptions={parentOptions}
                onFieldChange={handleFormChange}
                onSubActivityChange={handleSubActivityChange}
                onAddSubActivityField={addSubActivityField}
                onRemoveSubActivityField={removeSubActivityField}
                isBulkSubMode={isBulkSubMode}
            />
        </AppLayout>
    );
}
