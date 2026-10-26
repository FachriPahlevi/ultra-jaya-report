import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { HiOutlineX } from "react-icons/hi"

export default function AreaFormModal({ isOpen, onClose, onSubmit, editTarget, form, errors, processing, onFieldChange }) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{editTarget ? "Update Area" : "Create Area"}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">{editTarget ? "Edit Area" : "Add New Area"}</h2>
            <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
              {editTarget
                ? `Perbarui nama area ${editTarget.area}. Pengaturan Manager dan Supervisor dilakukan dari Pengaturan Pengguna.`
                : "Buat area baru. Pengaturan Manager dan Supervisor dilakukan dari Pengaturan Pengguna."}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-4">
            <InputText label="Area Name" placeholder="Enter area name" value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} error={errors.name} required />

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <BtnDefault outline onClick={onClose} className="w-full rounded-xl sm:w-auto sm:min-w-[116px]">
                Cancel
              </BtnDefault>
              <BtnDefault onClick={onSubmit} loading={processing} className="w-full rounded-xl sm:w-auto sm:min-w-[156px]">
                {processing ? "Saving..." : editTarget ? "Update Area" : "Create Area"}
              </BtnDefault>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}
