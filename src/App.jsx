import React, { useEffect, useState } from "react";
import Admin from "./Admin.jsx";
import { api } from "./api.js";
import { DESTINATIONS as destinations, validateStudentInquiry } from "./validation.js";
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
} from "lucide-react";

const money = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n));

export default function App() {
  const [showAdmin, setShowAdmin] = useState(window.location.pathname.replace(/\/$/, "") === "/admin");
  useEffect(() => {
    const syncRoute = () => setShowAdmin(window.location.pathname.replace(/\/$/, "") === "/admin");
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);
  function navigate(path) {
    window.history.pushState({}, "", path);
    setShowAdmin(path === "/admin");
  }
  return showAdmin
    ? <Admin onStudent={() => navigate("/")} />
    : <StudentPortal onAdmin={() => navigate("/admin")} />;
}

function StudentPortal({ onAdmin }) {
  const [courses, setCourses] = useState([]),
    [events, setEvents] = useState([]),
    [query, setQuery] = useState(""),
    [courseId, setCourseId] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const [formValues, setFormValues] = useState({
    full_name: "", email: "", phone: "", student_location: "", message: "",
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
  const visible = query.trim() ? matches : courses;
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
          <button className="admin-entry" onClick={onAdmin}>Admin</button>
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
              <h2>Let’s get to know you.</h2>
              <p>
                Share a few details and we’ll connect you with the right course.
              </p>
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
                placeholder="Search courses by name, level or city..."
              />
              <span>{searching ? 'Searching...' : `${visible.length} courses`}</span>
            </div>
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
                    <span><b>{course.name}</b><small>{course.level} · {course.location}</small></span>
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
                      {c.name} · {c.level} · {c.location} · {money(c.price)}
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
                    {chosen.level} · {chosen.location}
                  </small>
                </span>
                <strong>
                  {money(chosen.price)}
                  <small> / year</small>
                </strong>
              </div>
            )}
            <div className="grid two compact">
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
                Preferred study destination<span className="required">*</span>
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
