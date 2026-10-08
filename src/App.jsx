import React, { useEffect, useState } from "react";
import Admin from "./Admin.jsx";
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
} from "lucide-react";

const money = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n));

export default function App() {
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
  if (showAdmin) return <Admin onStudent={() => navigate("/")} />;
  if (authChecking) return <main className="portal-entry"><p role="status">Restoring your session...</p></main>;
  if (!authenticated) return <PortalEntry onContinue={() => setAuthenticated(true)} onAdmin={() => navigate("/portal")} />;
  return <StudentDashboard onLogout={async () => { await api("/api/auth/logout/", { method: "POST", body: "{}" }).catch(() => {}); setAuthenticated(false); }}><StudentPortal /></StudentDashboard>;
}

function PortalEntry({ onContinue, onAdmin }) {
  const [role, setRole] = useState("Student");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", email: "", full_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const body = { ...form, role };
      const result = await api(mode === "signup" ? "/api/auth/signup/" : "/api/admin/login/", { method: "POST", body: JSON.stringify(body) });
      if (role === "Student") {
        const existing = JSON.parse(localStorage.getItem("student_profile") || "{}");
        localStorage.setItem("student_profile", JSON.stringify({ ...existing, full_name: result.full_name || existing.full_name || form.full_name, email: result.email || existing.email || form.email }));
        onContinue();
      } else onAdmin();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="portal-entry">
    {role === "Student" && <section className="entry-hero"><div><span className="eyebrow"><Sparkles size={13}/> YOUR NEXT CHAPTER STARTS HERE</span><h2>Find your place<br/>in the <em>world.</em></h2><p>Start your study abroad journey with TGM Education.</p></div><Globe2 size={78} strokeWidth={1.1}/></section>}
    <section className="portal-entry-card">
      <div className="admin-lock"><GraduationCap size={23} /></div>
      <span className="admin-kicker">TGM EDUCATION</span>
      <h1>Welcome to Student Portal</h1>
      <p>Sign in to continue to your space, or choose a role to begin.</p>
      <label>Continue as<select value={role} onChange={e => setRole(e.target.value)}><option>Student</option><option>Admin</option><option>Counsellor</option><option>Super Admin</option></select></label>
      {error && <div className="entry-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="entry-form">
        {mode === "signup" && role === "Student" && <label>Full name<input required value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} /></label>}
        {mode === "signup" && role === "Student" && <label>Email<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>}
        {mode === "signup" && ["Admin", "Counsellor"].includes(role) && <label>Staff ID<input required value={form.staff_id || ""} onChange={e => setForm({...form, staff_id:e.target.value})} /></label>}
        {mode === "signup" && ["Admin", "Counsellor"].includes(role) && <label>Organisation code<input required type="password" value={form.organisation_code || ""} onChange={e => setForm({...form, organisation_code:e.target.value})} /></label>}
        {mode === "signup" && role === "Super Admin" && <label>Super Admin access code<input required type="password" value={form.access_code || ""} onChange={e => setForm({...form, access_code:e.target.value})} /></label>}
        <label>Username<input required value={form.username} onChange={e => setForm({...form, username:e.target.value})} /></label>
        <label>Password<input required minLength="8" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
        <button className="entry-primary" disabled={busy}>{busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={16} /></button>
      </form>
      {role !== "Student" && <button className="entry-link" onClick={onAdmin}>Use the staff portal</button>}
      <button className="entry-link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</button>
      {role === "Student" && <button className="entry-link" onClick={onContinue}>Continue as guest for event registration</button>}
    </section>
  </main>;
}

function StudentDashboard({ children, onLogout }) {
  const [view, setView] = useState("Apply");
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("student_profile") || '{"full_name":"","email":"","phone":"","student_location":""}'));
  const [saved, setSaved] = useState(false);
  const reference = localStorage.getItem("student_application_reference");
  const application = JSON.parse(localStorage.getItem("student_application_details") || "null");
  function saveProfile(e) { e.preventDefault(); localStorage.setItem("student_profile", JSON.stringify(profile)); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  return <div className="student-app-shell">
    <aside className="student-side"><a className="student-brand" href="/"><span><GraduationCap size={18}/></span><b>TGM Education <em>|</em> Student</b></a><small className="student-nav-label">MY SPACE</small>
      {[['Overview', LayoutDashboard], ['Apply', ClipboardList], ['Profile', UserRound], ['Application status', Bell]].map(([name, Icon]) => <button key={name} className={`student-nav-item ${view === name ? 'active' : ''}`} onClick={() => setView(name)}><Icon size={17}/>{name}</button>)}
      <div className="student-side-bottom"><button className="student-signout" onClick={onLogout}>Sign out</button></div>
    </aside>
    <main className="student-workspace"><header className="student-workspace-top"><div><span>MY SPACE /</span> {view}</div><span className="student-online"><i/> Signed in</span></header>
      {view === 'Overview' && <section className="student-dashboard-home"><div className="student-welcome"><small>STUDENT DASHBOARD</small><h1>Keep your study plans moving.</h1><p>Search courses, submit an application and follow the next steps from one place.</p><button className="entry-primary" onClick={() => setView('Apply')}>Start an application <ArrowRight size={16}/></button></div><div className="student-dashboard-cards"><article><ClipboardList/><b>Applications</b><strong>{reference ? '1 active' : 'No applications yet'}</strong><button onClick={() => setView(reference ? 'Application status' : 'Apply')}>{reference ? 'Track application' : 'Apply now'}</button></article><article><UserRound/><b>Profile</b><strong>Keep your details up to date</strong><button onClick={() => setView('Profile')}>Update profile</button></article></div></section>}
      {view === 'Apply' && children}
      {view === 'Profile' && <section className="student-panel"><div className="student-panel-heading"><div><small>YOUR DETAILS</small><h1>Profile</h1><p>Keep your contact details current so our counsellors can reach you.</p></div></div><form className="student-profile-form" onSubmit={saveProfile}><label>Full name<input required value={profile.full_name} onChange={e => setProfile({...profile, full_name:e.target.value})}/></label><label>Email address<input required type="email" value={profile.email} onChange={e => setProfile({...profile, email:e.target.value})}/></label><label>Phone number<input required value={profile.phone} onChange={e => setProfile({...profile, phone:e.target.value})}/></label><label>Current city and country<input required placeholder="e.g. Lagos, Nigeria" value={profile.student_location} onChange={e => setProfile({...profile, student_location:e.target.value})}/></label><button className="entry-primary">{saved ? 'Profile saved' : 'Save changes'}</button></form></section>}
      {view === 'Application status' && <section className="student-panel"><div className="student-panel-heading"><small>APPLICATION TRACKER</small><h1>Application status</h1><p>Follow your progress and know what happens next.</p></div>{reference ? <><div className="application-timeline"><div className="timeline-step done"><b>Interest submitted</b><span>Reference: {reference}</span></div><div className="timeline-step"><b>Counsellor review</b><span>Our team will contact you with guidance.</span></div><div className="timeline-step"><b>Application and visa support</b><span>Documents and next steps will appear here.</span></div></div><div className="application-details"><div className="details-heading"><div><small>SUBMISSION RECORD</small><h2>Application details</h2></div><span className="status-badge">Submitted</span></div><dl><dt>Reference</dt><dd>{reference}</dd><dt>Applicant</dt><dd>{application?.full_name || profile.full_name || 'Not provided'}</dd><dt>Email</dt><dd>{application?.email || profile.email || 'Not provided'}</dd><dt>Phone</dt><dd>{application?.phone || profile.phone || 'Not provided'}</dd><dt>Course</dt><dd>{application?.course_name || 'Selected course'}</dd><dt>Programme type</dt><dd>{application?.programme_type || 'Not provided'}</dd><dt>Intake</dt><dd>{application?.intake || 'Not provided'}</dd><dt>Study destination</dt><dd>{application?.destination_city ? `${application.destination_city}, ${application.destination}` : application?.destination || 'Not provided'}</dd><dt>Event</dt><dd>{application?.event_name || 'Selected event'}</dd><dt>Message</dt><dd>{application?.message || 'No message added'}</dd></dl></div></> : <div className="student-empty"><ClipboardList/><b>No application yet</b><span>Start by telling us what you want to study.</span><button className="entry-primary" onClick={() => setView('Apply')}>Start application</button></div>}</section>}
    </main><StudentSupport />
  </div>;
}

