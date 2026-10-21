import { getRequestErrorMessage } from "@/lib/errorMessages";
import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import http from "@/lib/http";
import AppLayout from "@/Layouts/AppLayout";
import BtnDefault from "@/Components/Button/BtnDefault";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlinePlus } from "react-icons/hi";
import AreaListSection from "./components/AreaListSection";
import AreaFormModal from "./components/AreaFormModal";
import { useAuthorization } from "@/hooks/useAuthorization";

const INITIAL_FORM = {
    name: "",
    pic_user_ids: [],
    is_active: true,
};

function buildAreaForm(area) {
    return {
        name: area.area,
        pic_user_ids: area.pic_user_ids?.map(String) || [],
        is_active: area.is_active ?? true,
    };
}

export default function Index({ areas = { data: [], links: [], meta: {} } }) {
    const { props } = usePage();
    const { can } = useAuthorization();
    const { setStatusModalProps } = useStatusModal();
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});

    const users = props.users || [];
    const canAssignPic = can("areas.assign.supervisor");

    const canAdd = can("areas.create");
    const canEdit = can("areas.edit");
    const canDelete = can("areas.delete");
    const totalAreas = areas.meta?.total ?? areas.data.length;
    const picOptions = users.map((user) => ({
        value: String(user.id),
        label: user.name,
        description: user.assigned_area_name ? (editTarget?.id === user.assigned_area_id ? `Assigned to this area` : `Already assigned to ${user.assigned_area_name}`) : "Available to assign",
        disabled: Boolean(user.assigned_area_id && editTarget?.id !== user.assigned_area_id),
    }));

    useEffect(() => {
        if (showModal && editTarget) {
            setForm(buildAreaForm(editTarget));
        } else if (showModal && !editTarget) {
            setForm(INITIAL_FORM);
        }
    }, [showModal, editTarget]);

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const reloadPage = () => {
        setTimeout(() => {
            router.reload();
        }, 1500);
    };

    const showRequestError = (error) => {
        const errorMessage = getRequestErrorMessage(error);
        showStatusModal("error", "Error", errorMessage);
    };

    const openConfirmModal = ({ type = "warning", title, message, confirmText, onConfirm, confirmVariant }) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: {
                text: confirmText,
                variant: confirmVariant,
                onClick: onConfirm,
            },
            button2: { text: "Cancel" },
        });
    };

    const openAdd = () => {
        setEditTarget(null);
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (area) => {
        setEditTarget(area);
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTarget(null);
        setErrors({});
    };

    const handleFormChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: "" }));
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (processing) return;

        setProcessing(true);
        setErrors({});

        const submitData = {
            name: form.name,
            pic_user_ids: form.pic_user_ids.map(Number),
            is_active: form.is_active,
        };

        try {
            if (editTarget) {
                await http.put(`/areas/${editTarget.id}`, submitData);
                showStatusModal("success", "Success", `Area "${form.name}" has been updated`);
            } else {
                await http.post("/areas", submitData);
                showStatusModal("success", "Success", `Area "${form.name}" has been created`);
            }

            setTimeout(() => {
                router.reload();
                closeModal();
            }, 1500);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                showStatusModal("error", "Validation Error", getRequestErrorMessage(error));
            } else {
                showRequestError(error);
            }
        } finally {
            setProcessing(false);
        }
    };

    const confirmDelete = (area) => {
        openConfirmModal({
            type: "warning",
            title: "Archive Area",
            message: `Area "${area.area}" will be moved to deleted state and can still be restored later.`,
            confirmText: "Archive",
            confirmVariant: "danger",
            onConfirm: () => {
                router.delete(`/areas/${area.id}`, {
                    onSuccess: () => {
                        showStatusModal("success", "Success", `Area "${area.area}" has been archived`);
                        reloadPage();
                    },
                    onError: (error) => {
                        showRequestError(error);
                    },
                });
            },
        });
    };

    const confirmToggleStatus = (area) => {
        const nextStatus = !area.is_active;

        openConfirmModal({
            type: "warning",
            title: `${nextStatus ? "Activate" : "Deactivate"} Area`,
            message: nextStatus
                ? `Area "${area.area}" will become available again in report selection and active listings.`
                : `Area "${area.area}" will stay stored, but it will no longer be available in active selections.`,
            confirmText: nextStatus ? "Activate" : "Deactivate",
            onConfirm: async () => {
                try {
                    await http.patch(`/areas/${area.id}/status`, { is_active: nextStatus });
                    showStatusModal("success", "Success", `Area "${area.area}" has been ${nextStatus ? "activated" : "deactivated"}`);
                    reloadPage();
                } catch (error) {
                    showRequestError(error);
                }
            },
        });
    };

    const confirmRestore = (area) => {
        openConfirmModal({
            type: "warning",
            title: "Restore Area",
            message: `Area "${area.area}" will be restored and returned to the directory.`,
            confirmText: "Restore",
            onConfirm: async () => {
                try {
                    await http.patch(`/areas/${area.id}/restore`);
                    showStatusModal("success", "Success", `Area "${area.area}" has been restored`);
                    reloadPage();
                } catch (error) {
                    showRequestError(error);
                }
            },
        });
    };

    const confirmForceDelete = (area) => {
        openConfirmModal({
            type: "error",
            title: "Delete Permanently",
            message: `Area "${area.area}" will be removed permanently. This action cannot be undone.`,
            confirmText: "Delete Permanently",
            confirmVariant: "danger",
            onConfirm: async () => {
                try {
                    await http.delete(`/areas/${area.id}/force`);
                    showStatusModal("success", "Success", `Area "${area.area}" has been permanently deleted`);
                    reloadPage();
                } catch (error) {
                    showRequestError(error, "Failed to permanently delete area");
                }
            },
        });
    };

    if (!areas || !areas.data) {
        return (
            <AppLayout title="Master Area">
                <Head>
                    <title>Master Area</title>
                </Head>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Master Area">
            <Head>
                <title>Master Area</title>
            </Head>
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Area</h1>
                    </div>
                    {canAdd && (
                        <BtnDefault onClick={openAdd} size="md" className="h-11 min-w-[140px] gap-2 rounded-2xl px-5 shadow-none">
                            <HiOutlinePlus className="h-4 w-4" />
                            Add Area
                        </BtnDefault>
                    )}
                </div>

                <AreaListSection
                    areas={areas}
                    totalAreas={totalAreas}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={openEdit}
                    onToggleStatus={confirmToggleStatus}
                    onArchive={confirmDelete}
                    onRestore={confirmRestore}
                    onForceDelete={confirmForceDelete}
                />
            </div>

            <AreaFormModal
                isOpen={showModal}
                onClose={closeModal}
                onSubmit={submit}
                editTarget={editTarget}
                form={form}
                errors={errors}
                processing={processing}
                canAssignPic={canAssignPic}
                picOptions={picOptions}
                onFieldChange={handleFormChange}
            />
        </AppLayout>
    );
}
