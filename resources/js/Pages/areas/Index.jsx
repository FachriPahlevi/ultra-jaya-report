import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import AppLayout from "@/Layouts/AppLayout";
import InputText from "@/Components/Input/InputText";
import MultiSelectChecklist from "@/Components/Input/MultiSelectChecklist";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from "react-icons/hi";
import { Building2, FileText, ShieldCheck, Users } from "lucide-react";

function AreaStatCard({ title, value, note, icon }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[12px] font-medium text-muted-foreground">{title}</p>
                    <p className="mt-3 text-[32px] font-bold leading-none tracking-tight text-foreground">{value}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">{icon}</div>
            </div>
        </div>
    );
}

function AreaPicChips({ pics = [], compact = false }) {
    if (!pics.length) {
        return <span className="text-[12px] text-muted-foreground">No PIC assigned</span>;
    }

    return (
        <div className={`flex flex-wrap items-center gap-2 ${compact ? "max-w-full" : ""}`}>
            {pics.length > 1 && <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{pics.length} PIC</span>}
            {pics.map((pic) => (
                <span key={pic.id} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-700">
                    {pic.name}
                </span>
            ))}
        </div>
    );
}

function AreaPagination({ links = [] }) {
    if (links.length <= 3) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 sm:px-6">
            {links.map((link, idx) => (
                <BtnDefault key={idx} size="sm" outline={!link.active} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="min-w-[36px] rounded-xl px-2.5">
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                </BtnDefault>
            ))}
        </div>
    );
}

