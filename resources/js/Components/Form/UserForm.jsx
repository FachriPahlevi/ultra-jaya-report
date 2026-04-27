// resources/js/Components/Settings/UserForm.jsx
import { useState } from "react";
import { router } from "@inertiajs/react";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import BtnDefault from "@/Components/Button/BtnDefault";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function UserForm({ isOpen, onClose, user, roles }) {
    const { setStatusModalProps } = useStatusModal();
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.roles?.[0]?.name || "",
        password: "",
    });

    const roleOptions = roles.map((role) => ({
        label: role.name,
        value: role.name,
    }));

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
        setProcessing(true);

        try {
            if (user) {
                await axios.put(`/settings/users/${user.id}`, form);
                showStatusModal("success", "Success", "User updated");
            } else {
                await axios.post("/settings/users", form);
                showStatusModal("success", "Success", "User created");
            }
            router.reload();
            onClose();
        } catch (error) {
            const message = error.response?.data?.message || "Failed to save user";
            showStatusModal("error", "Error", message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px]">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {user ? "Edit User" : "Add New User"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {user ? `Editing ${user.name}` : "Fill in the details below"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <InputText
                        label="Full Name"
                        placeholder="Enter full name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <InputText
                        label="Email Address"
                        type="email"
                        placeholder="Enter email address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <InputDropdown
                        label="Role"
                        placeholder="Select a role"
                        value={form.role}
                        setObject={(item) => setForm({ ...form, role: item.value })}
                        itemList={roleOptions}
                        required
                    />
                    <InputText
                        label={user ? "New Password (optional)" : "Password"}
                        type="password"
                        placeholder={user ? "Leave blank to keep current" : "Enter password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <div className="flex gap-3 pt-4">
                        <BtnDefault outline onClick={onClose} className="flex-1">Cancel</BtnDefault>
                        <BtnDefault type="submit" loading={processing} className="flex-[2]">
                            {user ? "Update User" : "Create User"}
                        </BtnDefault>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
}