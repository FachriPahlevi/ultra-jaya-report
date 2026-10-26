import BtnDefault from "@/Components/Button/BtnDefault"
import FilterMultiSelect from "@/Components/Table/FilterMultiSelect"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { HiOutlineX } from "react-icons/hi"

export default function ActivityAssignmentModal({ isOpen, activity, values, options, processing, onChange, onClose, onSubmit }) {
  if (!activity) return null

  const isSubActivity = Boolean(activity.parent_id)
  const roleLabel = isSubActivity ? "SPV penutup tiket" : "Manager reviewer"

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <form onSubmit={onSubmit} className="w-full max-w-[480px] rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
          <div className="min-w-0">
            <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-foreground">Atur {roleLabel}</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{activity.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Tutup"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">
          <FilterMultiSelect label={roleLabel} values={values} options={options} onChange={onChange} placeholder={`Belum ada ${isSubActivity ? "SPV" : "manager"}`} />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {isSubActivity ? "SPV hanya dapat menutup tiket ISSUE bila juga ditugaskan pada sub-area laporan." : "Manager hanya dapat mereview laporan yang menggunakan aktivitas ini."}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <BtnDefault type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Batal
          </BtnDefault>
          <BtnDefault type="submit" loading={processing} className="w-full sm:w-auto">
            Simpan pengguna
          </BtnDefault>
        </div>
      </form>
    </ModalOverlay>
  )
}
