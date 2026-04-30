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
    area_ids: [],
    activity_ids: [],
    status: "",
    author_ids: [],
    my_reports_only: false,
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

  const handleCheckboxChange = (id, type, checked) => {
    if (type === "area") {
      if (checked) {
        setForm({ ...form, area_ids: [...form.area_ids, id] });
      } else {
        setForm({ ...form, area_ids: form.area_ids.filter((item) => item !== id) });
      }
    } else if (type === "activity") {
      if (checked) {
        setForm({ ...form, activity_ids: [...form.activity_ids, id] });
      } else {
        setForm({ ...form, activity_ids: form.activity_ids.filter((item) => item !== id) });
      }
    } else if (type === "author") {
      if (checked) {
        setForm({ ...form, author_ids: [...form.author_ids, id] });
      } else {
        setForm({ ...form, author_ids: form.author_ids.filter((item) => item !== id) });
      }
    }
  };

  const handleSelectAll = (type, items) => {
    if (type === "area") {
      if (form.area_ids.length === items.length) {
        setForm({ ...form, area_ids: [] });
      } else {
        setForm({ ...form, area_ids: items.map((item) => item.id) });
      }
    } else if (type === "activity") {
      if (form.activity_ids.length === items.length) {
        setForm({ ...form, activity_ids: [] });
      } else {
        setForm({ ...form, activity_ids: items.map((item) => item.id) });
      }
    } else if (type === "author") {
      if (form.author_ids.length === items.length) {
        setForm({ ...form, author_ids: [] });
      } else {
        setForm({ ...form, author_ids: items.map((item) => item.id) });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    const params = new URLSearchParams();
    if (form.start_date) params.append("start_date", form.start_date);
    if (form.end_date) params.append("end_date", form.end_date);
    if (form.area_ids.length > 0) {
      form.area_ids.forEach((id) => params.append("area_ids[]", id));
    }
    if (form.activity_ids.length > 0) {
      form.activity_ids.forEach((id) => params.append("activity_ids[]", id));
    }
    if (form.status) params.append("status", form.status);
    if (form.author_ids.length > 0) {
      form.author_ids.forEach((id) => params.append("author_ids[]", id));
    }
    if (form.my_reports_only) params.append("my_reports_only", "true");

    const url = `/reports/export/${form.type}?${params.toString()}`;

    try {
      window.open(url, "_blank");
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
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-foreground">Export Report</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <InputDropdown label="Export Type" value={form.type} setObject={(item) => setForm({ ...form, type: item.value })} itemList={typeOptions} required />

          <div className="grid grid-cols-2 gap-3">
            <InputText label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <InputText label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">Authors</label>
            <div className="border border-border rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                <input
                  type="checkbox"
                  checked={form.author_ids.length === users.length}
                  onChange={() => handleSelectAll("author", users)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label className="text-[13px] font-semibold text-foreground cursor-pointer">Select All</label>
              </div>
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.author_ids.includes(user.id)}
                    onChange={(e) => handleCheckboxChange(user.id, "author", e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label className="text-[13px] text-foreground cursor-pointer">{user.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">Areas</label>
            <div className="border border-border rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                <input
                  type="checkbox"
                  checked={form.area_ids.length === areas.length}
                  onChange={() => handleSelectAll("area", areas)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label className="text-[13px] font-semibold text-foreground cursor-pointer">Select All</label>
              </div>
              {areas.map((area) => (
                <div key={area.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.area_ids.includes(area.id)}
                    onChange={(e) => handleCheckboxChange(area.id, "area", e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label className="text-[13px] text-foreground cursor-pointer">{area.area}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">Activities</label>
            <div className="border border-border rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                <input
                  type="checkbox"
                  checked={form.activity_ids.length === activities.length}
                  onChange={() => handleSelectAll("activity", activities)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label className="text-[13px] font-semibold text-foreground cursor-pointer">Select All</label>
              </div>
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.activity_ids.includes(activity.id)}
                    onChange={(e) => handleCheckboxChange(activity.id, "activity", e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label className="text-[13px] text-foreground cursor-pointer">{activity.description}</label>
                </div>
              ))}
            </div>
          </div>

          <InputDropdown label="Status" value={form.status} setObject={(item) => setForm({ ...form, status: item.value })} itemList={statusOptions} />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="my_reports_only"
              checked={form.my_reports_only}
              onChange={(e) => setForm({ ...form, my_reports_only: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="my_reports_only" className="text-[13px] text-foreground cursor-pointer">
              Export only my reports
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <BtnDefault outline onClick={onClose} className="flex-1">
              Cancel
            </BtnDefault>
            <BtnDefault type="submit" loading={processing} className="flex-[2]">
              Export
            </BtnDefault>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}