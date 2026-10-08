import test from 'node:test'
import assert from 'node:assert/strict'
import { validateStudentInquiry } from '../src/validation.js'

const courses = [{ id: 1, intake_options: ['January 2027'] }]
const events = [{ id: 1, date: '2099-01-01' }, { id: 2, date: '2000-01-01' }]
const valid = { full_name: 'Amara Okafor', email: 'amara@example.com', phone: '+234 801 234 5678',
  course_id: 1, event_id: 1, intake: 'January 2027', destination: 'United Kingdom', student_location: 'Lagos, Nigeria', message: '' }

test('valid data and optional message are accepted', () => {
  assert.deepEqual(validateStudentInquiry(valid, courses, events), {})
})

for (const [field, value] of [['full_name', '  '], ['email', 'not-an-email'], ['phone', '-------'],
  ['phone', '+1234567890123456'], ['student_location', 'Lagos'], ['student_location', 'Lagos, '],
  ['course_id', 999], ['intake', 'Unknown'], ['destination', 'Unknown'], ['event_id', 2], ['message', 'x'.repeat(1001)]]) {
  test(`invalid ${field}: ${String(value).slice(0, 25)}`, () => {
    assert.ok(validateStudentInquiry({ ...valid, [field]: value }, courses, events)[field])
  })
}
