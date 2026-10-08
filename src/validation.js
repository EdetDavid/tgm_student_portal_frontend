export const DESTINATIONS = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland', 'Germany', 'France', 'Netherlands']
export const PROGRAMME_TYPES = ['Undergraduate', 'Postgraduate', 'PhD', 'Certificate', 'Diploma']

export function validateStudentInquiry(data, courses, events) {
  const errors = {}
  const name = String(data.full_name || '').trim()
  if (name.length < 2 || name.length > 120) errors.full_name = 'Enter a full name between 2 and 120 characters.'
  const email = String(data.email || '').trim()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'
  const phone = String(data.phone || '').trim()
  const digits = phone.replace(/\D/g, '').length
  if (!/^[+\d().\-\s]{7,30}$/.test(phone) || digits < 7 || digits > 15) errors.phone = 'Enter a valid phone number with 7 to 15 digits.'
  const location = String(data.student_location || '').trim()
  const comma = location.lastIndexOf(',')
  if (location.length > 120 || comma < 1 || !location.slice(0, comma).trim() || location.slice(comma + 1).trim().length < 2) errors.student_location = 'Enter your city and country, for example Lagos, Nigeria.'
  const course = courses.find(item => String(item.id) === String(data.course_id))
  if (!course) errors.course_id = 'Choose an available course.'
  if (!PROGRAMME_TYPES.includes(data.programme_type)) errors.programme_type = 'Choose a programme type.'
  if (!course?.intake_options.includes(data.intake)) errors.intake = 'Choose an intake offered for this course.'
  if (!DESTINATIONS.includes(data.destination)) errors.destination = 'Choose a study destination.'
  if (String(data.destination_city || '').trim().length < 2) errors.destination_city = 'Enter the city where you want to study.'
  const event = events.find(item => String(item.id) === String(data.event_id))
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const datePart = type => parts.find(part => part.type === type).value
  const today = `${datePart('year')}-${datePart('month')}-${datePart('day')}`
  if (!event || event.date < today) errors.event_id = 'Choose an upcoming event.'
  if (String(data.message || '').trim().length > 1000) errors.message = 'Keep your message to 1,000 characters or fewer.'
  return errors
}
