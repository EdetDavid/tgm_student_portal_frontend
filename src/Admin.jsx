import { useEffect, useState } from "react";
import {
  BarChart3,
  Activity,
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
  GraduationCap,
  School,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { api } from "./api.js";
import ReportCharts from "./ReportCharts.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import { ThemeModeButton } from "./ThemeMode.jsx";
import Toast from "./Toast.jsx";
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

function portalName(role) {
  return `TGM Education ${role || "Admin"} Portal`;
}

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

function CourseFields({ course, universities = [] }) {
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
            "PhD",
            "Certificate",
            "Diploma",
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
      <input aria-label="University" name="institution" list="university-options" maxLength={160} placeholder="University or institution" defaultValue={course?.institution} />
      <datalist id="university-options">{universities.map(university => <option key={university.id} value={university.name}>{university.city}, {university.country}</option>)}</datalist>
      <input aria-label="Region" name="region" maxLength={80} placeholder="Study region" defaultValue={course?.region} />
      <input aria-label="Study country" name="study_country" maxLength={100} placeholder="Study country" defaultValue={course?.study_country} />
      <input
        aria-label="Study city"
        name="study_city"
        required
        maxLength={100}
        placeholder="Study city"
        defaultValue={course?.study_city || course?.location}
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

function UniversityFields({ university }) {
  return <>
    <input name="name" required maxLength={160} placeholder="University name" defaultValue={university?.name} />
    <input name="country" required maxLength={100} placeholder="Country" defaultValue={university?.country} />
    <input name="city" required maxLength={100} placeholder="City" defaultValue={university?.city} />
    <input name="image_url" type="url" placeholder="Campus image URL (optional)" defaultValue={university?.image_url} />
    {university && <label className="course-active"><input type="checkbox" name="active" defaultChecked={university.active} /> Visible in catalogue</label>}
  </>;
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
            <CourseFields course={editor.item} universities={universities} />
          ) : editor.type === "university" ? (
            <UniversityFields university={editor.item} />
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

export default function Admin({ onStudent, darkMode, onToggleTheme }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "", role: "Admin" });
  const [loginError, setLoginError] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [section, setSection] = useState("Overview");
  const [data, setData] = useState(null);
  const [inquiries, setInquiries] = useState({
    results: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
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
  const [noticeType, setNoticeType] = useState("success");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [directory, setDirectory] = useState([]);
  const [activityEntries, setActivityEntries] = useState([]);
  const [activityActions, setActivityActions] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPages, setActivityPages] = useState(1);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityAction, setActivityAction] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("tgm-sidebar-collapsed") === "true");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [newOrganisationCode, setNewOrganisationCode] = useState("");
  const [showSignupOrganisationCode, setShowSignupOrganisationCode] = useState(false);
  const [showSignupAccessCode, setShowSignupAccessCode] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [codesNeedRotation, setCodesNeedRotation] = useState({ access: false, organisation: false });

  function notify(message, type = "success") {
    setNoticeType(type);
    setNotice(message);
  }

  async function refresh() {
    try {
      const me = await api("/api/admin/me/");
      setUser(me);
      const [cs, es, fs, us] = await Promise.all([
        api("/api/admin/courses/"),
        api("/api/admin/events/"),
        api("/api/admin/filters/"),
        api("/api/admin/universities/"),
      ]);
      setCourses(cs.courses);
      setEvents(es.events);
      setOptions(fs);
      setUniversities(us.universities);
      setRevision((value) => value + 1);
    } catch (error) {
      if (error.status === 401 || error.status === 403) setUser(null);
      else {
        notify(error.message, "error");
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
    if (!user || user.role !== "Super Admin" || section !== "Access") return;
    let active = true;
    Promise.all([api("/api/admin/access-code/"), api("/api/admin/organisation-code/")])
      .then(([access, organisation]) => {
        if (!active) return;
        setNewAccessCode(access.access_code || "");
        setNewOrganisationCode(organisation.organisation_code || "");
        setCodesNeedRotation({ access: access.needs_rotation, organisation: organisation.needs_rotation });
      })
      .catch(error => { if (active) notify(error.message, "error"); });
    return () => { active = false; };
  }, [section, user]);

  useEffect(() => {
    if (!user || !["Overview", "Reports", "Inquiries", "Users", "Students", "Activity"].includes(section)) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    const timer = setTimeout(async () => {
      try {
        const endpoint = section === "Inquiries" ? "inquiries" : section === "Users" ? "users" : section === "Students" ? "students" : section === "Activity" ? "activity" : "dashboard";
        const params = section === "Activity"
          ? queryString({ q: activitySearch, action: activityAction }, { page })
          : queryString(filters, { page, ordering });
        const result = await api(
          `/api/admin/${endpoint}/?${params}`,
          { signal: controller.signal },
        );
        if (section === "Inquiries") setInquiries(result);
        else if (section === "Users") setDirectory(result.users);
        else if (section === "Students") setDirectory(result.students);
        else if (section === "Activity") {
          setActivityEntries(result.activities);
          setActivityActions(result.actions);
          setActivityTotal(result.total);
          setActivityPages(result.pages);
        }
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
  }, [user?.username, section, filters, page, ordering, revision, activitySearch, activityAction]);

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
    setPage(1);
    setSelected(null);
    setCatalogSearch("");
  }
  function toggleSidebar() {
    setSidebarCollapsed(current => {
      localStorage.setItem("tgm-sidebar-collapsed", String(!current));
      return !current;
    });
  }

  async function signIn(e) {
    e.preventDefault();
    setLoginError("");
    setSaving(true);
    try {
      const login = await api("/api/admin/login/", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      if (login.role === "Student") {
        onStudent();
        return;
      }
      await refresh();
      setShowOnboarding(true);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function signUp(e) {
    e.preventDefault();
    setLoginError("");
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const result = await api("/api/auth/signup/", { method: "POST", body: JSON.stringify(payload) });
      if (result.role === "Student") onStudent();
      else await refresh();
      setShowOnboarding(true);
    } catch (error) { setLoginError(error.message); }
    finally { setSaving(false); }
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
      setLoginForm({ username: "", password: "", role: "Admin" });
      setShowOnboarding(false);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateAccessCode(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/access-code/", { method: "POST", body: JSON.stringify({ access_code: newAccessCode }) });
      setCodesNeedRotation(current => ({ ...current, access: false }));
      notify("Super Admin access code updated");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function updateOrganisationCode(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/organisation-code/", { method: "POST", body: JSON.stringify({ organisation_code: newOrganisationCode }) });
      setCodesNeedRotation(current => ({ ...current, organisation: false }));
      notify("Organisation code updated");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function createStaffAccount(e) {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await api("/api/admin/users/", { method: "POST", body: JSON.stringify(payload) });
      const result = await api("/api/admin/users/");
      setDirectory(result.users);
      form.reset();
      notify("Staff account created");
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function changeStaffRole(item, role) {
    if (role === item.role) return;
    let staffId = item.staff_id;
    if (role !== "Super Admin" && !staffId) {
      staffId = window.prompt("Enter the staff ID for this account:")?.trim();
      if (!staffId) return;
    }
    setSaving(true);
    try {
      await api(`/api/admin/users/${item.id}/`, { method: "PATCH", body: JSON.stringify({ role, staff_id: staffId }) });
      const result = await api("/api/admin/users/");
      setDirectory(result.users);
      notify(`${item.username} is now ${role}`);
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
  }

  async function deleteStaffAccount(item) {
    if (!window.confirm(`Delete staff account “${item.username}”? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/users/${item.id}/`, { method: "DELETE" });
      setDirectory(current => current.filter(record => record.id !== item.id));
      notify(`Staff account ${item.username} deleted`);
    } catch (error) { notify(error.message, "error"); }
    finally { setSaving(false); }
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
      notify("Inquiry updated");
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
    for (const key of ["name", "level", "institution", "region", "study_country", "location", "study_city", "country", "city", "venue"]) {
      if (key in values) {
        values[key] = values[key].trim();
        if (!values[key]) {
          const message = `${key} cannot be blank.`;
          if (editing) setEditorError(message);
          else notify(message, "error");
          return;
        }
      }
    }
    if (type === "course") {
      // Keep the legacy location field in sync with the model's explicit city.
      values.location = values.study_city;
      values.intakes = fields.getAll("intakes");
      values.active = editing ? fields.has("active") : true;
      if (!values.intakes.length) {
        const message = "Choose at least one available intake.";
        if (editing) setEditorError(message);
        else notify(message, "error");
        return;
      }
    } else if (type === "university" && editing) {
      values.active = fields.has("active");
    }
    setSaving(true);
    setEditorError("");
    setNotice("");
    try {
      const resourcePath = type === "university" ? "universities" : `${type}s`;
      await api(`/api/admin/${resourcePath}/${editing ? editing.item.id + "/" : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      if (editing) setEditor(null);
      else form.reset();
      notify(
        `${type === "university" ? "University" : type === "course" ? "Course" : "Event"} ${editing ? "updated" : "added"}`,
      );
      await refresh();
    } catch (error) {
      if (editing) setEditorError(error.message);
      else notify(error.message, "error");
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
      notify(course.active ? "Course deactivated" : "Course reactivated");
      await refresh();
    } catch (error) {
      notify(error.message, "error");
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
      <main className={`admin-login theme-surface ${darkMode ? "theme-dark" : ""}`}>
        <ThemeModeButton darkMode={darkMode} onToggle={onToggleTheme}/>
        <LoadingIndicator label="Checking your session" />
      </main>
    );
  if (!user)
    return (
      <main className={`admin-login theme-surface ${darkMode ? "theme-dark" : ""}`}>
        <ThemeModeButton darkMode={darkMode} onToggle={onToggleTheme}/>
        <Toast message={loginError} type="error" onClose={() => setLoginError("")} />
        <button className="back-student" onClick={onStudent}>
          ← Student portal
        </button>
        <form onSubmit={signupMode ? signUp : signIn} className="login-card">
          <div className="admin-lock">
            <ShieldCheck />
          </div>
          <span className="admin-kicker">TGM EDUCATION · {loginForm.role.toUpperCase()} PORTAL</span>
          <h1>{signupMode ? "Create an account" : "Portal sign in"}</h1>
          {/* <p>Use your Django staff account to manage student inquiries.</p> */}
          <label>
            Sign in as
            <select
              name="role"
              value={loginForm.role}
              onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
            >
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Counsellor</option>
              <option>Student</option>
            </select>
          </label>
          {signupMode && ["Admin", "Counsellor"].includes(loginForm.role) && (
            <label>Staff ID<input name="staff_id" required maxLength="80" placeholder="e.g. TGM-1042" /></label>
          )}
          {signupMode && ["Admin", "Counsellor"].includes(loginForm.role) && (
            <label>Organisation code<div className="secret-input-wrap"><input name="organisation_code" required type={showSignupOrganisationCode ? "text" : "password"} /><button type="button" className="secret-toggle" aria-label={showSignupOrganisationCode ? "Hide organisation code" : "Show organisation code"} onClick={() => setShowSignupOrganisationCode(value => !value)}>{showSignupOrganisationCode ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          )}
          {signupMode && loginForm.role === "Super Admin" && (
            <label>Super Admin access code<div className="secret-input-wrap"><input name="access_code" required type={showSignupAccessCode ? "text" : "password"} /><button type="button" className="secret-toggle" aria-label={showSignupAccessCode ? "Hide Super Admin access code" : "Show Super Admin access code"} onClick={() => setShowSignupAccessCode(value => !value)}>{showSignupAccessCode ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          )}
          <label>
            Username
            <input
              required
              name="username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <div className="secret-input-wrap login-password-wrap">
              <input
                required
                name="password"
                type={showStaffPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                autoComplete={signupMode ? "new-password" : "current-password"}
              />
              <button type="button" className="secret-toggle" aria-label={showStaffPassword ? "Hide password" : "Show password"} aria-pressed={showStaffPassword} onClick={() => setShowStaffPassword(value => !value)}>{showStaffPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
          </label>
          <button className="admin-primary" disabled={saving}>
            {saving ? "Please wait..." : signupMode ? "Create account" : "Sign in"}
          </button>
          <button type="button" className="admin-text-button" onClick={() => { setSignupMode(!signupMode); setLoginError(""); }}>
            {signupMode ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </form>
      </main>
    );

  const nav = [
    ["Overview", BarChart3],
    ["Reports", PieChart],
    ["Inquiries", Users],
    ["Courses", BookOpen],
    ["Universities", School],
    ["Events", CalendarDays],
    ...(user.role === "Super Admin" ? [["Users", Users], ["Students", Users]] : [["Students", Users]]),
    ...(user.role === "Super Admin" ? [["Activity", Activity], ["Access", ShieldCheck]] : []),
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
  const visibleUniversities = universities.filter((university) =>
    `${university.name} ${university.country} ${university.city}`.toLowerCase().includes(catalogSearch.toLowerCase()),
  );

  return (
    <div className={`admin-shell theme-surface ${darkMode ? "theme-dark" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {showOnboarding && (
        <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <div className="onboarding-card">
            <span className="admin-kicker">WELCOME BACK</span>
            <h2 id="onboarding-title">A quick tour before you start</h2>
            <p>Review new inquiries, update follow-up status, manage courses and events, and use Reports to see demand at a glance.</p>
            <div className="onboarding-role"><b>Your role</b><span>{user.role || "Admin"}</span></div>
            <button className="admin-primary" type="button" onClick={() => setShowOnboarding(false)}>Go to workspace</button>
          </div>
        </div>
      )}
      <aside className="admin-side">
        <div className="admin-sidebar-heading"><a className="admin-brand" href="/admin/">
          <span><GraduationCap size={17} /></span> {portalName(user.role)} <small>{user.role?.toUpperCase()}</small>
        </a><button type="button" className="sidebar-collapse-toggle" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>{sidebarCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button></div>
        <div className="admin-nav-label">WORKSPACE</div>
        {nav.map(([name, Icon]) => (
          <button
            key={name}
            aria-label={name}
            title={sidebarCollapsed ? name : undefined}
            className={`admin-nav-item ${section === name ? "chosen" : ""}`}
            onClick={() => navigate(name)}
          >
            <Icon size={sidebarCollapsed ? 22 : 17} strokeWidth={sidebarCollapsed ? 2.8 : 1.8} />
            <span>{name}</span>
          </button>
        ))}
        {user.role === "Super Admin" && <a
          className="admin-nav-item admin-api-link"
          href="/api/"
          aria-label="Browse REST API"
          title={sidebarCollapsed ? "REST API" : undefined}
        >
          <Code2 size={sidebarCollapsed ? 22 : 17} strokeWidth={sidebarCollapsed ? 2.8 : 1.8} />
          <span>REST API</span>
        </a>}
        <div className="admin-side-bottom">
          <ThemeModeButton darkMode={darkMode} onToggle={onToggleTheme}/>
          <div className="admin-user">
            <span>{user.username.slice(0, 1).toUpperCase()}</span>
            <div>
              <b>{user.username}</b>
              <small>{user.role || "Admin"}</small>
            </div>
          </div>
          <button className="admin-logout" disabled={saving} onClick={signOut}>
            <LogOut size={sidebarCollapsed ? 21 : 16} strokeWidth={sidebarCollapsed ? 2.8 : 1.8} /> <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span>Workspace /</span> {section}
          </div>
          <span className="admin-online">
            <i /> {user.role || "Admin"} session
          </span>
        </header>
        <div className="admin-content">
          <div className="admin-heading">
            <div>
              <span className="admin-kicker">{portalName(user.role).toUpperCase()} · MANAGEMENT</span>
              <h1>{section}</h1>
              <p>
                {section === "Reports" ? "Visual reports for student interest, follow-up and tuition demand." : section === "Overview"
                  ? "A live snapshot of student interest and event activity."
                  : section === "Inquiries"
                    ? "Search, review and follow up with prospective students."
                    : section === "Activity"
                      ? "Review an audit trail of sign-ins, submissions and management changes."
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
          <Toast message={notice} type={noticeType} onClose={() => setNotice("")} />
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
            <LoadingIndicator label={`Loading ${section.toLowerCase()}`} />
          )}
          {loadError && ["Overview", "Reports", "Inquiries", "Activity"].includes(section) && (
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
              {section === "Reports" ? <><p className="report-scope">Report scope: {Object.entries(filters).filter(([, value]) => value).map(([key, value]) => {
                const label = key.replaceAll('_', ' ');
                const text = key === 'course' ? courses.find(course => String(course.id) === String(value))?.name || value : key === 'event' ? events.find(event => String(event.id) === String(value))?.name || value : value;
                return `${label}: ${text}`;
              }).join(' · ') || 'All inquiries'}</p><ReportCharts data={data} onFilter={changeFilter} loading={loading} /></> : <div className="admin-panels">
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
              {user.role !== "Counsellor" && <form
                className="admin-add-form"
                data-type="course"
                onSubmit={(e) => saveResource(e)}
              >
                <h3>Add a course</h3>
                <CourseFields universities={universities} />
                <button className="admin-primary" disabled={saving}>
                  <Plus size={15} />
                  {saving ? "Saving..." : "Add course"}
                </button>
              </form>}
              <section className="admin-panel">
                <div className="manage-head">
                  <div><h3>Course catalogue</h3>{user.role === "Counsellor" && <p className="admin-muted">Read-only catalogue access</p>}</div>
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
                      {user.role !== "Counsellor" && <button
                        className="edit-button"
                        onClick={() => openEditor("course", course)}
                      >
                        Edit
                      </button>}
                      {user.role !== "Counsellor" && <button
                        disabled={saving}
                        onClick={() => toggleCourse(course)}
                      >
                        {course.active ? "Deactivate" : "Reactivate"}
                      </button>}
                    </div>
                  ))}
                </div>
                {!visibleCourses.length && (
                  <p className="admin-muted">No matching courses.</p>
                )}
              </section>
            </>
          )}
          {section === "Universities" && (
            <>
              {user.role !== "Counsellor" && <form className="admin-add-form" data-type="university" onSubmit={(e) => saveResource(e)}>
                <h3>Add a university</h3><UniversityFields />
                <button className="admin-primary" disabled={saving}><Plus size={15} />{saving ? "Saving..." : "Add university"}</button>
              </form>}
              <section className="admin-panel"><div className="manage-head"><div><h3>University catalogue</h3><p className="admin-muted">{user.role === "Counsellor" ? "Read-only university access" : "Manage universities available for course offerings."}</p></div><span>{visibleUniversities.length} universities</span></div>
                <input className="catalog-search" aria-label="Search universities" placeholder="Search universities, countries or cities" value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} />
                <div className="manage-list">{visibleUniversities.map(university => <div className="manage-row" key={university.id}><School size={17} /><div><b>{university.name}</b><small>{university.city} · {university.country}</small></div><span className={university.active ? "active-label" : "inactive-label"}>{university.active ? "Active" : "Inactive"}</span>{user.role !== "Counsellor" && <button className="edit-button" onClick={() => openEditor("university", university)}>Edit</button>}</div>)}</div>
                {!visibleUniversities.length && <p className="admin-muted">No universities found.</p>}
              </section>
            </>
          )}
          {section === "Users" && user.role === "Super Admin" && <>
            <form className="admin-add-form staff-create-form" onSubmit={createStaffAccount}>
              <h3>Add a staff account</h3>
              <input name="username" required maxLength={150} placeholder="Username" aria-label="Staff username" />
              <select name="role" defaultValue="Admin" aria-label="Staff role"><option>Admin</option><option>Counsellor</option><option>Super Admin</option></select>
              <input name="staff_id" maxLength={80} placeholder="Staff ID (required for Admin/Counsellor)" aria-label="Staff ID" />
              <input name="password" required minLength={8} type="password" placeholder="Temporary password" aria-label="Temporary password" />
              <button className="admin-primary" disabled={saving}><Plus size={15}/>{saving ? "Creating..." : "Create staff account"}</button>
            </form>
            <section className="admin-panel directory-panel">
              <div className="manage-head"><div><h3>Staff user management</h3><p className="admin-muted">Create staff accounts, change roles, or remove access. Student accounts are managed separately.</p></div><span>{directory.length} staff users</span></div>
              <div className="table-scroll"><table className="inquiry-table"><thead><tr><th>USERNAME</th><th>STAFF ID</th><th>ROLE</th><th>STATUS</th><th>JOINED</th><th>ACTIONS</th></tr></thead><tbody>{directory.map(item => <tr key={item.id}>
                <td><b>{item.username}</b></td><td>{item.staff_id || "—"}</td>
                <td><select aria-label={`Role for ${item.username}`} value={item.role} disabled={saving || item.username === user.username} onChange={event => changeStaffRole(item, event.target.value)}><option>Admin</option><option>Counsellor</option><option>Super Admin</option></select></td>
                <td>{item.active ? "Active" : "Inactive"}</td><td>{new Date(item.date_joined).toLocaleDateString()}</td>
                <td><button type="button" className="user-delete-button" disabled={saving || item.username === user.username} onClick={() => deleteStaffAccount(item)}>Delete</button></td>
              </tr>)}</tbody></table></div>
              {!directory.length && <p className="admin-muted">No staff accounts found.</p>}
            </section>
          </>}
          {section === "Students" && <section className="admin-panel directory-panel">
            <div className="manage-head"><div><h3>Registered students</h3><p className="admin-muted">Student records captured by the portal.</p></div><span>{directory.length} students</span></div>
            <div className="table-scroll"><table className="inquiry-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>LOCATION</th><th>INQUIRIES</th></tr></thead><tbody>{directory.map(item => <tr key={item.id}><td><b>{item.full_name}</b></td><td>{item.email}</td><td>{item.phone}</td><td>{item.location}</td><td>{item.inquiries}</td></tr>)}</tbody></table></div>
            {!directory.length && <p className="admin-muted">No records found.</p>}
          </section>}
          {section === "Activity" && user.role === "Super Admin" && (
            <section className="admin-panel activity-panel">
              <div className="manage-head">
                <div><h3>Application activity</h3><p className="admin-muted">A record of important actions across the portal. Secrets and private notes are never included.</p></div>
                <span>{activityTotal} records</span>
              </div>
              <div className="activity-controls">
                <label className="admin-search"><Search size={16}/><input aria-label="Search activity" placeholder="Search user, action or record" value={activitySearch} onChange={event => { setActivitySearch(event.target.value); setPage(1); }}/></label>
                <select aria-label="Filter activity by action" value={activityAction} onChange={event => { setActivityAction(event.target.value); setPage(1); }}><option value="">All activity types</option>{activityActions.map(action => <option key={action} value={action}>{action.replaceAll(".", " · ")}</option>)}</select>
              </div>
              <div className="table-scroll"><table className="inquiry-table activity-table"><thead><tr><th>WHEN</th><th>ACTOR</th><th>ACTIVITY</th><th>RECORD</th></tr></thead><tbody>
                {activityEntries.map(item => {
                  const details = Object.entries(item.details || {}).map(([key, value]) => `${key.replaceAll("_", " ")}: ${typeof value === "object" ? JSON.stringify(value) : value}`).join(" · ");
                  return <tr key={item.id}><td>{new Date(item.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td><td><b>{item.actor}</b><small className="activity-role">{item.role}</small></td><td><b>{item.action.replaceAll(".", " · ")}</b><small>{item.summary}</small></td><td><b>{item.entity_type}{item.entity_id ? ` · ${item.entity_id}` : ""}</b>{details && <small>{details}</small>}</td></tr>;
                })}
              </tbody></table></div>
              {!activityEntries.length && !loading && <p className="admin-muted activity-empty">No activity matches these filters yet.</p>}
              <div className="admin-pagination"><span>Page {page} of {activityPages}</span><div><button aria-label="Previous activity page" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}><ChevronLeft size={16}/></button><button aria-label="Next activity page" disabled={loading || page >= activityPages} onClick={() => setPage(current => current + 1)}><ChevronRight size={16}/></button></div></div>
            </section>
          )}
          {section === "Access" && user.role === "Super Admin" && (
            <section className="admin-panel access-panel">
              <h3>Super Admin access</h3>
              <p className="admin-muted">Current code is shown below. Edit it here and save to replace the code required for new Super Admin accounts.</p>
              {codesNeedRotation.access && <p className="admin-muted">The existing code was stored as a one-way hash and cannot be recovered. Enter a replacement code below.</p>}
              <form onSubmit={updateAccessCode} className="admin-add-form">
                <input type="text" autoComplete="off" minLength="8" required value={newAccessCode} onChange={e => setNewAccessCode(e.target.value)} placeholder="Super Admin access code" />
                <button className="admin-primary" disabled={saving}>{saving ? "Saving..." : "Update access code"}</button>
              </form>
              <h3>Organisation code</h3>
              <p className="admin-muted">Current code is shown below. Edit it here and save to replace the code required for Admin and Counsellor registrations.</p>
              {codesNeedRotation.organisation && <p className="admin-muted">The existing code was stored as a one-way hash and cannot be recovered. Enter a replacement code below.</p>}
              <form onSubmit={updateOrganisationCode} className="admin-add-form">
                <input type="text" autoComplete="off" minLength="8" required value={newOrganisationCode} onChange={e => setNewOrganisationCode(e.target.value)} placeholder="Organisation code" />
                <button className="admin-primary" disabled={saving}>{saving ? "Saving..." : "Update organisation code"}</button>
              </form>
            </section>
          )}
          {section === "Events" && (
            <>
              {user.role !== "Counsellor" && <form
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
              </form>}
              <section className="admin-panel">
                <div className="manage-head">
                  <div><h3>Events</h3>{user.role === "Counsellor" && <p className="admin-muted">Read-only event access</p>}</div>
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
                      {user.role !== "Counsellor" && <button
                        className="edit-button"
                        onClick={() => openEditor("event", event)}
                      >
                        Edit
                      </button>}
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
