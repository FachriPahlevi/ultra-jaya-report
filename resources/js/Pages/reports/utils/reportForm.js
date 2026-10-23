export const createEmptyReportForm = (authorId = "") => ({
  author_id: authorId,
  type_activity: "",
  sub_activity_id: "",
  area_activity: "",
  sub_area_id: "",
  activity: "",
  issue: "",
  photo: null,
})

export const createReportForm = (report, authorId = "") => ({
  author_id: report?.author_id ?? authorId,
  type_activity: report?.activity_id ?? "",
  sub_activity_id: report?.sub_activity_id ?? "",
  area_activity: report?.area_id ?? "",
  sub_area_id: report?.sub_area_id ?? "",
  activity: report?.activity ?? "",
  issue: report?.issue ?? "",
  photo: null,
})

const toOption = (item, label) => (item ? { value: item.id, label } : null)

export function createReportSelections(report, areas, activities) {
  const area = areas.find((item) => item.id === report?.area_id)
  const subArea = area?.sub_areas?.find((item) => item.id === report?.sub_area_id)
  const activity = activities.find((item) => item.id === report?.activity_id)
  const subActivity = activity?.sub_activities?.find((item) => item.id === report?.sub_activity_id)

  return {
    area: toOption(area, area?.area),
    subArea: toOption(subArea, subArea?.name),
    activity: toOption(activity, activity?.name),
    subActivity: toOption(subActivity, subActivity?.name),
  }
}
