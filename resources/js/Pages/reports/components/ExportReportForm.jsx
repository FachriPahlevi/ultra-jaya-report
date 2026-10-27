import { useState, useEffect } from "react"
import BtnDefault from "@/Components/Button/BtnDefault"
import InputDate from "@/Components/Input/InputDate"
import InputDropdown from "@/Components/Input/InputDropdown"
import ModalOverlay from "@/Components/Modal/ModalOverlay"
import { ModalBody, ModalFooter, ModalHeader, ModalPanel } from "@/Components/Modal/ModalLayout"
import { useStatusModal } from "@/Components/Context/StatusModalContext"

const createInitialForm = (canExportAll, canExportArea) => ({
  type: "excel",
  start_date: "",
  end_date: "",
  area_ids: [],
  activity_ids: [],
  category: "",
  status: "",
  author_ids: [],
  my_reports_only: !canExportAll && !canExportArea,
})

const downloadBlob = (blob, filename) => {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

const responseError = async (response) => {
  const body = await response.json().catch(() => null)
  return new Error(body?.errors?.export?.[0] || body?.errors?.batch?.[0] || body?.message || "Failed to export reports.")
}

export default function ExportForm({ isOpen, onClose, areas, activities, users, canExportAll = false, canExportArea = false }) {
  const { setStatusModalProps } = useStatusModal()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [form, setForm] = useState(() => createInitialForm(canExportAll, canExportArea))

  useEffect(() => {
    if (isOpen) {
      setForm(createInitialForm(canExportAll, canExportArea))
      setProcessing(false)
      setProgress(0)
    }
  }, [isOpen, canExportAll, canExportArea])

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })
  }

  const typeOptions = [
    { label: "Excel (.xlsx)", value: "excel" },
    { label: "PDF (.pdf)", value: "pdf" },
  ]

  const statusOptions = [
    { label: "All statuses", value: "" },
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]
  const categoryOptions = [
    { label: "All types", value: "" },
    { label: "Issue", value: "ISSUE" },
    { label: "Report", value: "REPORT" },
  ]

  const handleCheckboxChange = (id, type, checked) => {
    if (type === "area") {
      if (checked) {
        setForm({ ...form, area_ids: [...form.area_ids, id] })
      } else {
        setForm({ ...form, area_ids: form.area_ids.filter((item) => item !== id) })
      }
    } else if (type === "activity") {
      if (checked) {
        setForm({ ...form, activity_ids: [...form.activity_ids, id] })
      } else {
        setForm({ ...form, activity_ids: form.activity_ids.filter((item) => item !== id) })
      }
    } else if (type === "author") {
      if (checked) {
        setForm({ ...form, author_ids: [...form.author_ids, id] })
      } else {
        setForm({ ...form, author_ids: form.author_ids.filter((item) => item !== id) })
      }
    }
  }

  const handleSelectAll = (type, items) => {
    if (type === "area") {
      if (form.area_ids.length === items.length) {
        setForm({ ...form, area_ids: [] })
      } else {
        setForm({ ...form, area_ids: items.map((item) => item.id) })
      }
    } else if (type === "activity") {
      if (form.activity_ids.length === items.length) {
        setForm({ ...form, activity_ids: [] })
      } else {
        setForm({ ...form, activity_ids: items.map((item) => item.id) })
      }
    } else if (type === "author") {
      if (form.author_ids.length === items.length) {
        setForm({ ...form, author_ids: [] })
      } else {
        setForm({ ...form, author_ids: items.map((item) => item.id) })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setProgress(0)

    const submitForm = {
      ...form,
      my_reports_only: !canExportAll && !canExportArea ? true : form.my_reports_only,
    }

    const params = new URLSearchParams()
    if (submitForm.start_date) params.append("start_date", submitForm.start_date)
    if (submitForm.end_date) params.append("end_date", submitForm.end_date)
    if (submitForm.area_ids.length > 0) {
      submitForm.area_ids.forEach((id) => params.append("area_ids[]", id))
    }
    if (submitForm.activity_ids.length > 0) {
      submitForm.activity_ids.forEach((id) => params.append("activity_ids[]", id))
    }
    if (submitForm.status) params.append("status", submitForm.status)
    if (submitForm.category) params.append("category", submitForm.category)
    if (submitForm.author_ids.length > 0) {
      submitForm.author_ids.forEach((id) => params.append("author_ids[]", id))
    }
    if (submitForm.my_reports_only) params.append("my_reports_only", "true")

    const url = `/reports/export/${submitForm.type}?${params.toString()}`

    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" })
      if (!response.ok) {
        throw await responseError(response)
      }

      if (submitForm.type === "pdf") {
        const totalBatches = Math.max(1, Number(response.headers.get("X-Export-Total-Batches")) || 1)
        const firstPart = await response.blob()
        setProgress(Math.round(90 / totalBatches))

        if (totalBatches === 1) {
          downloadBlob(firstPart, "Reports.pdf")
        } else {
          const { default: JSZip } = await import("jszip")
          const zip = new JSZip()
          const digits = String(totalBatches).length
          zip.file(`Reports_part_${String(1).padStart(digits, "0")}.pdf`, firstPart)

          for (let batch = 2; batch <= totalBatches; batch += 1) {
            const batchResponse = await fetch(`${url}&batch=${batch}`, { headers: { Accept: "application/json" }, credentials: "same-origin" })
            if (!batchResponse.ok) throw await responseError(batchResponse)
            zip.file(`Reports_part_${String(batch).padStart(digits, "0")}.pdf`, await batchResponse.blob())
            setProgress(Math.round((batch / totalBatches) * 90))
          }

          const archive = await zip.generateAsync({ type: "blob", compression: "STORE" }, ({ percent }) => {
            setProgress(90 + Math.round(percent / 10))
          })
          const date = new Intl.DateTimeFormat("en-CA").format(new Date())
          downloadBlob(archive, `Reports_${date}.zip`)
        }
        setProgress(100)
        showStatusModal("success", "Export ready", totalBatches === 1 ? "Your PDF download has started." : `Your ${totalBatches}-part PDF archive has been downloaded.`)
        onClose()
        return
      }

      const blob = await response.blob()
      const disposition = response.headers.get("Content-Disposition") || ""
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `reports.${submitForm.type === "excel" ? "xlsx" : "pdf"}`
      downloadBlob(blob, filename)
      showStatusModal("success", "Export ready", "Your download has started.")
      onClose()
    } catch (error) {
      showStatusModal("error", "Export failed", error instanceof Error ? error.message : "Failed to export reports.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel width="lg">
        <ModalHeader title="Export reports" description="Choose a format and limit the reports to include." onClose={onClose} />
        <ModalBody>
        <form id="export-report-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputDropdown
            label="Export format"
            object={typeOptions.find((item) => item.value === form.type)}
            setObject={(item) => setForm({ ...form, type: item.value })}
            itemList={typeOptions}
            required
          />
          {form.type === "pdf" && <p className="text-xs leading-5 text-muted-foreground">Large exports are processed in smaller parts and combined into one ZIP automatically. Keep this window open until the download starts.</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputDate label="Start date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} />
            <InputDate label="End date" value={form.end_date} min={form.start_date || undefined} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputDropdown label="Type" object={categoryOptions.find((item) => item.value === form.category)} setObject={(item) => setForm((current) => ({ ...current, category: item.value, status: item.value === "REPORT" ? "" : current.status }))} itemList={categoryOptions} />
            <InputDropdown label="Issue status" object={statusOptions.find((item) => item.value === form.status)} setObject={(item) => setForm((current) => ({ ...current, status: item.value }))} itemList={statusOptions} disabled={form.category === "REPORT"} />
          </div>
          <p className="-mt-2 text-xs leading-5 text-muted-foreground">{form.category === "REPORT" ? "Reports do not have an open or closed status." : "Open and closed apply only to issues. All statuses includes reports when all types are selected."}</p>

          {users.length > 1 && (
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-2 block">Authors</p>
              <div className="border border-border rounded-lg p-3 max-h-[150px] overflow-y-auto">
                <label className="flex items-center gap-2 mb-2 pb-2 border-b border-border text-[13px] font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.author_ids.length === users.length}
                    onChange={() => handleSelectAll("author", users)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Select All
                </label>
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
          )}

          {areas.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-2 block">Areas</p>
              <div className="border border-border rounded-lg p-3 max-h-[150px] overflow-y-auto">
                <label className="flex items-center gap-2 mb-2 pb-2 border-b border-border text-[13px] font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.area_ids.length === areas.length}
                    onChange={() => handleSelectAll("area", areas)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Select All
                </label>
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
              <p className="mt-2 text-xs text-muted-foreground">Only reports you can access will be exported.</p>
            </div>
          )}

          <div>
            <p className="text-[13px] font-semibold text-foreground mb-2 block">Activities</p>
            <div className="border border-border rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <label className="flex items-center gap-2 mb-2 pb-2 border-b border-border text-[13px] font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activity_ids.length === activities.length}
                  onChange={() => handleSelectAll("activity", activities)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                Select All
              </label>
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.activity_ids.includes(activity.id)}
                    onChange={(e) => handleCheckboxChange(activity.id, "activity", e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label className="text-[13px] text-foreground cursor-pointer">{activity.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="my_reports_only"
                checked={form.my_reports_only}
                onChange={(e) => setForm({ ...form, my_reports_only: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                disabled={!canExportAll && !canExportArea}
              />
              <label htmlFor="my_reports_only" className="text-[13px] text-foreground cursor-pointer">
                Export only my reports
              </label>
            </div>
            {!canExportAll && !canExportArea && <p className="text-[12px] text-muted-foreground">You can export only reports you submitted.</p>}
            {canExportArea && !canExportAll && <p className="text-[12px] text-muted-foreground">Exports are limited to reports within your assigned scope.</p>}
          </div>

        </form>
        </ModalBody>
        <ModalFooter>
          <BtnDefault outline onClick={onClose} className="w-full">Cancel</BtnDefault>
          <BtnDefault form="export-report-form" type="submit" loading={processing} className="w-full">
            {processing && form.type === "pdf" ? `Generating${progress > 0 ? ` ${progress}%` : "..."}` : "Export"}
          </BtnDefault>
        </ModalFooter>
      </ModalPanel>
    </ModalOverlay>
  )
}
