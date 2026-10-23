import InputText from "@/Components/Input/InputText"
import BtnDefault from "@/Components/Button/BtnDefault"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { HiOutlineX } from "react-icons/hi"

export default function SubAreaFormModal({ isOpen, onClose, onSubmit, area, subArea, name, error, processing, onNameChange }) {
  const isEditing = Boolean(subArea)

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <form onSubmit={onSubmit} className="w-full max-w-[480px] rounded-[28px] border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{isEditing ? "Ubah Sub-area" : "Tambah Sub-area"}</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{isEditing ? subArea.name : `Sub-area ${area?.area ?? ""}`}</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Supervisor diatur dari halaman Pengaturan pengguna.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground">
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          <InputText label="Nama Sub-area" value={name} onChange={(event) => onNameChange(event.target.value)} error={error} placeholder="Masukkan nama sub-area" required />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <BtnDefault type="button" outline onClick={onClose} className="rounded-xl">
              Batal
            </BtnDefault>
            <BtnDefault type="submit" loading={processing} className="rounded-xl">
              {isEditing ? "Simpan Perubahan" : "Tambah Sub-area"}
            </BtnDefault>
          </div>
        </div>
      </form>
    </ModalOverlay>
  )
}
