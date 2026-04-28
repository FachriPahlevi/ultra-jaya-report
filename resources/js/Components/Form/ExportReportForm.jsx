// resources/js/Components/Form/ExportForm.jsx
import { useState } from "react";
import { router } from "@inertiajs/react";
import BtnDefault from "@/Components/Button/BtnDefault";
import InputText from "@/Components/Input/InputText";
import InputDropdown from "@/Components/Input/InputDropdown";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { useStatusModal } from "@/Components/Context/StatusModalContext";
import { HiOutlineX } from "react-icons/hi";

export default function ExportForm({ isOpen, onClose, areas, activities, users }) {
    const { setStatusModalProps } = useStatusModal();
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        type: "excel",
        start_date: "",
        end_date: "",
        area_id: "",
        activity_id: "",
        status: "",
        author_id: "",
    });

    const showStatusModal = (type, title, message) => {
        setStatusModalProps({
            isOpen: true,
            type,
            title,
            message,
            button1: { text: "OK" },
        });
    };

    const typeOptions = [
        { label: "Excel (.xlsx)", value: "excel" },
        { label: "PDF (.pdf)", value: "pdf" },
    ];

    const statusOptions = [
        { label: "All", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Solved", value: "solved" },
    ];

    const areaOptions = [
        { label: "All Areas", value: "" },
        ...areas.map(area => ({ label: area.area, value: area.id })),
    ];

    const activityOptions = [
        { label: "All Activities", value: "" },
        ...activities.map(activity => ({ label: activity.description, value: activity.id })),
    ];

    const authorOptions = [
        { label: "All Users", value: "" },
        ...users.map(user => ({ label: user.name, value: user.id })),
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        const params = new URLSearchParams();
        if (form.start_date) params.append('start_date', form.start_date);
        if (form.end_date) params.append('end_date', form.end_date);
        if (form.area_id) params.append('area_id', form.area_id);
        if (form.activity_id) params.append('activity_id', form.activity_id);
        if (form.status) params.append('status', form.status);
        if (form.author_id) params.append('author_id', form.author_id);

        const url = `/reports/export/${form.type}?${params.toString()}`;
        
        try {
            window.open(url, '_blank');
            showStatusModal("success", "Success", "Export started");
            onClose();
        } catch (error) {
            showStatusModal("error", "Error", "Failed to export");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[500px]">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-bold text-foreground">Export Report</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <InputDropdown
                        label="Export Type"
                        value={form.type}
                        setObject={(item) => setForm({ ...form, type: item.value })}
                        itemList={typeOptions}
                        required
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <InputText
                            label="Start Date"
                            type="date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        />
                        <InputText
                            label="End Date"
                            type="date"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        />
                    </div>
                    <InputDropdown
                        label="Author"
                        value={form.author_id}
                        setObject={(item) => setForm({ ...form, author_id: item.value })}
                        itemList={authorOptions}
                    />

                    <InputDropdown
                        label="Area"
                        value={form.area_id}
                        setObject={(item) => setForm({ ...form, area_id: item.value })}
                        itemList={areaOptions}
                    />

                    <InputDropdown
                        label="Activity"
                        value={form.activity_id}
                        setObject={(item) => setForm({ ...form, activity_id: item.value })}
                        itemList={activityOptions}
                    />

                    <InputDropdown
                        label="Status"
                        value={form.status}
                        setObject={(item) => setForm({ ...form, status: item.value })}
                        itemList={statusOptions}
                    />

                    <div className="flex gap-3 pt-4">
                        <BtnDefault outline onClick={onClose} className="flex-1">Cancel</BtnDefault>
                        <BtnDefault type="submit" loading={processing} className="flex-[2]">
                            Export
                        </BtnDefault>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
}