import { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import InputText from "@/Components/Input/InputText";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineX,
} from "react-icons/hi";

export default function Index({ areas = { data: [], links: [], meta: {} } }) {
    const { setStatusModalProps } = useStatusModal();
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ name: "" });
    const [errors, setErrors] = useState({});

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const openAdd = () => {
        setEditTarget(null);
        setForm({ name: "" });
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (area) => {
        setEditTarget(area);
        setForm({ name: area.area });
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTarget(null);
        setForm({ name: "" });
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
        setProcessing(true);
        setErrors({});

        const submitData = { name: form.name };

        try {
            if (editTarget) {
                await axios.put(`/areas/${editTarget.id}`, submitData);
                showStatusModal(
                    "success",
                    "Success",
                    `Area "${form.name}" has been updated`,
                );
            } else {
                await axios.post("/areas", submitData);
                showStatusModal(
                    "success",
                    "Success",
                    `Area "${form.name}" has been created`,
                );
            }
            router.reload({ only: ["areas"] });
            closeModal();
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                const firstError = Object.values(error.response.data.errors)[0];
                showStatusModal(
                    "error",
                    "Validation Error",
                    Array.isArray(firstError) ? firstError[0] : firstError,
                );
            } else {
                showStatusModal(
                    "error",
                    "Error",
                    "Something went wrong. Please try again.",
                );
            }
        } finally {
            setProcessing(false);
        }
    };

    const confirmDelete = (area) => {
        setStatusModalProps({
            isOpen: true,
            type: "warning",
            title: "Delete Area",
            message: `Are you sure you want to delete area "${area.area}"?`,
            button1: {
                text: "Delete",
                onClick: () => {
                    router.delete(`/areas/${area.id}`, {
                        onSuccess: () => {
                            showStatusModal(
                                "success",
                                "Success",
                                `Area "${area.area}" has been deleted`,
                            );
                        },
                        onError: (error) => {
                            showStatusModal(
                                "error",
                                "Error",
                                "Failed to delete area",
                            );
                        },
                    });
                },
            },
            button2: { text: "Cancel" },
        });
    };

    const deleteArea = (area) => {
        confirmDelete(area);
    };

    return (
        <AppLayout title="Master Area">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">
                            Master Area
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage areas
                        </p>
                    </div>
                    <BtnDefault
                        onClick={openAdd}
                        size="md"
                        className="gap-2 shadow-sm"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Add Area
                    </BtnDefault>
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border bg-muted/20">
                                    <th className="p-3 w-12">No</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3 w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areas.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="py-12 text-center text-muted-foreground"
                                        >
                                            No areas found
                                        </td>
                                    </tr>
                                ) : (
                                    areas.data.map((area, i) => (
                                        <tr
                                            key={area.id}
                                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-3 text-xs text-muted-foreground font-mono">
                                                {(areas.meta?.from ?? 1) + i}
                                            </td>
                                            <td className="p-3 font-medium text-foreground">
                                                {area.area}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEdit(area)
                                                        }
                                                        className="text-primary hover:text-primary/80 transition-colors p-1"
                                                        title="Edit"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            deleteArea(area)
                                                        }
                                                        className="text-destructive hover:text-destructive/80 transition-colors p-1"
                                                        title="Delete"
                                                    >
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {areas.links?.length > 3 && (
                        <div className="px-4 py-3 border-t border-border bg-muted/30 flex gap-1 flex-wrap">
                            {areas.links.map((link, idx) => (
                                <BtnDefault
                                    key={idx}
                                    size="sm"
                                    outline={!link.active}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    className="min-w-[32px] px-2"
                                >
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </BtnDefault>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ModalOverlay isOpen={showModal} onClose={closeModal}>
                <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px]">
                    <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-foreground tracking-[-0.5px] m-0">
                                {editTarget ? "Edit Area" : "Add New Area"}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {editTarget
                                    ? `Editing ${editTarget.area}`
                                    : "Fill in the details below"}
                            </p>
                        </div>
                        <button
                            onClick={closeModal}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                            aria-label="Close"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        <InputText
                            label="Name"
                            placeholder="Enter area name"
                            value={form.name}
                            onChange={(e) =>
                                handleFormChange("name", e.target.value)
                            }
                            error={errors.name}
                            required
                        />

                        <div className="flex items-center gap-3 pt-4">
                            <BtnDefault
                                outline
                                onClick={closeModal}
                                className="flex-1"
                            >
                                Cancel
                            </BtnDefault>
                            <BtnDefault
                                onClick={submit}
                                loading={processing}
                                className="flex-[2]"
                            >
                                {processing
                                    ? "Saving..."
                                    : editTarget
                                      ? "Update Area"
                                      : "Create Area"}
                            </BtnDefault>
                        </div>
                    </div>
                </div>
            </ModalOverlay>
        </AppLayout>
    );
}
