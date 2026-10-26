import { getRequestErrorMessage } from "@/lib/errorMessages"
import { useEffect, useState } from "react"
import { Head, router } from "@inertiajs/react"
import http from "@/lib/http"
import AppLayout from "@/Layouts/AppLayout"
import BtnDefault from "@/Components/Button/BtnDefault"
import { useStatusModal } from "@/Components/Context/StatusModalContext"
import { HiOutlinePlus } from "react-icons/hi"
import ActivityListSection from "./components/ActivityListSection"
import ActivityFormModal from "./components/ActivityFormModal"
import ActivityAssignmentModal from "./components/ActivityAssignmentModal"
import { useAuthorization } from "@/hooks/useAuthorization"
import PageHeader from "@/Components/Layout/PageHeader"

const INITIAL_FORM = {
  name: "",
  description: "",
  is_active: true,
  activity_id: "",
  category: "ISSUE",
  sub_activities: [{ name: "", description: "", category: "ISSUE" }],
}

export default function Index({
  activities = { data: [], links: [], meta: {} },
  parentActivities = [],
  managerOptions = [],
  supervisorOptions = [],
  filters = {},
  canManageActivityCategory = false,
  canAssignActivityManager = false,
  canAssignActivitySupervisor = false,
}) {
  const { can } = useAuthorization()
  const { setStatusModalProps } = useStatusModal()
  const canAdd = can("activities.create")
  const canEdit = can("activities.edit")
  const canDelete = can("activities.delete")

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [assignmentTarget, setAssignmentTarget] = useState(null)
  const [assignmentValues, setAssignmentValues] = useState([])
  const [assignmentProcessing, setAssignmentProcessing] = useState(false)
  const [isBulkSubMode, setIsBulkSubMode] = useState(false)
  const [listSearch, setListSearch] = useState(filters.search ?? "")

  const parentOptions = parentActivities.map((item) => ({ label: item.name, value: String(item.id) }))
  const perPage = Number(filters.per_page ?? 10)

  useEffect(() => {
    if (listSearch === (filters.search ?? "")) return undefined

    const timeoutId = window.setTimeout(() => {
      router.get(route("activities.index"), { search: listSearch, per_page: perPage }, { preserveState: true, preserveScroll: true, replace: true })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search, listSearch, perPage])

  const handlePerPageChange = (value) => {
    router.get(route("activities.index"), { search: listSearch, per_page: value }, { preserveState: true, preserveScroll: true, replace: true })
  }

  const showStatusModal = (type, title, message) => {
    setStatusModalProps({
      isOpen: true,
      type,
      title,
      message,
      button1: { text: "OK" },
    })
  }

  const reloadActivities = () => {
    router.reload({ only: ["activities", "parentActivities"] })
  }

  const showRequestError = (error) => {
    if (error.response?.status === 422) {
      const payloadErrors = error.response.data.errors || {}
      setErrors(payloadErrors)
      showStatusModal("error", "Validation failed", getRequestErrorMessage(error))
      return
    }

    const errorMessage = getRequestErrorMessage(error)
    showStatusModal("error", "Something went wrong", errorMessage)
  }

  const openAdd = (parentActivity = null) => {
    setEditTarget(null)
    setForm({
      ...INITIAL_FORM,
      activity_id: parentActivity ? String(parentActivity.id) : "",
      is_active: true,
      category: "ISSUE",
      sub_activities: [{ name: "", description: "", category: "ISSUE" }],
    })
    setIsBulkSubMode(Boolean(parentActivity))
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (activity) => {
    setEditTarget(activity)
    setForm({
      name: activity.name,
      description: activity.description ?? "",
      is_active: activity.is_active ?? true,
      activity_id: activity.activity_id ? String(activity.activity_id) : "",
      category: activity.category ?? "ISSUE",
      sub_activities: [{ name: "", description: "", category: "ISSUE" }],
    })
    setIsBulkSubMode(false)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditTarget(null)
    setForm(INITIAL_FORM)
    setIsBulkSubMode(false)
    setErrors({})
  }

  const openAssignment = (activity) => {
    setAssignmentTarget(activity)
    setAssignmentValues((activity.activity_id ? activity.supervisors : activity.managers).map((user) => String(user.id)))
  }

  const closeAssignment = () => {
    if (assignmentProcessing) return
    setAssignmentTarget(null)
    setAssignmentValues([])
  }

  const submitAssignment = async (event) => {
    event.preventDefault()
    if (!assignmentTarget || assignmentProcessing) return

    setAssignmentProcessing(true)
    const isSubActivity = Boolean(assignmentTarget.activity_id)
    try {
      const assignmentUrl = isSubActivity ? `/activities/${assignmentTarget.activity_id}/sub-activities/${assignmentTarget.id}/assignees` : `/activities/${assignmentTarget.id}/assignees`
      await http.put(assignmentUrl, {
        ...(isSubActivity ? { supervisor_ids: assignmentValues.map(Number) } : { manager_ids: assignmentValues.map(Number) }),
      })
      showStatusModal("success", "Success", `Assignees for “${assignmentTarget.name}” updated successfully.`)
      reloadActivities()
      setAssignmentTarget(null)
      setAssignmentValues([])
    } catch (error) {
      showRequestError(error)
    } finally {
      setAssignmentProcessing(false)
    }
  }

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }))
    }
  }

  const handleSubActivityChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      sub_activities: prev.sub_activities.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }))
    const errorKey = `sub_activities.${index}.${key}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }))
    }
  }

  const addSubActivityField = () => {
    setForm((prev) => ({
      ...prev,
      sub_activities: [...prev.sub_activities, { name: "", description: "", category: "ISSUE" }],
    }))
  }

  const removeSubActivityField = (index) => {
    setForm((prev) => ({
      ...prev,
      sub_activities: prev.sub_activities.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (processing) return

    setProcessing(true)
    setErrors({})

    const submitData = {
      name: form.name,
      description: form.description || null,
      is_active: form.is_active,
      ...(canManageActivityCategory && form.activity_id ? { category: form.category } : {}),
      sub_activities: isBulkSubMode
        ? form.sub_activities.map((item) => ({
            name: item.name,
            description: item.description || null,
            ...(canManageActivityCategory ? { category: item.category } : {}),
          }))
        : undefined,
    }

    try {
      if (editTarget) {
        const editUrl = editTarget.activity_id ? `/activities/${editTarget.activity_id}/sub-activities/${editTarget.id}` : `/activities/${editTarget.id}`
        await http.put(editUrl, submitData)
        showStatusModal("success", "Success", `Activity “${form.name}” updated successfully.`)
      } else {
        await http.post(isBulkSubMode ? `/activities/${form.activity_id}/sub-activities` : "/activities", submitData)
        showStatusModal("success", "Success", `Activity “${form.name}” created successfully.`)
      }

      reloadActivities()
      closeModal()
    } catch (error) {
      showRequestError(error)
    } finally {
      setProcessing(false)
    }
  }

  const confirmDelete = (activity) => {
    setStatusModalProps({
      isOpen: true,
      type: "warning",
      title: "Delete activity",
      message:
        activity.children_count > 0
          ? `Activity “${activity.name}” still has ${activity.children_count} sub-activities. Delete or move them first.`
          : `Activity “${activity.name}” will be removed from the list.`,
      button1: {
        text: "Delete",
        variant: "danger",
        onClick: () => {
          router.delete(activity.activity_id ? `/activities/${activity.activity_id}/sub-activities/${activity.id}` : `/activities/${activity.id}`, {
            onSuccess: () => {
              showStatusModal("success", "Success", `Activity “${activity.name}” deleted successfully.`)
              reloadActivities()
            },
            onError: (error) => {
              showRequestError(error)
            },
          })
        },
      },
      button2: { text: "Cancel" },
    })
  }

  if (!activities || !activities.data) {
    return (
      <AppLayout title="Activities">
        <Head>
          <title>Activities</title>
        </Head>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Activities">
      <Head>
        <title>Activities</title>
      </Head>

      <div className="flex flex-col gap-5">
        <PageHeader
          title="Activities"
          mobileAction={
            canAdd ? (
              <button
                type="button"
                onClick={() => openAdd()}
                aria-label="Add activity"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </button>
            ) : null
          }
          actions={
            canAdd ? (
              <BtnDefault onClick={() => openAdd()} size="md" className="w-full gap-2 sm:w-fit sm:min-w-[148px]">
                <HiOutlinePlus className="h-5 w-5" />
                Add activity
              </BtnDefault>
            ) : null
          }
        />

        <ActivityListSection
          activities={activities}
          canEdit={canEdit}
          canDelete={canDelete}
          canAssignManager={canAssignActivityManager}
          canAssignSupervisor={canAssignActivitySupervisor}
          onAddSub={openAdd}
          onAssignUsers={openAssignment}
          onEdit={openEdit}
          onDelete={confirmDelete}
          search={listSearch}
          onSearchChange={setListSearch}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
        />
      </div>

      <ActivityFormModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={submit}
        editTarget={editTarget}
        form={form}
        errors={errors}
        processing={processing}
        parentOptions={parentOptions}
        onFieldChange={handleFormChange}
        onSubActivityChange={handleSubActivityChange}
        onAddSubActivityField={addSubActivityField}
        onRemoveSubActivityField={removeSubActivityField}
        isBulkSubMode={isBulkSubMode}
        canManageCategory={canManageActivityCategory}
      />
      <ActivityAssignmentModal
        isOpen={Boolean(assignmentTarget)}
        activity={assignmentTarget}
        values={assignmentValues}
        options={(assignmentTarget?.activity_id ? supervisorOptions : managerOptions).map((user) => ({ value: String(user.id), label: user.name }))}
        processing={assignmentProcessing}
        onChange={setAssignmentValues}
        onClose={closeAssignment}
        onSubmit={submitAssignment}
      />
    </AppLayout>
  )
}
