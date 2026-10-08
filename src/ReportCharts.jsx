import { useState } from 'react'
import { pieSegments, rankedCourses, axisMaximum } from './reportData.js'
import { DESTINATIONS } from './validation.js'
import './reports.css'

const PALETTE = ['#24866a', '#498fc1', '#e4a24b', '#9479c4', '#cc7488', '#59a8a3', '#798fbd', '#ba8651']
const STATUS_COLORS = { New: '#e4a24b', Contacted: '#498fc1', Converted: '#24866a', Closed: '#9479c4' }
const count = value => new Intl.NumberFormat('en-NG').format(value)
const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
const compact = value => new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

function colorFor(label, index) {
  return STATUS_COLORS[label] || PALETTE[(DESTINATIONS.indexOf(label) >= 0 ? DESTINATIONS.indexOf(label) : index) % PALETTE.length]
}

function PieReport({ title, eyebrow, rows, field, onSelect }) {
  const { total, segments } = pieSegments(rows, field)
  const [active, setActive] = useState(null)
  const selected = segments.find(segment => segment.label === active)
  const circumference = 2 * Math.PI * 78
  return <section className="report-card pie-report">
    <header><span className="report-eyebrow">{eyebrow}</span><h3>{title}</h3><p>Hover for detail. Select a category to filter the report.</p></header>
    {!total ? <div className="report-empty">No matching inquiries for this report.</div> : <>
      <div className="pie-layout"><svg viewBox="0 0 220 220" role="img" aria-label={`${title} pie chart`}>
        <circle cx="110" cy="110" r="78" fill="none" stroke="#edf3ef" strokeWidth="34" />
        {segments.map((segment, index) => <circle key={segment.label} className="pie-segment" cx="110" cy="110" r="78" fill="none" stroke={colorFor(segment.label, index)} strokeWidth={active === segment.label ? 39 : 34}
          strokeDasharray={`${Math.max(0, segment.fraction * circumference - (segments.length > 1 ? 2 : 0))} ${circumference}`}
          strokeDashoffset={-segment.offset * circumference} transform="rotate(-90 110 110)"
          onClick={() => onSelect(segment.label)} onMouseEnter={() => setActive(segment.label)} onMouseLeave={() => setActive(null)}>
          <title>{segment.label}: {count(segment.value)} inquiries ({(segment.fraction * 100).toFixed(1)}%)</title>
        </circle>)}
        <text x="110" y="106" textAnchor="middle" className="pie-number">{count(selected?.value ?? total)}</text>
        <text x="110" y="130" textAnchor="middle" className="pie-caption">{selected ? `${(selected.fraction * 100).toFixed(1)}% of total` : 'total inquiries'}</text>
      </svg><div className="pie-legend">{segments.length > 5 && <p className="legend-scroll-hint">{segments.length} categories · scroll to see all</p>}{segments.map((segment, index) => <button type="button" key={segment.label} onClick={() => onSelect(segment.label)}
        onMouseEnter={() => setActive(segment.label)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(segment.label)} onBlur={() => setActive(null)}
        aria-label={`Filter ${title.toLowerCase()} by ${segment.label}`}>
        <span className="legend-dot" style={{ background: colorFor(segment.label, index) }} /><span className="legend-label">{segment.label}</span>
        <span className="legend-value"><b>{count(segment.value)}</b><small>{(segment.fraction * 100).toFixed(1)}%</small></span>
      </button>)}</div></div>
    </>}
  </section>
}

function CourseBars({ title, eyebrow, courses, metric, onSelect }) {
  const rows = rankedCourses(courses, metric)
  const maximum = axisMaximum(Math.max(0, ...rows.map(row => row.value)))
  const height = rows.length * 32 + 54
  const format = metric === 'revenue' ? money : count
  const [active, setActive] = useState(null)
  return <section className="report-card bar-report">
    <header><span className="report-eyebrow">{eyebrow}</span><h3>{title}</h3><p>{metric === 'revenue' ? 'Matching inquiries × current annual tuition. Not collected revenue.' : 'Courses ranked by matching inquiries. Select a bar to filter.'}</p></header>
    {!rows.length ? <div className="report-empty">No matching inquiries for this report.</div> : <><svg viewBox={`0 0 650 ${height}`} role="group" aria-label={`${title} bar chart`} className="report-bars">
      {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1={205 + tick * 85} x2={205 + tick * 85} y1="24" y2={height - 10} stroke="#e9efeb" />
        <text x={205 + tick * 85} y="14" textAnchor="middle" className="bar-axis">{metric === 'revenue' ? `₦${compact(maximum * tick / 4)}` : count(maximum * tick / 4)}</text></g>)}
      {rows.map((row, index) => <g key={row.course_id} className="report-bar-row" role="button" tabIndex="0" aria-label={`Filter by ${row.course__name}, ${format(row.value)}`}
        onClick={() => onSelect(String(row.course_id))} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(String(row.course_id)) } }}
        onMouseEnter={() => setActive(row.course_id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(row.course_id)} onBlur={() => setActive(null)}>
        <title>{row.course__name}: {format(row.value)}{metric === 'revenue' ? ` (${row.total} inquiries)` : ' inquiries'}</title>
        <text x="190" y={46 + index * 32} textAnchor="end" className="bar-label">{row.course__name.length > 26 ? `${row.course__name.slice(0, 25)}…` : row.course__name}</text>
        <rect x="205" y={33 + index * 32} width="340" height="19" rx="5" fill="#f0f5f2" />
        <rect x="205" y={33 + index * 32} width={row.value / maximum * 340} height="19" rx="5" fill={active === row.course_id ? '#185440' : metric === 'revenue' ? '#498fc1' : '#24866a'} />
        <text x="557" y={46 + index * 32} className="bar-value">{format(row.value)}</text>
      </g>)}
    </svg><div className="mobile-course-bars" role="group" aria-label={`${title} bar chart`}>{rows.map(row => <button key={row.course_id} type="button" onClick={() => onSelect(String(row.course_id))} aria-label={`Filter by ${row.course__name}, ${format(row.value)}`}>
      <span className="mobile-bar-heading"><span>{row.course__name}</span><b>{format(row.value)}</b></span><span className="mobile-bar-track"><span style={{ width: `${row.value / maximum * 100}%`, background: metric === 'revenue' ? '#498fc1' : '#24866a' }} /></span>
    </button>)}</div></>}
  </section>
}

export default function ReportCharts({ data, onFilter, loading }) {
  return <div className="report-grid" aria-busy={loading}>
    <PieReport title="Inquiry status" eyebrow="FOLLOW-UP HEALTH" rows={data.status} field="status" onSelect={value => onFilter('status', value)} />
    <PieReport title="Study destinations" eyebrow="WHERE STUDENTS WANT TO GO" rows={data.destinations} field="destination" onSelect={value => onFilter('destination', value)} />
    <CourseBars title="Course demand" eyebrow="INTEREST BY COURSE" courses={data.courses} metric="total" onSelect={value => onFilter('course', value)} />
    <CourseBars title="Potential revenue" eyebrow="TUITION INTEREST · NGN" courses={data.courses} metric="revenue" onSelect={value => onFilter('course', value)} />
    <PieReport title="Preferred intakes" eyebrow="UPCOMING STUDY PLANS" rows={data.intakes} field="intake" onSelect={value => onFilter('intake', value)} />
    <PieReport title="Student locations" eyebrow="AUDIENCE REACH" rows={data.locations} field="student_location" onSelect={value => onFilter('student_location', value)} />
  </div>
}
