import test from 'node:test'
import assert from 'node:assert/strict'
import { pieSegments, rankedCourses, axisMaximum } from '../src/reportData.js'

test('pie slices accurately represent counts and sum to a full circle', () => {
  const { total, segments } = pieSegments([{ status: 'New', total: 3 }, { status: 'Converted', total: 1 }], 'status')
  assert.equal(total, 4)
  assert.equal(segments[0].fraction, .75)
  assert.equal(segments[1].offset, .75)
  assert.equal(segments.reduce((sum, row) => sum + row.fraction, 0), 1)
})

test('empty and zero-count pie reports have no invalid slices', () => {
  assert.deepEqual(pieSegments([], 'status'), { total: 0, segments: [] })
  assert.deepEqual(pieSegments([{ status: 'New', total: 0 }], 'status'), { total: 0, segments: [] })
})

test('revenue values from the API are numeric, sorted, and do not mutate input', () => {
  const rows = [{ course_id: 1, course__name: 'A', revenue: '12000.00' }, { course_id: 2, course__name: 'B', revenue: '24000.00' }]
  assert.deepEqual(rankedCourses(rows, 'revenue').map(row => row.course_id), [2, 1])
  assert.equal(rows[0].revenue, '12000.00')
})

test('bar axes always contain the maximum and handle zero safely', () => {
  for (const value of [0, 1, 13, 242, 5384450]) assert.ok(axisMaximum(value) >= value)
  assert.ok(Number.isFinite(axisMaximum(0)))
})