function StudentSupport() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ from: "bot", text: "Hi! I can help you think through a course, programme type or study destination." }]);
  function reply(text) {
    const value = text.trim(); if (!value) return;
    const lower = value.toLowerCase();
    let answer = "A good next step is to search the course catalogue, choose your programme type, then compare the countries and cities where you would like to study.";
    if (lower.includes("cyber") || lower.includes("technology") || lower.includes("data")) answer = "For a technology path, start with Cyber Security, Data Science or Artificial Intelligence. Choose Undergraduate for a first degree or Postgraduate if you already have a related degree.";
    else if (lower.includes("business") || lower.includes("finance")) answer = "For a business path, compare Business Management, Accounting and Finance, and Project Management. Your preferred intake and destination can be selected separately.";
    else if (lower.includes("visa") || lower.includes("document")) answer = "Our counsellors can guide you through documents and visa steps after you submit your interest. Keep your passport and academic records ready.";
    else if (lower.includes("country") || lower.includes("where")) answer = "You can choose the course first and then select the country and city independently. Popular options include the UK, Canada, Australia, Ireland and the United States.";
    setMessages(current => [...current, { from: "user", text: value }, { from: "bot", text: answer }]); setMessage("");
  }
  return <>
    <a className="whatsapp-support" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "2348000000000"}?text=Hello%20TGM%20Education%2C%20I%20need%20help%20with%20studying%20abroad.`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> WhatsApp support</a>
    {open && <section className="advisor-panel" aria-label="Student advisor"><header><div><b>Study advisor</b><small>Course and destination guidance</small></div><button onClick={() => setOpen(false)} aria-label="Close advisor">×</button></header><div className="advisor-messages">{messages.map((item, index) => <p key={index} className={item.from}>{item.text}</p>)}</div><div className="advisor-suggestions"><button onClick={() => reply("Which course suits technology?")}>Technology courses</button><button onClick={() => reply("Which country should I choose?")}>Choose a country</button><button onClick={() => reply("What documents do I need?")}>Visa guidance</button></div><form onSubmit={e => { e.preventDefault(); reply(message); }}><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask about your study plans..."/><button aria-label="Send message"><Send size={15}/></button></form></section>}
    {!open && <button className="advisor-launcher" onClick={() => setOpen(true)} aria-label="Open study advisor"><MessageCircle size={18}/> Study advisor</button>}
  </>;
}

function StudentPortal() {
  const [courses, setCourses] = useState([]),
    [events, setEvents] = useState([]),
    [query, setQuery] = useState(""),
    [courseId, setCourseId] = useState(""),
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
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  function updateField(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }
  async function loadOptions(signal) {
    setLoading(true);
    setLoadError("");
    try {
      const [courseData, eventData] = await Promise.all([
        api("/api/courses/", signal ? { signal } : {}),
        api("/api/events/", signal ? { signal } : {}),
      ]);
      setCourses(courseData.courses);
      setEvents(eventData.events);
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
  const regions = [...new Set(courses.flatMap(course => (course.offerings || []).map(item => item.region)))].sort();
  const chosen = matches.find((c) => String(c.id) === String(courseId)) || courses.find((c) => String(c.id) === String(courseId));
  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const data = Object.fromEntries(form.entries());
    data.course_id = Number(data.course_id);
    data.event_id = Number(data.event_id);
    const validation = validateStudentInquiry(data, [...matches, ...courses], events);
    if (Object.keys(validation).length) {
      setError(Object.values(validation).join(" "));
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
      formElement.reset();
      setFormValues({ full_name: "", email: "", phone: "", student_location: "", message: "" });
      setCourseId("");
      setIntake("");
      setQuery("");
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
        <section className="form-wrap">
          <div className="form-intro">
            <div>
              <div className="step-label">
                STUDENT INTEREST FORM <span>•</span> 2 MIN
              </div>
            </div>
            <div className="progress">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
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
          {loading && <p role="status">Loading courses and events...</p>}
          {loadError && <div className="error" role="alert">{loadError} <button type="button" onClick={() => loadOptions()}>Retry</button></div>}
          {!loading && !loadError && !events.length && <p className="error">No upcoming events are available yet. Please check back soon.</p>}
          <form onSubmit={submit}>
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
            <div className="section-heading course-heading">
              <span className="number">02</span>
              <div>
                <b>Your study plans</b>
                <small>What would you like to explore?</small>
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
                <small>AVAILABLE STUDY LOCATIONS</small>
                <div className="course-offering-list">
                  {chosen.offerings.map(item => (
                    <span key={`${item.institution}-${item.city}`}>
                      {item.institution} · {item.city}, {item.country}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid two compact">
              <label>
                Programme type<span className="required">*</span>
                <div className="select-shell">
                  <select name="programme_type" required defaultValue="">
                    <option value="" disabled>Choose a programme type</option>
                    {programmeTypes.map(type => <option key={type}>{type}</option>)}
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
                  <select name="destination" required defaultValue="">
                    <option value="" disabled>
                      Choose a destination
                    </option>
                    {destinations.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
              <label>
                Study city<span className="required">*</span>
                <input name="destination_city" required maxLength="100" placeholder="e.g. Toronto" />
              </label>
            </div>
            <div className="section-heading event-heading">
              <span className="number">03</span>
              <div>
                <b>Meet us at an event</b>
                <small>Pick the event you’re planning to attend.</small>
              </div>
            </div>
            <label className="full-label">
              Event<span className="required">*</span>
              <div className="select-shell">
                <select name="event_id" required defaultValue="">
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
            <div className="form-bottom">
              <p>
                By submitting, you agree that TGM Education may contact you
                about your study plans.
              </p>
              <button className="submit" type="submit" disabled={busy || loading || !!loadError || !courses.length || !events.length}>
                {busy ? "Sending..." : "Send my interest"}{" "}
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </section>
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