export default function Index({ areas = { data: [], links: [], meta: {} } }) {
    const { props } = usePage();
    const { setStatusModalProps } = useStatusModal();
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ name: "", pic_user_ids: [] });
    const [errors, setErrors] = useState({});

    const permissions = props.auth?.user?.permissions || [];
    const users = props.users || [];
    const canAssignPic = permissions.includes("areas.assign.supervisor");

    const canAdd = permissions.includes("areas.create");
    const canEdit = permissions.includes("areas.edit");
    const canDelete = permissions.includes("areas.delete");
    const totalAreas = areas.meta?.total ?? areas.data.length;
    const areasWithPic = areas.data.filter((area) => area.pics?.length).length;
    const totalVisiblePics = areas.data.reduce((total, area) => total + (area.pics?.length ?? 0), 0);
    const picOptions = users.map((user) => ({
        value: String(user.id),
        label: user.name,
        description: user.assigned_area_name ? (editTarget?.id === user.assigned_area_id ? `Assigned to this area` : `Already assigned to ${user.assigned_area_name}`) : "Available to assign",
        disabled: Boolean(user.assigned_area_id && editTarget?.id !== user.assigned_area_id),
    }));

    useEffect(() => {
        if (showModal && editTarget) {
            setForm({
                name: editTarget.area,
                pic_user_ids: editTarget.pic_user_ids?.map(String) || [],
            });
        } else if (showModal && !editTarget) {
            setForm({ name: "", pic_user_ids: [] });
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
        };

        try {
            if (editTarget) {
                await axios.put(`/areas/${editTarget.id}`, submitData);
                showStatusModal("success", "Success", `Area "${form.name}" has been updated`);
            } else {
                await axios.post("/areas", submitData);
                showStatusModal("success", "Success", `Area "${form.name}" has been created`);
            }

            setTimeout(() => {
                router.reload();
                closeModal();
            }, 1500);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                const firstError = Object.values(error.response.data.errors)[0];
                showStatusModal("error", "Validation Error", Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                const errorMessage = error.response?.data?.message || error.message || "Something went wrong. Please try again.";
                showStatusModal("error", "Error", errorMessage);
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
                            showStatusModal("success", "Success", `Area "${area.area}" has been deleted`);
                            setTimeout(() => {
                                router.reload();
                            }, 1500);
                        },
                        onError: (error) => {
                            const errorMessage = error.response?.data?.message || "Failed to delete area";
                            showStatusModal("error", "Error", errorMessage);
                        },
                    });
                },
            },
            button2: { text: "Cancel" },
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
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Area</h1>
                        <p className="mt-1 text-[13px] text-muted-foreground">Manage area scope and responsible PIC assignments.</p>
                    </div>
                    {canAdd && (
                        <BtnDefault onClick={openAdd} size="md" className="gap-2 px-6 h-12 rounded-2xl shadow-sm min-w-[148px]">
                            <HiOutlinePlus className="w-4 h-4" />
                            Add Area
                        </BtnDefault>
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <AreaStatCard title="Total Areas" value={totalAreas} note="All registered area entries" icon={<Building2 className="h-4 w-4" />} />
                    <AreaStatCard title="Visible PIC" value={totalVisiblePics} note="Supervisor assignments in current page" icon={<Users className="h-4 w-4" />} />
                    <AreaStatCard title="Covered Areas" value={areasWithPic} note="Areas already assigned to PIC" icon={<ShieldCheck className="h-4 w-4" />} />
                </div>

                <div className="hidden sm:block overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                                <FileText className="h-4 w-4" />
                            </div>
                            <h3 className="text-[15px] font-bold text-foreground">Area Directory</h3>
                        </div>
                        <span className="text-[13px] font-medium text-muted-foreground">{totalAreas} records</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-background text-left">
                                    {["No", "Area Name", "PIC Area", "Actions"].map((col) => (
                                        <th key={col} className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {areas.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-16 text-center text-[13px] text-muted-foreground">
                                            No areas found
                                        </td>
                                    </tr>
                                ) : (
                                    areas.data.map((area, i) => (
                                        <tr key={area.id} className="align-top transition-colors hover:bg-muted/20">
                                            <td className="px-5 py-4 text-[13px] font-semibold text-foreground w-12">{(areas.meta?.from ?? 1) + i}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <p className="text-[14px] font-semibold text-foreground">{area.area}</p>
                                            </td>
                                            <td className="px-5 py-4 min-w-[260px]">
                                                <AreaPicChips pics={area.pics} />
                                            </td>
                                            <td className="px-5 py-4 w-[120px]">
                                                <div className="flex items-center gap-2">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => openEdit(area)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                                                            title="Edit"
                                                        >
                                                            <HiOutlinePencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => confirmDelete(area)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-destructive transition-colors hover:bg-destructive/5"
                                                            title="Delete"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <AreaPagination links={areas.links} />
                </div>

                <div className="flex sm:hidden flex-col gap-3">
                    {areas.data.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <p className="text-[16px] font-semibold text-foreground">No areas found</p>
                            <p className="mt-1 text-[13px] text-muted-foreground">Area data will appear here after it is created.</p>
                        </div>
                    ) : (
                        areas.data.map((area, i) => (
                            <div key={area.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">#{(areas.meta?.from ?? 1) + i}</p>
                                        <h3 className="mt-1 text-[15px] font-bold text-foreground leading-tight">{area.area}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEdit(area)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                                                title="Edit"
                                            >
                                                <HiOutlinePencil className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => confirmDelete(area)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-destructive transition-colors hover:bg-destructive/5"
                                                title="Delete"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-border pt-4">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">PIC Area</p>
                                    <AreaPicChips pics={area.pics} compact />
                                </div>
                            </div>
                        ))
                    )}

                    {areas.links?.length > 3 && (
                        <div className="rounded-2xl border border-border bg-card shadow-sm">
                            <AreaPagination links={areas.links} />
                        </div>
                    )}
                </div>
            </div>

            <ModalOverlay isOpen={showModal} onClose={closeModal}>
                <div className="w-full max-w-[560px] rounded-2xl border border-border bg-card shadow-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                        <div>
                            <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">{editTarget ? "Edit Area" : "Add New Area"}</h2>
                            <p className="mt-1 text-[12.5px] text-muted-foreground">
                                {editTarget ? `Update area detail and PIC assignment for ${editTarget.area}.` : "Create a new area and assign the responsible PIC."}
                            </p>
                        </div>
                        <button onClick={closeModal} className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-5 py-4">
                        <div className="flex flex-col gap-4">
                            <InputText label="Area Name" placeholder="Enter area name" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} error={errors.name} required />

                            {canAssignPic && (
                                <div>
                                    <MultiSelectChecklist
                                        label="PIC Area"
                                        values={form.pic_user_ids}
                                        options={picOptions}
                                        onChange={(nextValues) => handleFormChange("pic_user_ids", nextValues)}
                                        error={errors.pic_user_ids}
                                        helperText="You can assign one or more PIC for the same area."
                                        searchPlaceholder="Search supervisor..."
                                        emptyText="No supervisor found."
                                    />
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                                <BtnDefault outline onClick={closeModal} className="w-full sm:w-auto sm:min-w-[116px]">
                                    Cancel
                                </BtnDefault>
                                <BtnDefault onClick={submit} loading={processing} className="w-full sm:w-auto sm:min-w-[156px]">
                                    {processing ? "Saving..." : editTarget ? "Update Area" : "Create Area"}
                                </BtnDefault>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalOverlay>
        </AppLayout>
    );
}
