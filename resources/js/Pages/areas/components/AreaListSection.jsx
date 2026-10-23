import { router } from "@inertiajs/react"
import BtnDefault from "@/Components/Button/BtnDefault"
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi"
import { Building2, FileText, RotateCcw, Trash2 } from "lucide-react"

const AREA_TABLE_COLUMNS = ["No", "Area Name", "Sub-area & Supervisor", "Manager Area", "Actions"]

function getUserInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function AreaManagers({ managers = [], compact = false }) {
  if (!managers.length) {
    return <span className="text-[12px] text-muted-foreground">Belum ada manager ditugaskan</span>
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "max-w-full" : ""}`}>
      {managers.map((manager) => (
        <div key={manager.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">{getUserInitials(manager.name)}</span>
          <span className="text-[12px] font-medium text-foreground">{manager.name}</span>
        </div>
      ))}
    </div>
  )
}

function SubAreaAssignments({ area, subAreas = [], canEdit, onAdd, onEdit, onDelete }) {
  if (!subAreas.length) {
    return canEdit ? (
      <button type="button" onClick={() => onAdd(area)} className="text-[12px] font-medium text-primary hover:underline">
        Tambah sub-area
      </button>
    ) : (
      <span className="text-[12px] text-muted-foreground">Belum ada sub-area</span>
    )
  }

  return (
    <div className="grid min-w-[280px] gap-2">
      {subAreas.map((subArea) => (
        <div key={subArea.id} className="rounded-xl border border-border bg-background px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-semibold text-foreground">{subArea.name}</p>
            {canEdit && (
              <div className="flex gap-1">
                <button type="button" onClick={() => onEdit(area, subArea)} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  Ubah
                </button>
                <button type="button" onClick={() => onDelete(area, subArea)} className="text-[11px] font-medium text-red-600 hover:text-red-700">
                  Hapus
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{subArea.supervisors?.length ? subArea.supervisors.map((supervisor) => supervisor.name).join(", ") : "Belum ada supervisor"}</p>
        </div>
      ))}
      {canEdit && (
        <button type="button" onClick={() => onAdd(area)} className="rounded-xl border border-dashed border-border px-3 py-2 text-left text-[12px] font-medium text-primary hover:bg-muted/40">
          + Tambah sub-area
        </button>
      )}
    </div>
  )
}

function AreaActionButton({ children, tone = "default", className = "", ...props }) {
  const tones = {
    default: "border-border bg-background text-foreground hover:bg-muted/50",
    subtle: "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
    danger: "border-transparent bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700",
  }

  return (
    <button {...props} className={`inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[12px] font-medium transition-colors ${tones[tone]} ${className}`}>
      {children}
    </button>
  )
}

function AreaActions({ area, canEdit, canDelete, onEdit, onArchive, onRestore, onForceDelete, mobile = false }) {
  const iconButtonClass = mobile ? "h-8 w-8 px-0" : "px-2"

  if (area.deleted_at) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {canDelete && (
          <>
            <AreaActionButton onClick={() => onRestore(area)} tone="subtle" title="Restore" className={iconButtonClass}>
              {mobile ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <>
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Restore
                </>
              )}
            </AreaActionButton>
            <AreaActionButton onClick={() => onForceDelete(area)} tone="danger" title="Delete Permanently" className={iconButtonClass}>
              {mobile ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </>
              )}
            </AreaActionButton>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {canEdit && (
        <AreaActionButton onClick={() => onEdit(area)} tone="subtle" title="Edit" className={iconButtonClass}>
          {mobile ? (
            <HiOutlinePencil className="h-4 w-4" />
          ) : (
            <>
              <HiOutlinePencil className="mr-1.5 h-4 w-4" />
              Edit
            </>
          )}
        </AreaActionButton>
      )}
      {canDelete && (
        <AreaActionButton onClick={() => onArchive(area)} tone="danger" title="Hapus" className={iconButtonClass}>
          {mobile ? (
            <HiOutlineTrash className="h-4 w-4" />
          ) : (
            <>
              <HiOutlineTrash className="mr-1.5 h-4 w-4" />
              Hapus
            </>
          )}
        </AreaActionButton>
      )}
    </div>
  )
}

function AreaPagination({ links = [] }) {
  if (links.length <= 3) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 sm:px-6">
      {links.map((link, idx) => (
        <BtnDefault key={idx} size="sm" outline={!link.active} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="min-w-[36px] rounded-xl px-2.5">
          <span dangerouslySetInnerHTML={{ __html: link.label }} />
        </BtnDefault>
      ))}
    </div>
  )
}

function AreaEmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
        <Building2 className="h-6 w-6" />
      </div>
      <p className="text-[16px] font-semibold text-foreground">No areas found</p>
      <p className="mt-1 text-[13px] text-muted-foreground">Area data will appear here after it is created.</p>
    </div>
  )
}

function AreaDesktopTable({ areas, totalAreas, canEdit, canDelete, onEdit, onAddSubArea, onEditSubArea, onDeleteSubArea, onArchive, onRestore, onForceDelete }) {
  return (
    <div className="hidden overflow-hidden rounded-[28px] border border-border bg-card shadow-sm sm:block">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground">Area Directory</h3>
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">{totalAreas} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              {AREA_TABLE_COLUMNS.map((col) => (
                <th key={col} className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {areas.data.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-16 text-center text-[13px] text-muted-foreground">
                  No areas found
                </td>
              </tr>
            ) : (
              areas.data.map((area, index) => (
                <tr key={area.id} className="align-top transition-colors hover:bg-muted/10">
                  <td className="w-12 px-6 py-5 text-[13px] font-semibold text-foreground">{(areas.meta?.from ?? 1) + index}</td>
                  <td className="px-6 py-5">
                    <p className="min-w-[220px] text-[14px] font-semibold text-foreground">{area.area}</p>
                  </td>
                  <td className="px-6 py-5">
                    <SubAreaAssignments area={area} subAreas={area.sub_areas} canEdit={canEdit} onAdd={onAddSubArea} onEdit={onEditSubArea} onDelete={onDeleteSubArea} />
                  </td>
                  <td className="px-6 py-5 min-w-[280px]">
                    <AreaManagers managers={area.managers} />
                  </td>
                  <td className="px-6 py-5 w-[220px]">
                    <AreaActions area={area} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onForceDelete={onForceDelete} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AreaPagination links={areas.links} />
    </div>
  )
}

function AreaMobileList({ areas, canEdit, canDelete, onEdit, onAddSubArea, onEditSubArea, onDeleteSubArea, onArchive, onRestore, onForceDelete }) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {areas.data.length === 0 ? (
        <AreaEmptyState />
      ) : (
        areas.data.map((area, index) => (
          <div key={area.id} className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">#{(areas.meta?.from ?? 1) + index}</p>
                <h3 className="mt-1 text-[15px] font-bold text-foreground leading-tight">{area.area}</h3>
              </div>
              <AreaActions area={area} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onForceDelete={onForceDelete} mobile />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assigned Users</p>
              <AreaManagers managers={area.managers} compact />
              <p className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sub-area & Supervisor</p>
              <SubAreaAssignments area={area} subAreas={area.sub_areas} canEdit={canEdit} onAdd={onAddSubArea} onEdit={onEditSubArea} onDelete={onDeleteSubArea} />
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
  )
}

export default function AreaListSection(props) {
  return (
    <>
      <AreaDesktopTable {...props} />
      <AreaMobileList {...props} />
    </>
  )
}
