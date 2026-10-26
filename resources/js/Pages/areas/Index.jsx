import { getRequestErrorMessage } from "@/lib/errorMessages"
import { useState, useEffect } from "react"
import { Head, router } from "@inertiajs/react"
import http from "@/lib/http"
import AppLayout from "@/Layouts/AppLayout"
import BtnDefault from "@/Components/Button/BtnDefault"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlinePlus } from "react-icons/hi"
import AreaListSection from "./components/AreaListSection"
import AreaFormModal from "./components/AreaFormModal"
import SubAreaFormModal from "./components/SubAreaFormModal"
import { useAuthorization } from "@/hooks/useAuthorization"
import PageHeader from "@/Components/Layout/PageHeader"

const INITIAL_FORM = {
  name: "",
}

function buildAreaForm(area) {
  return {
    name: area.area,
  }
}

export default function Index({ areas = { data: [], links: [], meta: {} }, filters = {} }) {
  const { can } = useAuthorization()
  const { setStatusModalProps } = useStatusModal()
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [subAreaTarget, setSubAreaTarget] = useState(null)
  const [subAreaArea, setSubAreaArea] = useState(null)
  const [subAreaName, setSubAreaName] = useState("")
  const [subAreaError, setSubAreaError] = useState("")
  const [listSearch, setListSearch] = useState(filters.search ?? "")

  const canAdd = can("areas.create")
  const canEdit = can("areas.edit")
  const canDelete = can("areas.delete")
  const perPage = Number(filters.per_page ?? 10)

  useEffect(() => {
    if (listSearch === (filters.search ?? "")) return undefined

    const timeoutId = window.setTimeout(() => {
      router.get(route("areas.index"), { search: listSearch, per_page: perPage }, { preserveState: true, preserveScroll: true, replace: true })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search, listSearch, perPage])

  const handlePerPageChange = (value) => {
    router.get(route("areas.index"), { search: listSearch, per_page: value }, { preserveState: true, preserveScroll: true, replace: true })
  }
  useEffect(() => {
    if (showModal && editTarget) {
      setForm(buildAreaForm(editTarget))
    } else if (showModal && !editTarget) {
      setForm(INITIAL_FORM)
    }
  }, [showModal, editTarget])

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })
  }

  const reloadPage = () => {
    setTimeout(() => {
      router.reload()
    }, 1500)
  }

  const showRequestError = (error) => {
    const errorMessage = getRequestErrorMessage(error)
    showStatusModal("error", "Error", errorMessage)
  }

  const openConfirmModal = ({ type = "warning", title, message, confirmText, onConfirm, confirmVariant }) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: {
        text: confirmText,
        variant: confirmVariant,
        onClick: onConfirm,
      },
      button2: { text: "Cancel" },
    })
  }

  const openAdd = () => {
    setEditTarget(null)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (area) => {
    setEditTarget(area)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditTarget(null)
    setErrors({})
  }

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (processing) return

    setProcessing(true)
    setErrors({})

    const submitData = {
      name: form.name,
    }

    try {
      if (editTarget) {
        await http.put(`/areas/${editTarget.id}`, submitData)
        showStatusModal("success", "Success", `Area "${form.name}" has been updated`)
      } else {
        await http.post("/areas", submitData)
        showStatusModal("success", "Success", `Area "${form.name}" has been created`)
      }

      setTimeout(() => {
        router.reload()
        closeModal()
      }, 1500)
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {})
        showStatusModal("error", "Validation Error", getRequestErrorMessage(error))
      } else {
        showRequestError(error)
      }
    } finally {
      setProcessing(false)
    }
  }

  const confirmDelete = (area) => {
    openConfirmModal({
      type: "warning",
      title: "Hapus Area",
      message: `Area "${area.area}" akan dihapus dan dapat dipulihkan kembali bila diperlukan.`,
      confirmText: "Hapus",
      confirmVariant: "danger",
      onConfirm: () => {
        router.delete(`/areas/${area.id}`, {
          onSuccess: () => {
            showStatusModal("success", "Berhasil", `Area "${area.area}" berhasil dihapus`)
            reloadPage()
          },
          onError: (error) => {
            showRequestError(error)
          },
        })
      },
    })
  }

  const openSubAreaModal = (area, subArea = null) => {
    setSubAreaArea(area)
    setSubAreaTarget(subArea)
    setSubAreaName(subArea?.name ?? "")
    setSubAreaError("")
  }

  const closeSubAreaModal = () => {
    setSubAreaArea(null)
    setSubAreaTarget(null)
    setSubAreaName("")
    setSubAreaError("")
  }

  const submitSubArea = async (event) => {
    event.preventDefault()
    if (!subAreaArea || processing) return

    setProcessing(true)
    setSubAreaError("")
    const payload = { name: subAreaName, max_personnel: subAreaTarget?.max_personnel ?? 1 }

    try {
      if (subAreaTarget) {
        await http.put(`/areas/${subAreaArea.id}/sub-areas/${subAreaTarget.id}`, payload)
        showStatusModal("success", "Berhasil", "Sub-area berhasil diperbarui.")
      } else {
        await http.post(`/areas/${subAreaArea.id}/sub-areas`, payload)
        showStatusModal("success", "Berhasil", "Sub-area berhasil ditambahkan.")
      }
      router.reload()
      closeSubAreaModal()
    } catch (error) {
      setSubAreaError(error.response?.data?.errors?.name?.[0] ?? getRequestErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  const confirmDeleteSubArea = (area, subArea) => {
    openConfirmModal({
      title: "Hapus Sub-area",
      message: `Sub-area "${subArea.name}" akan dihapus.`,
      confirmText: "Hapus",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await http.delete(`/areas/${area.id}/sub-areas/${subArea.id}`)
          showStatusModal("success", "Berhasil", "Sub-area berhasil dihapus.")
          router.reload()
        } catch (error) {
          showRequestError(error)
        }
      },
    })
  }

  const confirmRestore = (area) => {
    openConfirmModal({
      type: "warning",
      title: "Restore Area",
      message: `Area "${area.area}" will be restored and returned to the directory.`,
      confirmText: "Restore",
      onConfirm: async () => {
        try {
          await http.patch(`/areas/${area.id}/restore`)
          showStatusModal("success", "Success", `Area "${area.area}" has been restored`)
          reloadPage()
        } catch (error) {
          showRequestError(error)
        }
      },
    })
  }

  const confirmForceDelete = (area) => {
    openConfirmModal({
      type: "error",
      title: "Delete Permanently",
      message: `Area "${area.area}" will be removed permanently. This action cannot be undone.`,
      confirmText: "Delete Permanently",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await http.delete(`/areas/${area.id}/force`)
          showStatusModal("success", "Success", `Area "${area.area}" has been permanently deleted`)
          reloadPage()
        } catch (error) {
          showRequestError(error, "Failed to permanently delete area")
        }
      },
    })
  }

  if (!areas || !areas.data) {
    return (
      <AppLayout title="Master Area">
        <Head>
          <title>Master Area</title>
        </Head>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Master Area">
      <Head>
        <title>Master Area</title>
      </Head>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Area"
          mobileAction={
            canAdd ? (
              <button
                type="button"
                onClick={openAdd}
                aria-label="Tambah area"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </button>
            ) : null
          }
          actions={
            canAdd ? (
              <BtnDefault onClick={openAdd} size="md" className="w-full gap-2 sm:w-fit sm:min-w-[140px]">
                <HiOutlinePlus className="h-4 w-4" />
                Tambah Area
              </BtnDefault>
            ) : null
          }
        />

        <AreaListSection
          areas={areas}
          canEdit={canEdit}
          canDelete={canDelete}
          canViewArchived={can("areas.view.all") || canDelete}
          onEdit={openEdit}
          onAddSubArea={openSubAreaModal}
          onEditSubArea={openSubAreaModal}
          onDeleteSubArea={confirmDeleteSubArea}
          onArchive={confirmDelete}
          onRestore={confirmRestore}
          onForceDelete={confirmForceDelete}
          search={listSearch}
          onSearchChange={setListSearch}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
        />
      </div>

      <AreaFormModal isOpen={showModal} onClose={closeModal} onSubmit={submit} editTarget={editTarget} form={form} errors={errors} processing={processing} onFieldChange={handleFormChange} />
      <SubAreaFormModal
        isOpen={Boolean(subAreaArea)}
        onClose={closeSubAreaModal}
        onSubmit={submitSubArea}
        area={subAreaArea}
        subArea={subAreaTarget}
        name={subAreaName}
        error={subAreaError}
        processing={processing}
        onNameChange={setSubAreaName}
      />
    </AppLayout>
  )
}
