import React, { useEffect, useRef, useState } from "react";
import Admin from "./Admin.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import { ThemeModeButton, useThemeMode } from "./ThemeMode.jsx";
import Toast from "./Toast.jsx";
import { api } from "./api.js";
import { DESTINATIONS as destinations, PROGRAMME_TYPES as programmeTypes, validateStudentInquiry } from "./validation.js";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  ClipboardList,
  LayoutDashboard,
  Bell,
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const money = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n));

const campusImages = [
  "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756್ಡ?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=480&q=80",
];

export default function App() {
  const [darkMode, toggleTheme] = useThemeMode();
  const [showAdmin, setShowAdmin] = useState(["/portal", "/admin"].includes(window.location.pathname.replace(/\/$/, "")));
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  useEffect(() => {
    const syncRoute = () => setShowAdmin(["/portal", "/admin"].includes(window.location.pathname.replace(/\/$/, "")));
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);
  useEffect(() => {
    if (showAdmin) { setAuthChecking(false); return; }
    api("/api/auth/me/").then(user => {
      if (user.role === "Student") {
        const profile = JSON.parse(localStorage.getItem("student_profile") || "{}");
        localStorage.setItem("student_profile", JSON.stringify({ ...profile, full_name: user.full_name || profile.full_name, email: user.email || profile.email }));
        setAuthenticated(true);
      }
    }).catch(() => {}).finally(() => setAuthChecking(false));
  }, [showAdmin]);
  function navigate(path) {
    window.history.pushState({}, "", path);
    setShowAdmin(["/portal", "/admin"].includes(path));
  }
  if (showAdmin) return <Admin onStudent={() => navigate("/")} darkMode={darkMode} onToggleTheme={toggleTheme} />;
  if (authChecking) return <main className={`portal-entry theme-surface ${darkMode ? "theme-dark" : ""}`}><LoadingIndicator label="Restoring your session" /></main>;
  if (!authenticated) return <PortalEntry onContinue={() => setAuthenticated(true)} onAdmin={() => navigate("/portal")} darkMode={darkMode} onToggleTheme={toggleTheme} />;
  return <StudentDashboard darkMode={darkMode} onToggleTheme={toggleTheme} onLogout={async () => { await api("/api/auth/logout/", { method: "POST", body: "{}" }).catch(() => {}); setAuthenticated(false); }}><StudentPortal /></StudentDashboard>;
}

function PortalEntry({ onContinue, onAdmin, darkMode, onToggleTheme }) {
  const [role, setRole] = useState("Student");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", email: "", full_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showOrganisationCode, setShowOrganisationCode] = useState(false);
  const [showSuperAdminCode, setShowSuperAdminCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isStudentSignup = mode === "signup" && role.trim().toLowerCase() === "student";
  async function submit(e) {
    e.preventDefault(); setError("");
    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    if (isStudentSignup && (!fullName || !email)) {
      setError("Please enter your full name and email address to create a student account.");
      return;
    }
    setBusy(true);
    try {
      const body = { ...form, ...(isStudentSignup ? { full_name: fullName, email } : {}), role };
      const result = await api(mode === "signup" ? "/api/auth/signup/" : "/api/admin/login/", { method: "POST", body: JSON.stringify(body) });
      if (role === "Student") {
        const existing = JSON.parse(localStorage.getItem("student_profile") || "{}");
        localStorage.setItem("student_profile", JSON.stringify({ ...existing, full_name: result.full_name || existing.full_name || form.full_name, email: result.email || existing.email || form.email }));
        onContinue();
      } else onAdmin();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className={`portal-entry theme-surface ${darkMode ? "theme-dark" : ""}`}>
    <ThemeModeButton darkMode={darkMode} onToggle={onToggleTheme}/>
    {role === "Student" && <section className="entry-hero"><div><span className="eyebrow"><Sparkles size={13}/> YOUR NEXT CHAPTER STARTS HERE</span><h2>Find your place<br/>in the <em>world.</em></h2><p>Start your study abroad journey with TGM Education.</p></div><Globe2 size={78} strokeWidth={1.1}/></section>}
    <section className="portal-entry-card">
      <div className="admin-lock"><GraduationCap size={23} /></div>
      <span className="admin-kicker">TGM EDUCATION</span>
      <h1>Welcome to Student Portal</h1>
      <p>Sign in to continue to your space, or choose a role to begin.</p>
      <label>Continue as<select value={role} onChange={e => setRole(e.target.value)}><option>Student</option><option>Admin</option><option>Counsellor</option><option>Super Admin</option></select></label>
      <Toast message={error} type="error" onClose={() => setError("")} />
      <form onSubmit={submit} className="entry-form">
        {isStudentSignup && <div className="entry-identity-fields" aria-label="Student account details">
          <label htmlFor="signup-full-name">Full name<input id="signup-full-name" name="full_name" autoComplete="name" required value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} /></label>
          <label htmlFor="signup-email">Email address<input id="signup-email" name="email" autoComplete="email" required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
        </div>}
        {mode === "signup" && ["Admin", "Counsellor"].includes(role) && <label>Staff ID<input required value={form.staff_id || ""} onChange={e => setForm({...form, staff_id:e.target.value})} /></label>}
        {mode === "signup" && ["Admin", "Counsellor"].includes(role) && <label>Organisation code<div className="secret-input-wrap"><input required type={showOrganisationCode ? "text" : "password"} value={form.organisation_code || ""} onChange={e => setForm({...form, organisation_code:e.target.value})} /><button type="button" className="secret-toggle" aria-label={showOrganisationCode ? "Hide organisation code" : "Show organisation code"} onClick={() => setShowOrganisationCode(value => !value)}>{showOrganisationCode ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>}
        {mode === "signup" && role === "Super Admin" && <label>Super Admin access code<div className="secret-input-wrap"><input required type={showSuperAdminCode ? "text" : "password"} value={form.access_code || ""} onChange={e => setForm({...form, access_code:e.target.value})} /><button type="button" className="secret-toggle" aria-label={showSuperAdminCode ? "Hide Super Admin access code" : "Show Super Admin access code"} onClick={() => setShowSuperAdminCode(value => !value)}>{showSuperAdminCode ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>}
        <label>Username<input required value={form.username} onChange={e => setForm({...form, username:e.target.value})} /></label>
        <label>Password<div className="secret-input-wrap"><input required minLength="8" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={form.password} onChange={e => setForm({...form, password:e.target.value})} /><button type="button" className="secret-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
        <button className="entry-primary" disabled={busy}>{busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={16} /></button>
      </form>
      {role !== "Student" && <button className="entry-link" onClick={onAdmin}>Use the staff portal</button>}
      <button className="entry-link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</button>
      {role === "Student" && <button className="entry-link" onClick={onContinue}>Continue as guest for event registration</button>}
    </section>
    {role === "Student" && <StudentSupport />}
  </main>;
}

function StudentDashboard({ children, onLogout, darkMode, onToggleTheme }) {
  const [view, setView] = useState("Apply");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("tgm-sidebar-collapsed") === "true");
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("student_profile") || '{"full_name":"","email":"","phone":"","student_location":""}'));
  const [saved, setSaved] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");
  useEffect(() => {
    if (!["Overview", "Application status"].includes(view)) return;
    const controller = new AbortController();
    setApplicationsLoading(true);
    setApplicationsError("");
    api("/api/student/applications/", { signal: controller.signal })
      .then(result => setApplications(result.applications || []))
      .catch(error => { if (error.name !== "AbortError" && error.name !== "TimeoutError") setApplicationsError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setApplicationsLoading(false); });
    return () => controller.abort();
  }, [view]);
  function saveProfile(e) { e.preventDefault(); localStorage.setItem("student_profile", JSON.stringify(profile)); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  function toggleSidebar() { setSidebarCollapsed(current => { localStorage.setItem("tgm-sidebar-collapsed", String(!current)); return !current; }); }
  return <div className={`student-app-shell theme-surface ${darkMode ? "theme-dark" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="student-side"><div className="student-sidebar-heading"><a className="student-brand" href="/"><span><GraduationCap size={sidebarCollapsed ? 22 : 18} strokeWidth={sidebarCollapsed ? 2.8 : 1.8}/></span><b>TGM Education <em>|</em> Student</b></a><button type="button" className="sidebar-collapse-toggle" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>{sidebarCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button></div><small className="student-nav-label">MY SPACE</small>
      {[['Overview', LayoutDashboard], ['Apply', ClipboardList], ['Profile', UserRound], ['Application status', Bell]].map(([name, Icon]) => <button key={name} title={sidebarCollapsed ? name : undefined} aria-label={name} className={`student-nav-item ${view === name ? 'active' : ''}`} onClick={() => setView(name)}><Icon size={sidebarCollapsed ? 22 : 17} strokeWidth={sidebarCollapsed ? 2.8 : 1.8}/><span>{name}</span></button>)}
      <div className="student-side-bottom"><ThemeModeButton darkMode={darkMode} onToggle={onToggleTheme}/><button title={sidebarCollapsed ? "Sign out" : undefined} className="student-signout" onClick={onLogout}><LogOut size={sidebarCollapsed ? 21 : 16} strokeWidth={sidebarCollapsed ? 2.8 : 1.8}/><span>Sign out</span></button></div>
    </aside>
    <main className="student-workspace"><header className="student-workspace-top"><div><span>MY SPACE /</span> {view}</div><span className="student-online"><i/> Signed in</span></header>
      {view === 'Overview' && <section className="student-dashboard-home"><div className="student-welcome"><small>STUDENT DASHBOARD</small><h1>Keep your study plans moving.</h1><p>Search courses, submit an application and follow the next steps from one place.</p><button className="entry-primary" onClick={() => setView('Apply')}>Start an application <ArrowRight size={16}/></button></div><div className="student-dashboard-cards"><article><ClipboardList/><b>Applications</b><strong>{applicationsLoading ? 'Loading…' : applications.length ? `${applications.length} application${applications.length === 1 ? '' : 's'}` : 'No applications yet'}</strong><button onClick={() => setView(applications.length ? 'Application status' : 'Apply')}>{applications.length ? 'Track application' : 'Apply now'}</button></article><article><UserRound/><b>Profile</b><strong>Keep your details up to date</strong><button onClick={() => setView('Profile')}>Update profile</button></article></div></section>}
      {view === 'Apply' && children}
      {view === 'Profile' && <section className="student-panel"><div className="student-panel-heading"><div><small>YOUR DETAILS</small><h1>Profile</h1><p>Keep your contact details current so our counsellors can reach you.</p></div></div><form className="student-profile-form" onSubmit={saveProfile}><label>Full name<input required value={profile.full_name} onChange={e => setProfile({...profile, full_name:e.target.value})}/></label><label>Email address<input required type="email" value={profile.email} onChange={e => setProfile({...profile, email:e.target.value})}/></label><label>Phone number<input required value={profile.phone} onChange={e => setProfile({...profile, phone:e.target.value})}/></label><label>Current city and country<input required placeholder="e.g. Lagos, Nigeria" value={profile.student_location} onChange={e => setProfile({...profile, student_location:e.target.value})}/></label><button className="entry-primary">{saved ? 'Profile saved' : 'Save changes'}</button></form></section>}
      {view === 'Application status' && <StudentApplications applications={applications} loading={applicationsLoading} error={applicationsError} onApply={() => setView('Apply')} />}
    </main><StudentSupport />
  </div>;
}

const APPLICATION_STATUS_LABELS = { New: "Submitted", Contacted: "Contacted", Converted: "Converted", Closed: "Done" };
const APPLICATION_STATUS_FILTERS = ["All", "Submitted", "Contacted", "Converted", "Done"];

function StudentApplications({ applications, loading, error, onApply }) {
  const [filter, setFilter] = useState("All");
  const records = applications;
  const visible = records.filter(item => filter === "All" || (APPLICATION_STATUS_LABELS[item.status] || item.status) === filter);
  return <section className="student-panel">
    <div className="student-panel-heading"><small>APPLICATION TRACKER</small><h1>Application status</h1><p>See each application and its latest follow-up status.</p></div>
    <nav className="application-status-filters" aria-label="Filter applications by status">{APPLICATION_STATUS_FILTERS.map(label => <button key={label} type="button" className={filter === label ? "selected" : ""} onClick={() => setFilter(label)}>{label}<span>{label === "All" ? records.length : records.filter(item => (APPLICATION_STATUS_LABELS[item.status] || item.status) === label).length}</span></button>)}</nav>
    {loading && <div className="student-empty"><b>Loading your applications…</b></div>}
    {!loading && error && <div className="application-load-error" role="alert">{error}</div>}
    {!loading && !error && visible.length > 0 && <div className="student-application-list">{visible.map(item => {
      const label = APPLICATION_STATUS_LABELS[item.status] || item.status;
      const destination = [item.destination_city, item.destination].filter(Boolean).join(", ");
      return <article className="student-application-card" key={item.id || item.reference}>
        <div className="student-application-card-head"><div><small>REFERENCE · {item.reference}</small><h2>{item.course || "Application"}</h2></div><span className={`student-status-badge status-${String(item.status).toLowerCase()}`}>{label}</span></div>
        <div className="student-application-facts"><div><small>University</small><b>{item.university || "To be confirmed"}</b></div><div><small>Programme</small><b>{item.programme_type || "—"}</b></div><div><small>Intake</small><b>{item.intake || "—"}</b></div><div><small>Study destination</small><b>{destination || "—"}</b></div><div><small>Event</small><b>{item.event || "—"}</b></div><div><small>Submitted</small><b>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "Saved on this device"}</b></div></div>
        {item.message && <p className="student-application-message">Your note: {item.message}</p>}
      </article>;
    })}</div>}
    {!loading && !error && !visible.length && <div className="student-empty"><ClipboardList/><b>{records.length ? `No ${filter.toLowerCase()} applications` : "No application yet"}</b><span>{records.length ? "Choose another status to see your applications." : "Start by telling us what you want to study."}</span>{!records.length && <button className="entry-primary" onClick={onApply}>Start application</button>}</div>}
  </section>;
}

const ADVISOR_STOP_WORDS = new Set("a an and are about after all am at be can could do for from get give going have how i in is it me my of on or our please recommend should tell that the their them there these this to want what where which with would you your study course courses university universities country destination fee price cost tuition intake apply application application status".split(" "));
const STUDY_SYNONYMS = {
  coding: ["software", "computer", "programming"], programmer: ["software", "computer", "programming"], developer: ["software", "computer", "programming"],
  technology: ["computer", "software", "data", "cyber", "artificial intelligence"], tech: ["computer", "software", "data", "cyber"],
  ai: ["artificial intelligence", "data"], "machine learning": ["artificial intelligence", "data"],
  doctor: ["medicine", "health", "biomedical"], healthcare: ["health", "public health", "biomedical"],
  money: ["finance", "accounting", "economics"], manager: ["management", "project management", "business"],
  lawyer: ["law", "international relations"], designer: ["architecture", "media", "communications"],
};

function advisorTokens(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
    .filter(token => token.length > 2 && !ADVISOR_STOP_WORDS.has(token));
}

function formatNaira(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(value) : "Ask a counsellor for the current fee";
}

function recommendCourses(question, courses) {
  const normalized = question.toLowerCase();
  const exact = courses.find(course => normalized.includes(course.name.toLowerCase()));
  if (exact) return [exact];
  const tokens = advisorTokens(question);
  const expanded = new Set(tokens);
  for (const [signal, related] of Object.entries(STUDY_SYNONYMS)) {
    if (normalized.includes(signal)) related.forEach(term => advisorTokens(term).forEach(token => expanded.add(token)));
  }
  if (!expanded.size) return [];
  return courses.map(course => {
    const terms = advisorTokens(`${course.name} ${course.level}`);
    const score = terms.reduce((total, term) => total + (expanded.has(term) ? 2 : 0), 0);
    return { course, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.course.name.localeCompare(b.course.name))
    .slice(0, 3).map(item => item.course);
}

function StudentSupport() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [studentFirstName, setStudentFirstName] = useState(() => {
    try { return (JSON.parse(localStorage.getItem("student_profile") || "{}").full_name || "").trim().split(/\s+/)[0] || ""; }
    catch { return ""; }
  });
  const [catalogue, setCatalogue] = useState({ courses: [], events: [], destinations: [] });
  const [catalogueReady, setCatalogueReady] = useState(false);
  const [lastSuggestedCourses, setLastSuggestedCourses] = useState([]);
  const [messages, setMessages] = useState(() => [{ from: "bot", text: `Hi${studentFirstName ? ` ${studentFirstName}` : ""}! Tell me what you’d like to study, where you’re considering, or what you want to know about applying. I can help with the live course catalogue.` }]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  useEffect(() => {
    let current = true;
    Promise.all([api("/api/courses/"), api("/api/events/"), api("/api/options/")])
      .then(([courses, events, options]) => {
        if (current) setCatalogue({
          courses: courses.courses || [], events: events.events || [],
          destinations: options.destination || [],
        });
      })
      .catch(() => {})
      .finally(() => { if (current) setCatalogueReady(true); });
    return () => { current = false; };
  }, []);

  function buildAnswer(question, previousMatches = []) {
    const text = question.toLowerCase();
    const recommendations = recommendCourses(question, catalogue.courses);
    const relevantCourses = recommendations.length ? recommendations : previousMatches;
    const looksLikeCourseQuestion = /course|study|programme|program|career|recommend|like|interested|degree|major/.test(text);
    if (/(application status|track|reference|submitted)/.test(text)) {
      const reference = localStorage.getItem("student_application_reference");
      const application = JSON.parse(localStorage.getItem("student_application_details") || "null");
      return reference
        ? `I found your saved submission ${reference}. It is recorded as an interest submission${application?.course_name ? ` for ${application.course_name}` : ""}. Open Application status in your dashboard for the details. A counsellor will follow up; I can’t see live admission or visa decisions here.`
        : "I don’t see a submission saved in this browser yet. Sign in, submit an application from Apply, and you’ll receive a reference you can use in Application status.";
    }
    if (/(visa|passport|transcript|document|admission|scholarship)/.test(text)) {
      return "A counsellor needs to confirm requirements for your chosen university, course and destination, since document and visa rules vary. Submit your interest so the team can advise you, or use WhatsApp support for a direct question. I can help compare courses and partner locations meanwhile.";
    }
    if (/(event|exhibition|meet|attend)/.test(text)) {
      const upcoming = catalogue.events.slice(0, 3).map(event => `${event.name} in ${event.city} (${event.date})`);
      return upcoming.length ? `Upcoming events currently listed: ${upcoming.join("; ")}. You can choose one when submitting your interest.` : "There are no upcoming events listed right now. You can still submit your interest, and a counsellor can help with next steps.";
    }
    const destination = catalogue.destinations.find(item => text.includes(item.toLowerCase()));
    if (destination && !recommendations.length) {
      const matching = catalogue.courses.filter(course => (course.offerings || []).some(item => item.country.toLowerCase() === destination.toLowerCase()));
      return matching.length
        ? `Courses with partner locations in ${destination}:\n${matching.slice(0, 8).map(course => {
          const locations = course.offerings.filter(item => item.country.toLowerCase() === destination.toLowerCase()).map(item => `${item.institution}, ${item.city}`).join("; ");
          return `• ${course.name} — ${locations}`;
        }).join("\n")}\nOpen Apply to compare the full course details and listed fees.`
        : `I don’t see partner locations in ${destination} in the current catalogue. The available destinations can change, so check Apply for the latest options.`;
    }
    if (/(university|universit)/.test(text) && relevantCourses.length) {
      return relevantCourses.map(course => {
        const options = course.offerings || [];
        return options.length
          ? `${course.name}: ${options.map(item => `${item.institution} (${item.city}, ${item.country}; ${formatNaira(item.price || course.price)}/year)`).join("; ")}`
          : `${course.name}: no partner university is listed yet.`;
      }).join("\n");
    }
    if (/(country|countries|destination|where can|location|university|universit)/.test(text) && !recommendations.length) {
      const locations = [...new Set(catalogue.courses.flatMap(course => (course.offerings || []).map(item => `${item.country}${item.city ? ` — ${item.city}` : ""}`)))].sort();
      return locations.length
        ? `Partner locations currently available in the course catalogue: ${locations.join("; ")}. Select a course to see which universities offer it, then choose a location on the application form.`
        : "Partner locations will appear here when they’re available in the catalogue. Choose a course first to see its university options.";
    }
    if (/(fee|fees|price|tuition|cost|how much)/.test(text) && relevantCourses.length) {
      return `Here are the matching catalogue entries and listed annual fees:\n${relevantCourses.map(course => `• ${course.name} — ${formatNaira(course.price)} per year`).join("\n")}\nFees can vary by university and destination; confirm the final amount with a counsellor.`;
    }
    if (/(intake|start|when can i begin)/.test(text) && relevantCourses.length) {
      return relevantCourses.map(course => `${course.name}: ${(course.intake_options || course.intakes || []).join(", ") || "Ask a counsellor for available intakes"}`).join("\n");
    }
    if (looksLikeCourseQuestion || recommendations.length) {
      if (!catalogueReady) return "I’m loading the current course catalogue. Please try that question again in a moment.";
      if (!recommendations.length) {
        const examples = catalogue.courses.slice(0, 5).map(course => course.name).join(", ");
        return catalogue.courses.length
          ? `I couldn’t match that interest confidently to a course name. What subjects do you enjoy or what kind of work are you aiming for? Courses currently listed include ${examples}.`
          : "I can’t reach the course catalogue just now. Please try again shortly or browse Apply; WhatsApp support can also help.";
      }
      return `These catalogue courses look like a useful starting point:\n${recommendations.map(course => {
        const offering = (course.offerings || [])[0];
        const where = offering ? ` — e.g. ${offering.institution}, ${offering.city}, ${offering.country}` : "";
        return `• ${course.name} (${course.level}) — ${formatNaira(course.price)}/year${where}`;
      }).join("\n")}\nThis is a starting point, not an admissions assessment. Open Apply to compare all partner options.`;
    }
    if (/(apply|application|start)/.test(text)) return "To apply, open Apply in your student dashboard, choose a course, compare its partner universities, then select a programme type, intake, destination and event. Your profile details are filled in for you, and the form gives you a reference after submission.";
    return "I can recommend courses from the live catalogue, compare partner locations and listed fees, show available intakes, explain how to submit an application, or help you find an event. What subject or destination are you considering?";
  }

  function reply(text) {
    const value = text.trim();
    if (!value) return;
    const introduction = value.match(/\b(?:(?:my name is|call me|i'm|im)\s+([\p{L}][\p{L}'’-]*)|i am\s+(?!(?:a|the|student|looking|interested|considering|trying|hoping|applying|studying|from|here|not)\b)([\p{L}][\p{L}'’-]*))/iu);
    const greeting = /^(?:hi|hello|hey|good morning|good afternoon|good evening)[!.,\s]*$/i.test(value);
    let answer;
    if (introduction) {
      const firstName = (introduction[1] || introduction[2]).replace(/[’'-]+$/, "");
      setStudentFirstName(firstName);
      const profile = JSON.parse(localStorage.getItem("student_profile") || "{}");
      if (!profile.full_name) localStorage.setItem("student_profile", JSON.stringify({ ...profile, full_name: firstName }));
      answer = `Nice to meet you, ${firstName}! I’ll keep that in mind. What would you like to study, or where are you hoping to go?`;
    } else if (greeting) {
      answer = `Hello${studentFirstName ? `, ${studentFirstName}` : ""}! How can I help with your study plans today? I can suggest courses, compare destinations, or explain how to apply.`;
    } else {
      const directMatches = recommendCourses(value, catalogue.courses);
      if (directMatches.length) setLastSuggestedCourses(directMatches);
      answer = buildAnswer(value, lastSuggestedCourses);
      if (studentFirstName) answer = `${studentFirstName}, ${answer.charAt(0).toLowerCase()}${answer.slice(1)}`;
    }
    setMessages(current => [...current, { from: "user", text: value }, { from: "bot", text: answer }]);
    setMessage("");
  }
  return <>
    <a className="whatsapp-support" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "2348000000000"}?text=Hello%20TGM%20Education%2C%20I%20need%20help%20with%20studying%20abroad.`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> WhatsApp support</a>
    {open && <section className="advisor-panel" aria-label="Student advisor"><header><div><b>Study advisor</b><small>Guidance based on the live course catalogue</small></div><button onClick={() => setOpen(false)} aria-label="Close advisor">×</button></header><div className="advisor-messages" aria-live="polite">{messages.map((item, index) => <p key={index} className={item.from}>{item.text}</p>)}<div ref={messagesEndRef}/></div><div className="advisor-suggestions"><button onClick={() => reply("Recommend technology courses")}>Explore technology</button><button onClick={() => reply("Which courses are available in Canada?")}>Courses in Canada</button><button onClick={() => reply("How do I apply?")}>How to apply</button></div><form onSubmit={e => { e.preventDefault(); reply(message); }}><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask about your study plans..."/><button aria-label="Send message"><Send size={15}/></button></form></section>}
    {!open && <button className="advisor-launcher" onClick={() => setOpen(true)} aria-label="Open study advisor"><MessageCircle size={18}/> Study advisor</button>}
  </>;
}

function StudentPortal() {
  const [courses, setCourses] = useState([]),
    [events, setEvents] = useState([]),
    [query, setQuery] = useState(""),
    [courseId, setCourseId] = useState(""),
    [universityId, setUniversityId] = useState(""),
    [destination, setDestination] = useState(""),
    [destinationCity, setDestinationCity] = useState(""),
    [region, setRegion] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const savedProfile = JSON.parse(localStorage.getItem("student_profile") || "{}");
  const [formValues, setFormValues] = useState({
    full_name: savedProfile.full_name || "", email: savedProfile.email || "", phone: savedProfile.phone || "", student_location: savedProfile.student_location || "", message: "",
  });
  const [courseListOpen, setCourseListOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [intake, setIntake] = useState("");
  const [programmeType, setProgrammeType] = useState("");
  const [eventId, setEventId] = useState("");
  const [applicationStep, setApplicationStep] = useState(1);
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [portalOptions, setPortalOptions] = useState({ programme_type: [], destination: [], region: [] });
  function updateField(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }
  async function loadOptions(signal) {
    setLoading(true);
    setLoadError("");
    try {
      const [courseData, eventData, optionData] = await Promise.all([
        api("/api/courses/", signal ? { signal } : {}),
        api("/api/events/", signal ? { signal } : {}),
        api("/api/options/", signal ? { signal } : {}),
      ]);
      setCourses(courseData.courses);
      setEvents(eventData.events);
      setPortalOptions(optionData);
    } catch (error) {
      if (error.name !== "AbortError") setLoadError("Courses and events could not load. Check that Django is running and try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    loadOptions(controller.signal);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!courseListOpen || !query.trim()) {
      setSearching(false);
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    setSearchError("");
    const timer = setTimeout(async () => {
      try {
        const response = await api(`/api/courses/?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        setMatches(response.courses);
      } catch (error) {
        if (error.name !== "AbortError") setSearchError("Course search failed. Please try again.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, courseListOpen]);
  const sourceCourses = query.trim() ? matches : courses;
  const visible = region ? sourceCourses.filter(course => (course.offerings || []).some(item => item.region === region)) : sourceCourses;
  const regions = portalOptions.region.length ? portalOptions.region : [...new Set(courses.flatMap(course => (course.offerings || []).map(item => item.region)))].sort();
  const chosen = matches.find((c) => String(c.id) === String(courseId)) || courses.find((c) => String(c.id) === String(courseId));
  const selectedOffering = chosen?.offerings?.find(item => String(item.id) === String(universityId));
  const formData = {
    ...formValues,
    course_id: courseId,
    university_id: universityId,
    programme_type: programmeType,
    intake,
    destination,
    destination_city: destinationCity,
    event_id: eventId,
  };
  function validateStep(step) {
    const validation = validateStudentInquiry(formData, [...matches, ...courses], events, {
      destinations: portalOptions.destination,
      programmeTypes: portalOptions.programme_type,
    });
    if (chosen?.offerings?.length && !universityId) {
      validation.university_id = "Choose a university where you would like to study.";
    }
    const fieldsByStep = {
      1: ["full_name", "email", "phone", "student_location"],
      2: ["course_id", "university_id"],
      3: ["programme_type", "intake", "destination", "destination_city", "event_id", "message"],
      4: Object.keys(validation),
    };
    const messages = fieldsByStep[step].filter(field => validation[field]).map(field => validation[field]);
    if (messages.length) {
      setError(messages.join(" "));
      return false;
    }
    setError("");
    return true;
  }
  function continueApplication() {
    if (validateStep(applicationStep)) {
      setApplicationStep(current => Math.min(4, current + 1));
      document.querySelector(".form-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    const data = { ...formData, course_id: Number(courseId), event_id: Number(eventId), university_id: universityId ? Number(universityId) : null };
    const validation = validateStudentInquiry(data, [...matches, ...courses], events, {
      destinations: portalOptions.destination,
      programmeTypes: portalOptions.programme_type,
    });
    if (chosen?.offerings?.length && !universityId) validation.university_id = "Choose a university where you would like to study.";
    if (Object.keys(validation).length) {
      setError(Object.values(validation).join(" "));
      if (["full_name", "email", "phone", "student_location"].some(field => validation[field])) setApplicationStep(1);
      else if (validation.course_id || validation.university_id) setApplicationStep(2);
      else setApplicationStep(3);
      return;
    }
    setBusy(true);
    try {
      const body = await api("/api/inquiries/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setResult(body);
      localStorage.setItem("student_application_reference", body.reference);
      localStorage.setItem("student_profile", JSON.stringify({ full_name: data.full_name, email: data.email, phone: data.phone, student_location: data.student_location }));
      localStorage.setItem("student_application_details", JSON.stringify({ ...data, course_name: chosen?.name, event_name: events.find(item => String(item.id) === String(data.event_id))?.name }));
      setFormValues({ full_name: "", email: "", phone: "", student_location: "", message: "" });
      setCourseId("");
      setUniversityId("");
      setDestination("");
      setDestinationCity("");
      setIntake("");
      setProgrammeType("");
      setEventId("");
      setQuery("");
      setApplicationStep(1);
      setCourseListOpen(false);
      document.querySelector(".form-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setError(
        error.status ? error.message : "We could not send your details. Please check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <GraduationCap size={21} />
          </span>
          <span>
            TGM <b>EDUCATION</b>
          </span>
        </a>
        <div className="top-right">
          <span className="secure">
            <ShieldCheck size={15} /> Your details are secure
          </span>
          <a className="help-link" href="mailto:info@tgmeducation.com">
            Need help?
          </a>
        </div>
      </header>
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE
            </div>
            <h1>
              Find your place
              <br />
              in the <em>world.</em>
            </h1>
            <p>
              Tell us what you’re dreaming of. Our team will help you take the
              first step toward studying abroad.
            </p>
            <div className="hero-points">
              <span>
                <Check size={15} /> Explore global courses
              </span>
              <span>
                <Check size={15} /> Meet our team at an event
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="sun"></div>
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="globe">
              <Globe2 size={88} strokeWidth={1.1} />
            </div>
            <div className="art-caption">
              <span className="caption-dot"></span> A world of possibilities
            </div>
            <div className="floating-card">
              <span className="float-icon">
                <MapPin size={16} />
              </span>
              <span>
                <b>20 courses</b>
                <small>Across top destinations</small>
              </span>
            </div>
          </div>
        </section>
        <div className="application-layout">
        <section className="form-wrap">
          <div className="form-intro">
            <div>
              <div className="step-label">
                STUDENT INTEREST FORM <span>•</span> 2 MIN
              </div>
            </div>
            <span className="step-count">Step {applicationStep} of 4</span>
          </div>
          <nav className="application-stepper" aria-label="Application progress">
            {["Your details", "Course & university", "Study plans", "Review"].map((label, index) => <div key={label} className={`stepper-item${applicationStep === index + 1 ? " current" : applicationStep > index + 1 ? " complete" : ""}`} aria-current={applicationStep === index + 1 ? "step" : undefined}><span>{applicationStep > index + 1 ? <Check size={13}/> : `0${index + 1}`}</span><b>{label}</b></div>)}
          </nav>
          {result && (
            <div className="success" role="status">
              <div className="success-icon">
                <Check size={20} />
              </div>
              <div>
                <b>
                  {result.duplicate
                    ? "We’ve already got your interest."
                    : "You’re on your way!"}
                </b>
                <p>
                  {result.duplicate
                    ? "Your recent submission is saved under this reference."
                    : "Thanks for reaching out. Our team will be in touch soon."}{" "}
                  Reference: <strong>{result.reference}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {loading && <LoadingIndicator label="Loading courses and events" />}
          {loadError && <div className="error" role="alert">{loadError} <button type="button" onClick={() => loadOptions()}>Retry</button></div>}
          {!loading && !loadError && !events.length && <p className="error">No upcoming events are available yet. Please check back soon.</p>}
          <form onSubmit={submit} noValidate>
            <div className="form-step" hidden={applicationStep !== 1}>
            <div className="section-heading">
              <span className="number">01</span>
              <div>
                <b>Your details</b>
                <small>How can we reach you?</small>
              </div>
            </div>
            <div className="grid two">
              <label>
                Full name<span className="required">*</span>
                <input
                  name="full_name"
                  value={formValues.full_name}
                  onChange={updateField}
                  placeholder="e.g. Amara Okafor"
                  autoComplete="name"
                  required
                  minLength="2"
                  maxLength="120"
                />
              </label>
              <label>
                Email address<span className="required">*</span>
                <input
                  name="email"
                  value={formValues.email}
                  onChange={updateField}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  maxLength="254"
                />
              </label>
              <label>
                Phone number<span className="required">*</span>
                <input
                  name="phone"
                  value={formValues.phone}
                  onChange={updateField}
                  type="tel"
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                  required
                  minLength="7"
                  maxLength="30"
                  pattern="[+0-9\(\).\s\-]{7,30}"
                />
              </label>
              <label>
                Your location <span className="hint">City and country</span>
                <span className="required">*</span>
                <input
                  name="student_location"
                  value={formValues.student_location}
                  onChange={updateField}
                  placeholder="e.g. Ikeja, Nigeria"
                  autoComplete="address-level2"
                  required
                  maxLength="120"
                />
              </label>
            </div>
            </div>
            <div className="form-step" hidden={applicationStep !== 2}>
            <div className="section-heading course-heading">
              <span className="number">02</span>
              <div>
                <b>Choose a course</b>
                <small>Compare programmes and the universities offering them.</small>
              </div>
            </div>
            <div className="course-search">
              <Search size={17} />
              <input
                aria-label="Search courses"
                value={query}
                onFocus={() => setCourseListOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCourseListOpen(true);
                  setCourseId("");
                  setIntake("");
                }}
                maxLength={200}
                placeholder="Search courses by name..."
              />
              <span>{searching ? 'Searching...' : `${visible.length} courses`}</span>
            </div>
            <label className="region-filter-label">Study region (optional)
              <div className="select-shell region-filter"><select value={region} onChange={e => { setRegion(e.target.value); setCourseId(""); setIntake(""); }}><option value="">All regions</option>{regions.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={17}/></div>
            </label>
            {courseListOpen && (
              <div className="course-results" role="listbox" aria-label="Matching courses">
                {searching ? <p role="status">Searching courses...</p> : searchError ? <p role="alert">{searchError}</p> : visible.length ? visible.map((course) => (
                  <button
                    className={`course-result${String(course.id) === String(courseId) ? " active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={String(course.id) === String(courseId)}
                    key={course.id}
                    onClick={() => {
                      setCourseId(String(course.id));
                      setUniversityId("");
                      setIntake("");
                      setQuery(course.name);
                      setCourseListOpen(false);
                    }}
                  >
                    <span><b>{course.name}</b><small>{(course.offerings || []).slice(0, 2).map(item => item.institution).join(" · ")}</small></span>
                    <strong>{money(course.price)}<small> / year</small></strong>
                  </button>
                )) : <p className="no-courses">No courses match “{query}”. Try another search.</p>}
              </div>
            )}
            <label className="full-label">
              Choose a course<span className="required">*</span>
              <div className="select-shell">
                <select
                  aria-label="Selected course"
                  name="course_id"
                  value={courseId}
                  onFocus={() => setCourseListOpen(true)}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setUniversityId("");
                    setIntake("");
                    const course = courses.find((item) => String(item.id) === e.target.value);
                    if (course) setQuery(course.name);
                  }}
                  required
                >
                  <option value="">
                    Select a course to see its tuition fee
                  </option>
                  {visible.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {money(c.price)}
                      /year
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </div>
            </label>
            {chosen && (
              <div className="course-selected">
                <div className="selected-icon">
                  <GraduationCap size={20} />
                </div>
                <span>
                  <b>{chosen.name}</b>
                  <small>
                    Choose the programme type and study location below
                  </small>
                </span>
                <strong>
                  {money(chosen.price)}
                  <small> / year</small>
                </strong>
              </div>
            )}
            {chosen?.offerings?.length > 0 && (
              <div className="course-offerings">
                <div className="course-offerings-heading"><div><small>AVAILABLE PARTNER LOCATIONS</small><span>Choose a destination below to continue</span></div><MapPin size={16}/></div>
                <div className="course-offering-list">
                  {chosen.offerings.map((item, index) => (
                    <button type="button" className={`course-offering-card${String(universityId) === String(item.id) ? " selected" : ""}`} key={`${item.institution}-${item.city}`} onClick={() => { setUniversityId(String(item.id)); setDestination(item.country); setDestinationCity(item.city); }} aria-pressed={String(universityId) === String(item.id)}>
                      <img src={campusImages[index % campusImages.length]} alt={`${item.institution} campus`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = campusImages[0]; }} />
                      <div><b>{item.institution}</b><span><MapPin size={11}/> {item.city}, {item.country}</span><em>{money(item.price || chosen.price)} / year</em></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
            <div className="form-step" hidden={applicationStep !== 3}>
            <div className="section-heading plan-heading">
              <span className="number">03</span>
              <div><b>Set your study plans</b><small>Choose a programme, intake and destination.</small></div>
            </div>
            <div className="grid two compact">
              <label>
                Programme type<span className="required">*</span>
                <div className="select-shell">
                  <select name="programme_type" required value={programmeType} onChange={e => setProgrammeType(e.target.value)}>
                    <option value="" disabled>Choose a programme type</option>
                    {portalOptions.programme_type.map(type => <option key={type}>{type}</option>)}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
              <label>
                Preferred intake<span className="required">*</span>
                <div className="select-shell">
                  <select name="intake" required value={intake} onChange={e => setIntake(e.target.value)} disabled={!chosen}>
                    <option value="" disabled>
                      Choose an intake
                    </option>
                    {(chosen?.intake_options || []).map(option => <option key={option}>{option}</option>)}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
              <label>
                Study country<span className="required">*</span>
                <div className="select-shell">
                  <select name="destination" required value={destination} onChange={e => setDestination(e.target.value)}>
                    <option value="" disabled>
                      Choose a destination
                    </option>
                    {portalOptions.destination.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
              <label>
                Study city<span className="required">*</span>
                <input name="destination_city" required maxLength="100" placeholder="e.g. Toronto" value={destinationCity} onChange={e => setDestinationCity(e.target.value)} />
              </label>
            </div>
            <div className="event-subheading"><b>Meet us at an event</b><small>Pick the event you’re planning to attend.</small></div>
            <label className="full-label">
              Event<span className="required">*</span>
              <div className="select-shell">
                <select name="event_id" required value={eventId} onChange={e => setEventId(e.target.value)}>
                  <option value="" disabled>
                    Select an upcoming event
                  </option>
                  {events.map((ev) => (
                    <option value={ev.id} key={ev.id}>
                      {ev.name} · {ev.city} ·{" "}
                      {new Date(ev.date + "T00:00:00").toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </div>
            </label>
            <label className="full-label message-label">
              Anything you’d like us to know?{" "}
              <span className="optional">OPTIONAL</span>
              <textarea
                name="message"
                value={formValues.message}
                onChange={updateField}
                rows="3"
                maxLength="1000"
                placeholder="Tell us about your goals or ask a question..."
              ></textarea>
            </label>
            </div>
            <div className="form-step review-step" hidden={applicationStep !== 4}>
              <div className="review-heading"><span className="number"><Check size={15}/></span><div><b>Review your application</b><small>Check these details before sending your interest.</small></div></div>
              <div className="review-grid">
                <article><small>YOUR DETAILS</small><b>{formValues.full_name || "Name not entered"}</b><span>{formValues.email || "Email not entered"}</span><span>{formValues.phone || "Phone not entered"}</span><span>{formValues.student_location || "Location not entered"}</span><button type="button" onClick={() => setApplicationStep(1)}>Edit details</button></article>
                <article><small>COURSE & UNIVERSITY</small><b>{chosen?.name || "No course selected"}</b><span>{selectedOffering ? `${selectedOffering.institution} · ${selectedOffering.city}, ${selectedOffering.country}` : "Choose a partner university"}</span><span>{chosen ? `${money(selectedOffering?.price || chosen.price)} / year` : "Tuition shown after course selection"}</span><button type="button" onClick={() => setApplicationStep(2)}>Edit course</button></article>
                <article><small>STUDY PLANS</small><b>{programmeType || "Programme type not selected"}</b><span>{intake || "Intake not selected"}</span><span>{destinationCity && destination ? `${destinationCity}, ${destination}` : "Destination not selected"}</span><span>{events.find(item => String(item.id) === String(eventId))?.name || "Event not selected"}</span><button type="button" onClick={() => setApplicationStep(3)}>Edit plans</button></article>
              </div>
              {formValues.message && <p className="review-note"><b>Your note:</b> {formValues.message}</p>}
            </div>
            <div className="form-bottom">
              <p>
                {applicationStep === 4 ? "By submitting, you agree that TGM Education may contact you about your study plans." : "Your progress stays in this form while you move between steps."}
              </p>
              <div className="form-actions">
                {applicationStep > 1 && <button className="back-step" type="button" onClick={() => { setError(""); setApplicationStep(current => current - 1); }}>Back</button>}
                {applicationStep < 4 ? <button className="submit" type="button" onClick={continueApplication}>Continue <ArrowRight size={17}/></button> : <button className="submit" type="submit" disabled={busy || loading || !!loadError || !courses.length || !events.length}>{busy ? "Sending..." : "Send my interest"} <ArrowRight size={17}/></button>}
              </div>
            </div>
          </form>
        </section>
        <aside className="application-summary" aria-label="Application summary">
          <div className="summary-top"><span><ClipboardList size={17}/></span><div><b>Your application</b><small>Live summary</small></div></div>
          <div className="summary-row"><small>Course</small><b>{chosen?.name || "Choose a course"}</b></div>
          <div className="summary-row"><small>University</small><b>{selectedOffering?.institution || "Choose a partner location"}</b></div>
          <div className="summary-row"><small>Destination</small><b>{destinationCity && destination ? `${destinationCity}, ${destination}` : "Select your study destination"}</b></div>
          <div className="summary-row"><small>Intake</small><b>{intake || "Choose an available intake"}</b></div>
          <div className="summary-total"><small>Estimated annual tuition</small><strong>{chosen ? money(selectedOffering?.price || chosen.price) : "—"}</strong><span>Final fees may vary by university.</span></div>
          <p><ShieldCheck size={14}/> Your details are only used to support your study enquiry.</p>
        </aside>
        </div>
        <footer>
          <a className="brand footer-brand" href="#top">
            <span className="brand-mark">
              <GraduationCap size={18} />
            </span>
            <span>
              TGM <b>EDUCATION</b>
            </span>
          </a>
          <span>Helping students find their way since 2008.</span>
          <span>© 2026 TGM Education</span>
        </footer>
      </main>
    </div>
  );
}
