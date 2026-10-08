import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Download,
  LogOut,
  Search,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Code2,
  ArrowLeft,
  PieChart,
  Printer,
} from "lucide-react";
import { api } from "./api.js";
import ReportCharts from "./ReportCharts.jsx";
import "./admin.css";

const STATUSES = ["New", "Contacted", "Converted", "Closed"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const EMPTY_FILTERS = {
  q: "",
  course: "",
  event: "",
  status: "",
  intake: "",
  destination: "",
  student_location: "",
};
const money = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n));

function queryString(filters, extra = {}) {
  return new URLSearchParams(
    Object.entries({ ...filters, ...extra }).filter(
      ([, value]) => value !== "",
    ),
  ).toString();
}

function FilterBar({ filters, onChange, courses, events, options, onClear }) {
  const choices = [
    ["course", "Course", courses.map((c) => [c.id, c.name])],
    ["event", "Event", events.map((e) => [e.id, e.name])],
    ["status", "Inquiry status", STATUSES.map((s) => [s, s])],
    ["intake", "Intake", (options.intake || []).map((s) => [s, s])],
    [
      "destination",
      "Destination",
      (options.destination || []).map((s) => [s, s]),
    ],
  ];
  return (
    <section className="admin-filters" aria-label="Inquiry filters">
      <label className="admin-search">
        <Search size={16} />
        <input
          aria-label="Search inquiries"
          placeholder="Name, email, phone or reference"
          value={filters.q}
          onChange={(e) => onChange("q", e.target.value)}
        />
      </label>
      <div className="filter-grid">
        {choices.map(([key, label, values]) => (
          <label key={key}>
            {label}
            <select
              value={filters[key]}
              onChange={(e) => onChange(key, e.target.value)}
            >
              <option value="">All {label.toLowerCase()}s</option>
              {values.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Student location
          <input
            placeholder="e.g. Lagos"
            value={filters.student_location}
            onChange={(e) => onChange("student_location", e.target.value)}
          />
        </label>
      </div>
      {Object.values(filters).some(Boolean) && (
        <button type="button" className="admin-text-button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </section>
  );
}

function BarPanel({ title, rows, field }) {
  const max = Math.max(1, ...rows.map((row) => row.total));
  return (
    <section className="admin-panel">
      <h3>{title}</h3>
      {rows.length ? (
        rows.map((row) => (
          <div className="bar-row" key={row.course_id || row[field]}>
            <span title={row[field]}>{row[field]}</span>
            <div>
              <i style={{ width: `${(row.total / max) * 100}%` }} />
            </div>
            <b>{row.total}</b>
          </div>
        ))
      ) : (
        <p className="admin-muted">No matching inquiries.</p>
      )}
    </section>
  );
}

function TrendPanel({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.total));
  const first = rows.length ? Date.parse(rows[0].date) : 0;
  const last = rows.length ? Date.parse(rows.at(-1).date) : 0;
  const points = rows.map((row) => ({
    ...row,
    x:
      40 +
      (last === first
        ? 220
        : ((Date.parse(row.date) - first) / (last - first)) * 440),
    y: 170 - (row.total / max) * 140,
  }));
  return (
    <section className="admin-panel">
      <h3>Inquiries over time</h3>
      {!rows.length ? (
        <p className="admin-muted">No matching inquiries.</p>
      ) : (
        <svg
          className="trend-chart"
          viewBox="0 0 520 205"
          role="img"
          aria-label="Daily inquiry count over time"
        >
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line
                x1="40"
                x2="480"
                y1={170 - tick * 35}
                y2={170 - tick * 35}
                stroke="#e6eee9"
              />
              <text x="30" y={174 - tick * 35} textAnchor="end">
                {((max * tick) / 4).toFixed(max > 4 ? 0 : 1)}
              </text>
            </g>
          ))}
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#20785a"
            strokeWidth="3"
          />
          {points.map((point) => (
            <circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#20785a"
            >
              <title>
                {point.date}: {point.total} inquiries
              </title>
            </circle>
          ))}
          <text x="40" y="195">
            {rows[0].date}
          </text>
          <text x="480" y="195" textAnchor="end">
            {rows.at(-1).date}
          </text>
        </svg>
      )}
    </section>
  );
}

function CourseFields({ course }) {
  return (
    <>
      <input
        aria-label="Course name"
        name="name"
        required
        maxLength={160}
        placeholder="Course name"
        defaultValue={course?.name}
      />
      <select
        aria-label="Level"
        name="level"
        defaultValue={course?.level || "Undergraduate"}
      >
        {[
          ...new Set([
            "Undergraduate",
            "Postgraduate",
            ...(course?.level ? [course.level] : []),
          ]),
        ].map((level) => (
          <option key={level}>{level}</option>
        ))}
      </select>
      <input
        aria-label="Annual tuition (NGN)"
        name="price"
        type="number"
        min="0"
        max="9999999999.99"
        step="0.01"
        required
        placeholder="Annual tuition (NGN)"
        defaultValue={course?.price}
      />
      <input
        aria-label="Study city"
        name="location"
        required
        maxLength={100}
        placeholder="Study city"
        defaultValue={course?.location}
      />
      <fieldset className="intake-fields">
        <legend>Available intakes (choose at least one)</legend>
        {MONTHS.map((month) => (
          <label key={month}>
            <input
              type="checkbox"
              name="intakes"
              value={month}
              defaultChecked={(
                course?.intakes || ["January", "May", "September"]
              ).includes(month)}
            />
            {month}
          </label>
        ))}
      </fieldset>
      {course && (
        <label className="course-active">
          <input type="checkbox" name="active" defaultChecked={course.active} />
          Visible in the student portal
        </label>
      )}
    </>
  );
}

function EventFields({ event }) {
  return (
    <>
      <input
        aria-label="Event name"
        name="name"
        required
        maxLength={160}
        placeholder="Event name"
        defaultValue={event?.name}
      />
      <input
        aria-label="City"
        name="city"
        required
        maxLength={80}
        placeholder="City"
        defaultValue={event?.city}
      />
      <input
        aria-label="Venue"
        name="venue"
        required
        maxLength={160}
        placeholder="Venue"
        defaultValue={event?.venue}
      />
      <input
        aria-label="Event date"
        name="date"
        required
        type="date"
        defaultValue={event?.date}
      />
      <input
        aria-label="Event time"
        name="time"
        required
        type="time"
        defaultValue={event?.time}
      />
      <input
        aria-label="Capacity"
        name="capacity"
        required
        type="number"
        min="1"
        step="1"
        placeholder="Capacity"
        defaultValue={event?.capacity}
      />
    </>
  );
}

function Editor({ editor, saving, error, onSave, onClose }) {
  useEffect(() => {
    const closeOnEscape = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);
  return (
    <div className="drawer-backdrop" onClick={() => !saving && onClose()}>
      <aside
        className="inquiry-drawer resource-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="drawer-close"
          aria-label="Close editor"
          disabled={saving}
          onClick={onClose}
        >
          ×
        </button>
        <span className="admin-kicker">CATALOGUE MANAGEMENT</span>
        <h2 id="editor-title">Edit {editor.type}</h2>
        <form className="admin-add-form" onSubmit={(e) => onSave(e, editor)}>
          {editor.type === "course" ? (
            <CourseFields course={editor.item} />
          ) : (
            <EventFields event={editor.item} />
          )}
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button className="admin-primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </aside>
    </div>
  );
}

export default function Admin({ onStudent }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [section, setSection] = useState("Overview");
  const [data, setData] = useState(null);
  const [inquiries, setInquiries] = useState({
    results: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("-created_at");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editorError, setEditorError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");

  async function refresh() {
    try {
      const me = await api("/api/admin/me/");
      setUser(me);
      const [cs, es, fs] = await Promise.all([
        api("/api/admin/courses/"),
        api("/api/admin/events/"),
        api("/api/admin/filters/"),
      ]);
      setCourses(cs.courses);
      setEvents(es.events);
      setOptions(fs);
      setRevision((value) => value + 1);
    } catch (error) {
      if (error.status === 401 || error.status === 403) setUser(null);
      else {
        setNotice(error.message);
        setLoginError("Cannot reach the server. Check that Django is running.");
      }
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!user || !["Overview", "Reports", "Inquiries"].includes(section)) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    const timer = setTimeout(async () => {
      try {
        const endpoint = section === "Inquiries" ? "inquiries" : "dashboard";
        const result = await api(
          `/api/admin/${endpoint}/?${queryString(filters, { page, ordering })}`,
          { signal: controller.signal },
        );
        if (section === "Inquiries") setInquiries(result);
        else setData(result);
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message);
          if (error.status === 401 || error.status === 403) setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [user?.username, section, filters, page, ordering, revision]);

  function changeFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }
  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }
  function navigate(next) {
    setSection(next);
    setSelected(null);
    setCatalogSearch("");
  }

  async function signIn(e) {
    e.preventDefault();
    setLoginError("");
    setSaving(true);
    try {
      await api("/api/admin/login/", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      await refresh();
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSaving(true);
    try {
      await api("/api/admin/logout/", { method: "POST", body: "{}" });
      setUser(null);
      setData(null);
      setSection("Overview");
      setSelected(null);
      setEditor(null);
      clearFilters();
      setNotice("");
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveInquiry() {
    setSaving(true);
    setEditorError("");
    try {
      await api(`/api/admin/inquiries/${selected.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          status: selected.status,
          internal_notes: selected.internal_notes,
        }),
      });
      setNotice("Inquiry updated");
      setSelected(null);
      setPage(1);
      await refresh();
    } catch (error) {
      setEditorError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveResource(e, editing) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = new FormData(form);
    const type = editing?.type || form.dataset.type;
    const values = Object.fromEntries(fields.entries());
    for (const key of ["name", "level", "location", "city", "venue"]) {
      if (key in values) {
        values[key] = values[key].trim();
        if (!values[key]) {
          const message = `${key} cannot be blank.`;
          if (editing) setEditorError(message);
          else setNotice(message);
          return;
        }
      }
    }
    if (type === "course") {
      values.intakes = fields.getAll("intakes");
      values.active = editing ? fields.has("active") : true;
      if (!values.intakes.length) {
        const message = "Choose at least one available intake.";
        if (editing) setEditorError(message);
        else setNotice(message);
        return;
      }
    }
    setSaving(true);
    setEditorError("");
    setNotice("");
    try {
      await api(`/api/admin/${type}s/${editing ? editing.item.id + "/" : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      if (editing) setEditor(null);
      else form.reset();
      setNotice(
        `${type === "course" ? "Course" : "Event"} ${editing ? "updated" : "added"}`,
      );
      await refresh();
    } catch (error) {
      if (editing) setEditorError(error.message);
      else setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCourse(course) {
    if (
      course.active &&
      !window.confirm(
        `Deactivate ${course.name}? Existing inquiries will be kept.`,
      )
    )
      return;
    setSaving(true);
    try {
      await api(`/api/admin/courses/${course.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ active: !course.active }),
      });
      setNotice(course.active ? "Course deactivated" : "Course reactivated");
      await refresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  function sortBy(field) {
    setOrdering((current) => (current === field ? "-" + field : field));
    setPage(1);
  }
  function openEditor(type, item) {
    setEditorError("");
    setEditor({ type, item });
  }

  if (checking)
    return (
      <main className="admin-login">
        <p role="status">Checking your session...</p>
      </main>
    );
  if (!user)
    return (
      <main className="admin-login">
        <button className="back-student" onClick={onStudent}>
          ← Student portal
        </button>
        <form onSubmit={signIn} className="login-card">
          <div className="admin-lock">
            <ShieldCheck />
          </div>
          <span className="admin-kicker">STUDENT PORTAL</span>
          <h1>Admin sign in</h1>
          {/* <p>Use your Django staff account to manage student inquiries.</p> */}
          {loginError && (
            <div className="admin-error" role="alert">
              {loginError}
            </div>
          )}
          <label>
            Username
            <input
              required
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              autoComplete="current-password"
            />
          </label>
          <button className="admin-primary" disabled={saving}>
            {saving ? "Signing in..." : "Sign in"}
          </button>
          <a className="login-api-link" href="/api/">
            Open the browsable REST API
          </a>
        </form>
      </main>
    );

  const nav = [
    ["Overview", BarChart3],
    ["Reports", PieChart],
    ["Inquiries", Users],
    ["Courses", BookOpen],
    ["Events", CalendarDays],
  ];
  const filtered = Object.values(filters).some(Boolean);
  const visibleCourses = courses.filter((course) =>
    `${course.name} ${course.level} ${course.location}`
      .toLowerCase()
      .includes(catalogSearch.toLowerCase()),
  );
  const visibleEvents = events.filter((event) =>
    `${event.name} ${event.city} ${event.venue}`
      .toLowerCase()
      .includes(catalogSearch.toLowerCase()),
  );

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <a className="admin-brand" href="/admin/">
          <span>sp</span> Student Portal <small>ADMIN</small>
        </a>
        <div className="admin-nav-label">WORKSPACE</div>
        {nav.map(([name, Icon]) => (
          <button
            key={name}
            aria-label={name}
            className={`admin-nav-item ${section === name ? "chosen" : ""}`}
            onClick={() => navigate(name)}
          >
            <Icon size={17} />
            {name}
          </button>
        ))}
        <a
          className="admin-nav-item admin-api-link"
          href="/api/"
          aria-label="Browse REST API"
        >
          <Code2 size={17} />
          REST API
        </a>
        <div className="admin-side-bottom">
          <div className="admin-user">
            <span>{user.username.slice(0, 1).toUpperCase()}</span>
            <div>
              <b>{user.username}</b>
              <small>Administrator</small>
            </div>
          </div>
          <button className="admin-logout" disabled={saving} onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
          <button className="admin-student-link" onClick={onStudent}>
            <ArrowLeft size={16} /> Student portal
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span>Workspace /</span> {section}
          </div>
          <span className="admin-online">
            <i /> Admin session
          </span>
        </header>
        <div className="admin-content">
          <div className="admin-heading">
            <div>
              <span className="admin-kicker">STUDENT PORTAL · MANAGEMENT</span>
              <h1>{section}</h1>
              <p>
                {section === "Reports" ? "Visual reports for student interest, follow-up and tuition demand." : section === "Overview"
                  ? "A live snapshot of student interest and event activity."
                  : section === "Inquiries"
                    ? "Search, review and follow up with prospective students."
                    : section === "Courses"
                      ? "Manage courses, tuition and available intakes."
                      : "Manage exhibition dates, venues and capacity."}
              </p>
            </div>
            {section === "Inquiries" && (
              <a
                className="admin-outline"
                href={`/api/admin/inquiries/?${queryString(filters, { export: "csv", ordering })}`}
              >
                <Download size={15} /> Export CSV
              </a>
            )}
            {section === "Reports" && <button type="button" className="admin-outline" onClick={() => window.print()}><Printer size={15} /> Print report</button>}
          </div>
          {notice && (
            <button
              className="admin-notice"
              role="status"
              onClick={() => setNotice("")}
            >
              {notice} <span>×</span>
            </button>
          )}
          {["Overview", "Reports", "Inquiries"].includes(section) && (
            <FilterBar
              filters={filters}
              onChange={changeFilter}
              courses={courses}
              events={events}
              options={options}
              onClear={clearFilters}
            />
          )}
          {loading && (
            <p className="admin-muted" role="status">
              Loading {section.toLowerCase()}...
            </p>
          )}
          {loadError && ["Overview", "Reports", "Inquiries"].includes(section) && (
            <div className="admin-error" role="alert">
              {loadError}{" "}
              <button
                className="admin-text-button"
                onClick={() => setRevision((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          )}
          {["Overview", "Reports"].includes(section) && data && !loadError && (
            <div aria-busy={loading}>
              <div className="admin-stats">
                <article>
                  <span>Total inquiries</span>
                  <strong>{data.total}</strong>
                  <small>{filtered ? "Matching filters" : "All time"}</small>
                </article>
                {STATUSES.map((status) => (
                  <article key={status}>
                    <span>{status}</span>
                    <strong>
                      {data.status.find((row) => row.status === status)
                        ?.total || 0}
                    </strong>
                    <small>Inquiries</small>
                  </article>
                ))}
              </div>
              {section === "Reports" ? <ReportCharts data={data} onFilter={changeFilter} loading={loading} /> : <div className="admin-panels">
                <BarPanel
                  title="Inquiries by course"
                  rows={data.courses}
                  field="course__name"
                />
                <section className="admin-panel">
                  <h3>Event capacity</h3>
                  {data.events.length ? (
                    data.events.map((event) => (
                      <div className="event-stat" key={event.id}>
                        <div>
                          <b>{event.name}</b>
                          <span>
                            {event.total} / {event.capacity} inquiries
                          </span>
                        </div>
                        <div className="capacity-track">
                          <i
                            style={{
                              width: `${Math.min(100, (event.total / event.capacity) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="admin-muted">No events.</p>
                  )}
                </section>
                <TrendPanel rows={data.over_time} />
                <BarPanel
                  title="Inquiries by intake"
                  rows={data.intakes}
                  field="intake"
                />
                <BarPanel
                  title="Study destinations"
                  rows={data.destinations}
                  field="destination"
                />
                <BarPanel
                  title="Student locations"
                  rows={data.locations}
                  field="student_location"
                />
                <BarPanel
                  title="Status breakdown"
                  rows={data.status}
                  field="status"
                />
                <section className="admin-panel">
                  <h3>Potential revenue per course</h3>
                  <div className="table-scroll">
                    <table className="inquiry-table revenue-table">
                      <thead>
                        <tr>
                          <th>COURSE</th>
                          <th>INQUIRIES</th>
                          <th>ANNUAL TUITION</th>
                          <th>POTENTIAL REVENUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.courses.map((course) => (
                          <tr key={course.course_id}>
                            <td>{course.course__name}</td>
                            <td>{course.total}</td>
                            <td>{money(course.course__price)}</td>
                            <td>
                              <strong>{money(course.revenue)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!data.courses.length && (
                    <p className="admin-muted">No matching inquiries.</p>
                  )}
                </section>
                <section className="admin-panel">
                  <h3>Potential annual tuition interest</h3>
                  <p className="tuition-total">
                    {money(
                      data.courses.reduce(
                        (total, course) => total + Number(course.revenue || 0),
                        0,
                      ),
                    )}
                  </p>
                  <p className="admin-muted">
                    Current course tuition × matching inquiries. This is not
                    collected revenue.
                  </p>
                </section>
              </div>}
            </div>
          )}
          {section === "Inquiries" && !loadError && (
            <section className="admin-panel" aria-busy={loading}>
              <div className="inquiry-tools">
                <span>{inquiries.total} results</span>
                <label className="inquiry-order">
                  Order
                  <select
                    aria-label="Inquiry order"
                    value={ordering}
                    onChange={(e) => {
                      setOrdering(e.target.value);
                      setPage(1);
                    }}
                  >
                    {[
                      ["-created_at", "Newest first"],
                      ["created_at", "Oldest first"],
                      ["full_name", "Student A–Z"],
                      ["-full_name", "Student Z–A"],
                      ["course__name", "Course A–Z"],
                      ["-course__name", "Course Z–A"],
                      ["event__name", "Event A–Z"],
                      ["-event__name", "Event Z–A"],
                      ["intake", "Intake A–Z"],
                      ["-intake", "Intake Z–A"],
                      ["status", "Status A–Z"],
                      ["-status", "Status Z–A"],
                      ["reference", "Reference A–Z"],
                      ["-reference", "Reference Z–A"],
                    ].map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="table-scroll">
                <table className="inquiry-table">
                  <thead>
                    <tr>
                      {[
                        ["STUDENT", "full_name"],
                        ["COURSE", "course__name"],
                        ["EVENT", "event__name"],
                        ["INTAKE", "intake"],
                        ["STATUS", "status"],
                        ["REFERENCE", "reference"],
                        ["DATE", "created_at"],
                      ].map(([label, field]) => (
                        <th
                          key={field}
                          aria-sort={
                            ordering.replace(/^-/, "") === field
                              ? ordering.startsWith("-")
                                ? "descending"
                                : "ascending"
                              : "none"
                          }
                        >
                          <button
                            className="sort-button"
                            aria-label={`Sort by ${label.toLowerCase()}`}
                            onClick={() => sortBy(field)}
                          >
                            {label}
                            {ordering.replace(/^-/, "") === field
                              ? ordering.startsWith("-")
                                ? " ↓"
                                : " ↑"
                              : ""}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.results.map((item) => (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        aria-label={`Review ${item.full_name}`}
                        onClick={() => {
                          setSelected({ ...item });
                          setEditorError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSelected({ ...item });
                            setEditorError("");
                          }
                        }}
                      >
                        <td>
                          <b>{item.full_name}</b>
                          <small>{item.email}</small>
                        </td>
                        <td>{item.course}</td>
                        <td>{item.event}</td>
                        <td>{item.intake}</td>
                        <td>
                          <span
                            className={`status-pill ${item.status.toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.reference}</td>
                        <td>
                          {new Date(item.created_at).toLocaleDateString(
                            "en-GB",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!inquiries.results.length && !loading && (
                  <p className="admin-muted">No matching inquiries.</p>
                )}
              </div>
              <div className="admin-pagination">
                <span>
                  Page {inquiries.page} of {inquiries.pages}
                </span>
                <div>
                  <button
                    aria-label="Previous page"
                    disabled={loading || page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next page"
                    disabled={loading || page >= inquiries.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          )}
          {section === "Courses" && (
            <>
              <form
                className="admin-add-form"
                data-type="course"
                onSubmit={(e) => saveResource(e)}
              >
                <h3>Add a course</h3>
                <CourseFields />
                <button className="admin-primary" disabled={saving}>
                  <Plus size={15} />
                  {saving ? "Saving..." : "Add course"}
                </button>
              </form>
              <section className="admin-panel">
                <div className="manage-head">
                  <h3>Course catalogue</h3>
                  <span>{visibleCourses.length} courses</span>
                </div>
                <input
                  className="catalog-search"
                  aria-label="Search catalogue"
                  placeholder="Search courses, level or city"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
                <div className="manage-list">
                  {visibleCourses.map((course) => (
                    <div className="manage-row" key={course.id}>
                      <BookOpen size={17} />
                      <div>
                        <b>{course.name}</b>
                        <small>
                          {course.level} · {course.location} ·{" "}
                          {money(course.price)}/year
                        </small>
                        <small>Intakes: {course.intakes.join(", ")}</small>
                      </div>
                      <span
                        className={
                          course.active ? "active-label" : "inactive-label"
                        }
                      >
                        {course.active ? "Active" : "Inactive"}
                      </span>
                      <button
                        className="edit-button"
                        onClick={() => openEditor("course", course)}
                      >
                        Edit
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => toggleCourse(course)}
                      >
                        {course.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  ))}
                </div>
                {!visibleCourses.length && (
                  <p className="admin-muted">No matching courses.</p>
                )}
              </section>
            </>
          )}
          {section === "Events" && (
            <>
              <form
                className="admin-add-form event-form"
                data-type="event"
                onSubmit={(e) => saveResource(e)}
              >
                <h3>Create an event</h3>
                <EventFields />
                <button className="admin-primary" disabled={saving}>
                  <Plus size={15} />
                  {saving ? "Saving..." : "Create event"}
                </button>
              </form>
              <section className="admin-panel">
                <div className="manage-head">
                  <h3>Events</h3>
                  <span>{visibleEvents.length} total</span>
                </div>
                <input
                  className="catalog-search"
                  aria-label="Search events"
                  placeholder="Search events, city or venue"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
                <div className="manage-list">
                  {visibleEvents.map((event) => (
                    <div className="manage-row" key={event.id}>
                      <CalendarDays size={17} />
                      <div>
                        <b>{event.name}</b>
                        <small>
                          {event.city} · {event.venue} · {event.date} at{" "}
                          {event.time}
                        </small>
                      </div>
                      <span className="active-label">
                        Capacity {event.capacity}
                      </span>
                      <button
                        className="edit-button"
                        onClick={() => openEditor("event", event)}
                      >
                        Edit
                      </button>
                      <button
                        className="edit-button"
                        onClick={() => {
                          setFilters({
                            ...EMPTY_FILTERS,
                            event: String(event.id),
                          });
                          setPage(1);
                          navigate("Inquiries");
                        }}
                      >
                        View inquiries
                      </button>
                    </div>
                  ))}
                </div>
                {!visibleEvents.length && (
                  <p className="admin-muted">No matching events.</p>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      {editor && (
        <Editor
          key={`${editor.type}-${editor.item.id}`}
          editor={editor}
          saving={saving}
          error={editorError}
          onSave={saveResource}
          onClose={() => setEditor(null)}
        />
      )}
      {selected && (
        <div
          className="drawer-backdrop"
          onClick={() => !saving && setSelected(null)}
        >
          <aside
            className="inquiry-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="drawer-close"
              aria-label="Close inquiry"
              disabled={saving}
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <span className="admin-kicker">INQUIRY · {selected.reference}</span>
            <h2 id="inquiry-title">{selected.full_name}</h2>
            <p>
              {selected.email} · {selected.phone}
            </p>
            <dl>
              <dt>Course</dt>
              <dd>
                {selected.course} · {money(selected.price)}/year
              </dd>
              <dt>Intake</dt>
              <dd>{selected.intake}</dd>
              <dt>Destination</dt>
              <dd>{selected.destination}</dd>
              <dt>Student location</dt>
              <dd>{selected.student_location}</dd>
              <dt>Event</dt>
              <dd>{selected.event}</dd>
              <dt>Submitted</dt>
              <dd>{new Date(selected.created_at).toLocaleString("en-GB")}</dd>
              <dt>Message</dt>
              <dd>{selected.message || "No message provided."}</dd>
            </dl>
            <label>
              Status
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected({ ...selected, status: e.target.value })
                }
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Internal notes
              <textarea
                rows="5"
                value={selected.internal_notes}
                onChange={(e) =>
                  setSelected({ ...selected, internal_notes: e.target.value })
                }
              />
            </label>
            {editorError && (
              <p className="admin-error" role="alert">
                {editorError}
              </p>
            )}
            <button
              className="admin-primary"
              disabled={saving}
              onClick={saveInquiry}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
