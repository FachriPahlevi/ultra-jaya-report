import { useState, useEffect } from "react"
import { useForm, router } from "@inertiajs/react"
import AppLayout from "@/Layouts/AppLayout"
import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"

export default function MasterArea({ areas = { data: [], links: [], meta: {} } }) {
    const [showModal, setShowModal] = useState(false)
    const [editTarget, setEditTarget] = useState(null)

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: "",
        description: "",
    })

    const openAdd = () => {
        setEditTarget(null)
        reset()
        clearErrors()
        setShowModal(true)
    }

    const openEdit = (area) => {
        setEditTarget(area)
        setData({
            name: area.name,
            description: area.description ?? "",
        })
        clearErrors()
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        reset()
        clearErrors()
    }

    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key === "Escape" && showModal) {
                closeModal()
            }
        }
        window.addEventListener("keydown", handleKeydown)
        return () => window.removeEventListener("keydown", handleKeydown)
    }, [showModal])

    const submit = (e) => {
        e.preventDefault()
        if (editTarget) {
            put(`/master-area/${editTarget.id}`, { onSuccess: closeModal })
        } else {
            post("/master-area", { onSuccess: closeModal })
        }
    }

    const deleteArea = (area) => {
        if (!window.confirm(`Delete area "${area.name}"?`)) return
        router.delete(`/master-area/${area.id}`)
    }

    return (
        <AppLayout title="Master Area">
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>

            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Master Area</h2>
                    </div>
                    <BtnDefault onClick={openAdd}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[15px] h-[15px]">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Area
                    </BtnDefault>
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-[11px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border">
                                <th className="p-2.5">No</th>
                                <th className="p-2.5">Name</th>
                                <th className="p-2.5">Description</th>
                                <th className="p-2.5">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {areas.data.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-10 text-center text-muted-foreground text-[13px]">
                                        No areas found
                                    </td>
                                </tr>
                            ) : (
                                areas.data.map((area, i) => (
                                    <tr key={area.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-2.5 text-[13px] text-muted-foreground font-semibold">
                                            {(areas.meta?.from ?? 0) + i}
                                        </td>
                                        <td className="p-2.5 text-[13px] font-semibold text-foreground">{area.name}</td>
                                        <td className="p-2.5 text-[13px] text-foreground">{area.description ?? "-"}</td>
                                        <td className="p-2.5">
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => openEdit(area)}
                                                    className="px-3 py-1.5 bg-accent text-primary border-none rounded-md text-xs font-semibold cursor-pointer transition-colors hover:bg-primary/20"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteArea(area)}
                                                    className="px-3 py-1.5 bg-destructive/10 text-destructive border-none rounded-md text-xs font-semibold cursor-pointer transition-colors hover:bg-destructive/20"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {areas.links?.length > 3 && (
                        <div className="px-5 py-3.5 border-t border-border flex gap-1 flex-wrap">
                            {areas.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                                        link.active
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "bg-card border-border text-muted-foreground"
                                    } ${!link.url ? "opacity-40 cursor-default" : "cursor-pointer"}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div
                    className="fixed inset-0 bg-black/40 z-[400] flex items-center justify-center p-4"
                    style={{ animation: "fadeIn 0.15s ease" }}
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    tabIndex="-1"
                >
                    <div
                        className="bg-card rounded-2xl p-7 w-full max-w-[400px] shadow-xl"
                        style={{ animation: "slideUp 0.2s ease" }}
                        onClick={(e) => e.stopPropagation()}
                        role="document"
                    >
                        <h3 className="text-[17px] font-bold text-foreground m-0 mb-5">
                            {editTarget ? "Edit Area" : "Add Area"}
                        </h3>

                        <form onSubmit={submit} className="flex flex-col gap-4">
                                <InputText
                                    id="a-name"
                                    label="Name"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="Area name"
                                    error={errors.name}
                                />
                                <InputText
                                    id="a-desc"
                                    label="Description"
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    placeholder="Optional description"
                                    error={errors.description}
                                />

                            <div className="flex gap-2.5 mt-2">
                                <BtnDefault
                                    outline
                                    onClick={closeModal}
                                    className="flex-1"
                                >
                                    Cancel
                                </BtnDefault>
                                <BtnDefault
                                    type="submit"
                                    loading={processing}
                                    className="flex-[2]"
                                >
                                    {processing ? "Saving..." : editTarget ? "Save Changes" : "Add Area"}
                                </BtnDefault>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}