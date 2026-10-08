export function pieSegments(rows, field) {
  const values = rows.map(row => ({ label: String(row[field]), value: Number(row.total) }))
    .filter(row => Number.isFinite(row.value) && row.value > 0)
  const total = values.reduce((sum, row) => sum + row.value, 0)
  let offset = 0
  return { total, segments: values.map(row => {
    const fraction = row.value / total
    const segment = { ...row, fraction, offset }
    offset += fraction
    return segment
  }) }
}

export function rankedCourses(courses, metric = 'total') {
  return courses.map(course => ({ ...course, value: Number(course[metric]) }))
    .filter(course => Number.isFinite(course.value) && course.value >= 0)
    .sort((a, b) => b.value - a.value || a.course__name.localeCompare(b.course__name) || a.course_id - b.course_id)
}

export function axisMaximum(value) {
  if (!Number.isFinite(value) || value <= 0) return 4
  const scale = 10 ** Math.floor(Math.log10(value / 4))
  return Math.max(4, Math.ceil(value / 4 / scale) * scale * 4)
}
