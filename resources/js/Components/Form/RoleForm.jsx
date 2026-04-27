// resources/js/Components/Settings/RoleForm.jsx
import { useState } from "react";
import { router } from "@inertiajs/react";
import InputText from "@/Components/Input/InputText";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function RoleForm({ isOpen, onClose, role }) {
    const { setStatusModalProps } = useStatusModal();
    const [form, setForm] = useState({ name: role?.name || "" });

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (role) {
                await axios.put(`/settings/roles/${role.id}`, form);
                showStatusModal("success", "Success", "Role updated");
            } else {
                await axios.post("/settings/roles", form);
                showStatusModal("success", "Success", "Role created");
            }
            router.reload();
            onClose();
        } catch (error) {
            showStatusModal("error", "Error", error.response?.data?.message || "Failed to save role");
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[400px]">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">
                        {role ? "Edit Role" : "Add New Role"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <InputText
                        label="Role Name"
                        placeholder="Enter role name"
                        value={form.name}
                        onChange={(e) => setForm({ name: e.target.value })}
                        required
                    />
                    <div className="flex gap-3">
                        <BtnDefault outline onClick={onClose} className="flex-1">Cancel</BtnDefault>
                        <BtnDefault type="submit" className="flex-[2]">Save</BtnDefault>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
}