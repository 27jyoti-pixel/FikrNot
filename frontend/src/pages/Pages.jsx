import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Search,
  ArrowRight,
  Heart,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  TrendingUp,
  PackageSearch,
  Plus,
  Filter,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Laptop,
  CreditCard,
  BookOpen,
  Shirt,
  Watch,
  KeyRound,
  Briefcase,
  Grid3X3,
  ArrowDownAZ,
  UserRound,
  LockKeyhole,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  Clock3,
  Inbox,
  AlertCircle,
  LogOut,
  Building2,
  ClipboardCheck,
  Users,
  RefreshCw,
  Image as ImageIcon,
  Lightbulb,
  Trash2,
  Bell,
  MessageCircle,
  PackageCheck,
  RotateCw,
} from "lucide-react";
import ItemCard from "../components/items/ItemCard";
import MiniItem from "../components/items/MiniItem";
import RecoveryJourney from "../components/landing/RecoveryJourney";
import ClaimCard from "../components/claims/ClaimCard";
import Brand from "../components/brand/Brand";
import ModerationControl from "../components/rector/ModerationControl";
import LocationSelector from "../components/reports/LocationSelector";
import ReportImagePicker from "../components/reports/ReportImagePicker";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Stat from "../components/analytics/Stat";
import { Loading, ErrorState, EmptyState } from "../components/common/States";
import useAuth from "../hooks/useAuth";
import * as authApi from "../api/authApi";
import * as hostelApi from "../api/hostelApi";
import * as lostApi from "../api/lostApi";
import * as foundApi from "../api/foundApi";
import * as matchApi from "../api/matchApi";
import * as claimApi from "../api/claimApi";
import * as recApi from "../api/recoveryApi";
import * as notifApi from "../api/notificationApi";
import * as userApi from "../api/userApi";
import * as analyticsApi from "../api/analyticsApi";
import http, { dataOf, listOf, errorMessage } from "../api/axiosClient";
import { CATEGORIES } from "../utils/constants";
import { fmtDate, entityId, imageUrl } from "../utils/formatters";
import { homePathForUser } from "../utils/roleRouting";

function PageHead({ eyebrow, title, description, children }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function BrowseSelect({ label, value, options, onChange, icon: Icon, className = "" }) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [dropUp, setDropUp] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(260);
  const selected = options[selectedIndex] || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const roomBelow = window.innerHeight - rect.bottom - 8;
      const roomAbove = rect.top - 8;
      const desiredHeight = Math.min(260, window.innerHeight - 24);
      const opensUp = roomBelow < desiredHeight && roomAbove > roomBelow;
      setDropUp(opensUp);
      setMenuMaxHeight(Math.max(72, Math.min(desiredHeight, (opensUp ? roomAbove : roomBelow) - 4)));
      const menuWidth = Math.min(320, Math.max(rect.width, 220));
      setAlignRight(rect.left + menuWidth > window.innerWidth - 12);
    }
    setActiveIndex(selectedIndex);
    setOpen(true);
  };
  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };
  const handleKeyDown = (event) => {
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) event.preventDefault();
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) openMenu();
      return;
    }
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "ArrowDown") setActiveIndex((index) => (index + 1) % options.length);
    if (event.key === "ArrowUp") setActiveIndex((index) => (index - 1 + options.length) % options.length);
    if (event.key === "Home") setActiveIndex(0);
    if (event.key === "End") setActiveIndex(options.length - 1);
    if (event.key === "Enter" || event.key === " ") choose(options[activeIndex]);
  };

  return (
    <div ref={rootRef} className={`browse-select-control ${className} ${open ? "is-open" : ""}`}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-options`}
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        className="browse-select-trigger"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label || "Select"}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div id={`${id}-options`} role="listbox" aria-label={label} className={`browse-select-menu ${dropUp ? "drop-up" : ""} ${alignRight ? "align-right" : ""}`} style={{ maxHeight: menuMaxHeight }}>
          {options.map((option, index) => (
            <button
              ref={(node) => { optionRefs.current[index] = node; }}
              key={option.value || "all"}
              id={`${id}-option-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              className={`${index === activeIndex ? "is-active" : ""} ${option.value === value ? "is-selected" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <CheckCircle2 size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useLoad(loader, deps = []) {
  const [state, set] = useState({ loading: true, error: "", data: null });
  const load = useCallback(async () => {
    set((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await loader();
      set({ loading: false, error: "", data });
    } catch (e) {
      set((s) => ({ ...s, loading: false, error: errorMessage(e) }));
    }
  }, deps);
  useEffect(() => {
    load();
  }, [load]);
  return {
    ...state,
    reload: load,
    setData: (d) =>
      set((s) => ({ ...s, data: typeof d === "function" ? d(s.data) : d })),
  };
}
export function Home() {
  const { user } = useAuth();
  return (
    <div className="home">
      <section className="hero-main" aria-label="Campus lost and found">
        <div className="hero-lost">
          <h1>Lost something?</h1>
          <p>Let’s help it find its way back.</p>
          <Link className="button primary large" to={user ? "/report/lost" : "/login"}>Report a lost item <ArrowRight size={18} /></Link>
        </div>
        <div className="hero-found">
          <h2>Found something?</h2>
          <p>Help someone reunite with what matters.</p>
          <Link className="button secondary large" to={user ? "/report/found" : "/login"}>Report a found item <ArrowRight size={18} /></Link>
        </div>
      </section>
      <RecoveryJourney />
      <section className="home-campus-banner" role="img" aria-label="Same campus, kinder people. Small items make big differences. At FikrNot, we believe every lost item has a story and a way back to its owner." />
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const section = ref.current;
    if (!section) return undefined;
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      section.classList.add("is-visible");
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function Login({ rectorEntry = false }) {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [values, set] = useState({ email: "", password: "" }),
    [busy, B] = useState(false),
    [err, E] = useState(""),
    [show, S] = useState(false);
  if (user)
    return <Navigate to={homePathForUser(user)} replace />;
  async function submit(e) {
    e.preventDefault();
    B(true);
    E("");
    try {
      const u = await login(values);
      nav(homePathForUser(u), { replace: true });
    } catch (x) {
      E(errorMessage(x));
    } finally {
      B(false);
    }
  }
  return (
    <AuthPanel
      eyebrow={rectorEntry ? "CAMPUS STAFF" : "STUDENT"}
      title={rectorEntry ? "Rector sign in" : "Student sign in"}
      description={rectorEntry ? "Sign in to manage reports, claims and recovery for your assigned hostel." : "Sign in to report lost items, browse found items and connect with your campus community."}
      rectorEntry={rectorEntry}
      studentEntry={!rectorEntry}
    >
      <form onSubmit={submit} className="form-stack">
        {err && (
          <div className="form-alert" role="alert">
            {err}
          </div>
        )}
        <label>
          Email address
          <span className="rector-input-wrap">
            <Mail size={20} aria-hidden="true" />
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="you@campus.edu"
              value={values.email}
              onChange={(e) => set({ ...values, email: e.target.value })}
            />
          </span>
        </label>
        <label>
          Password
          <div className="password-field">
            <LockKeyhole
              className="rector-password-icon"
              size={20}
              aria-hidden="true"
            />
            <input
              required
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={(e) => set({ ...values, password: e.target.value })}
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => S(!show)}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <button
          disabled={busy}
          className={`button primary auth-submit${rectorEntry ? " rector-submit" : ""}`}
        >
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={17} />
        </button>
        <p className="auth-foot">
          {rectorEntry ? (
            <>Not a Rector? <Link to="/login">Student sign in →</Link></>
          ) : (
            <>Not a student? <Link to="/rector-login">Rector sign in →</Link></>
          )}
        </p>
      </form>
    </AuthPanel>
  );
}
function AuthPanel({
  eyebrow = "CAMPUS LOST & FOUND",
  title,
  description,
  rectorEntry = false,
  studentEntry = false,
  registerEntry = false,
  children,
}) {
  if (registerEntry) {
    return (
      <div className="registration-page">
        <section className="registration-card" aria-label="Student registration">
          <div className="registration-story">
            <div className="registration-story-copy">
              <h2>Your campus journey starts here</h2>
              <p>A few details to help your finds get home.</p>
            </div>
            <div className="registration-art-stage">
              {/* <div className="registration-art-copy">
                <p className="registration-art-heading">Welcome back, Explorer!</p>
                <p className="registration-art-description">
                  Find what's lost. Return what's found. Your campus community is here.
                </p>
              </div> */}
              <img
                className="registration-art"
                src="/student-registration-hero.png"
                alt="A curious rabbit explorer with a backpack among campus books and greenery."
              />
            </div>
          </div>
          <section
            className="registration-form-panel"
            aria-labelledby="registration-title"
          >
            {/* <div className="eyebrow registration-eyebrow">{eyebrow}</div> */}
            <h1 id="registration-title">{title}</h1>
            <p className="registration-description">{description}</p>
            {children}
          </section>
        </section>
      </div>
    );
  }

  if (rectorEntry) {
    return (
      <div className="rector-login-page">
        <div className="rector-login-layout">
          <img
            className="rector-login-art"
            src="/rector-detective-reference.png"
            alt="Welcome back, finder. A campus detective rabbit investigates a lost key among paw prints and plants."
          />
          <section
            className="auth-card rector-login-card"
            aria-labelledby="rector-login-title"
          >
            {/* <Brand className="brand auth-brand" />
            <div className="eyebrow auth-eyebrow">{eyebrow}</div> */}
            <h1 id="rector-login-title">{title}</h1>
            <p>{description}</p>
            {children}
          </section>
        </div>
      </div>
    );
  }
  if (studentEntry) {
    return (
      <div className="student-login-page">
        <div className="student-login-layout">
          <img
            className="student-login-art"
            src="/student-explorer-reference.png"
            alt="Welcome back, explorer. Find what’s lost. Return what’s found. Your campus community is here. A curious rabbit looks through a magnifying glass over campus lost-and-found books."
          />
          <section
            className="auth-card student-login-card"
            aria-labelledby="student-login-title"
          >
            {/* <Brand className="brand auth-brand" />
            <div className="eyebrow auth-eyebrow">{eyebrow}</div> */}
            <h1 id="student-login-title">{title}</h1>
            <p>{description}</p>
            {children}
          </section>
        </div>
      </div>
    );
  }
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Brand className="brand auth-brand" />
        <div className="eyebrow auth-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}
export function Register() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const host = useLoad(hostelApi.getHostels, []);
  const [form, F] = useState({
      name: "",
      email: "",
      password: "",
      phone: "",
      studentId: "",
      hostelId: "",
      course: "",
      department: "",
      year: "",
      semester: "",
      roomNumber: "",
    }),
    [err, E] = useState(""),
    [busy, B] = useState(false),
    [showPassword, P] = useState(false);
  if (user) return <Navigate to="/dashboard" />;
  async function submit(e) {
    e.preventDefault();
    B(true);
    E("");
    try {
      await register({
        ...form,
        year: Number(form.year || 1),
        semester: Number(form.semester || 1),
      });
      nav("/dashboard");
    } catch (x) {
      E(errorMessage(x));
    } finally {
      B(false);
    }
  }
  return (
    <AuthPanel
      eyebrow="JOIN FikrNot"
      title="Create your student account"
      description="Use your campus details to get started."
      registerEntry
    >
      <form onSubmit={submit} className="form-stack register-form">
        {err && (
          <div className="form-alert" role="alert">
            {err}
          </div>
        )}
        <div className="form-grid">
          <label>
            Full name
            <RegistrationControl icon={UserRound}>
              <input
                required
                autoComplete="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => F({ ...form, name: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Student ID
            <RegistrationControl icon={ShieldCheck}>
              <input
                required
                placeholder="Enter your student ID"
                value={form.studentId}
                onChange={(e) => F({ ...form, studentId: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Email address
            <RegistrationControl icon={Mail}>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                required
                value={form.email}
                onChange={(e) => F({ ...form, email: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            <span className="registration-label-text">
              Phone <span className="optional">(optional)</span>
            </span>
            <RegistrationControl icon={Phone}>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={(e) => F({ ...form, phone: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Hostel
            {host.loading ? (
              <span className="select-message">Loading hostels...</span>
            ) : host.error ? (
              <span className="inline-error">
                Unable to load hostels.{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={host.reload}
                >
                  Try again
                </button>
              </span>
            ) : !host.data?.length ? (
              <span className="inline-error">No active hostels available</span>
            ) : (
              <HostelDropdown
                hostels={host.data}
                value={form.hostelId}
                onChange={(hostelId) => F({ ...form, hostelId })}
              />
            )}
          </label>
          <label>
            Room number
            <RegistrationControl icon={MapPin}>
              <input
                placeholder="Enter your room number"
                value={form.roomNumber}
                onChange={(e) => F({ ...form, roomNumber: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Course
            <RegistrationControl icon={PackageSearch}>
              <input
                placeholder="Enter your course"
                value={form.course}
                onChange={(e) => F({ ...form, course: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Department
            <RegistrationControl icon={Building2}>
              <input
                placeholder="Enter your department"
                value={form.department}
                onChange={(e) => F({ ...form, department: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Year
            <RegistrationControl icon={CalendarDays}>
              <input
                type="number"
                min="1"
                placeholder="Enter your year"
                value={form.year}
                onChange={(e) => F({ ...form, year: e.target.value })}
              />
            </RegistrationControl>
          </label>
          <label>
            Password
            <RegistrationControl icon={LockKeyhole} className="registration-password-control">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength="6"
                autoComplete="new-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => F({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => P(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </RegistrationControl>
          </label>
        </div>
        <button
          className="button primary auth-submit"
          disabled={busy || host.loading || !host.data?.length}
        >
          {busy ? "Creating account…" : "Create student account"}
          <ArrowRight size={17} />
        </button>
        <p className="auth-foot">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthPanel>
  );
}

function RegistrationControl({ icon: Icon, className = "", children }) {
  return (
    <span className={`registration-control ${className}`}>
      <Icon size={20} aria-hidden="true" />
      {children}
    </span>
  );
}

function HostelDropdown({ hostels, value, onChange }) {
  const controlRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const selectedIndex = hostels.findIndex((hostel) => hostel._id === value);
  const selectedHostel = selectedIndex >= 0 ? hostels[selectedIndex] : null;
  const listId = "registration-hostel-options";

  const updatePosition = useCallback(() => {
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 8;
    const gap = 6;
    const desiredHeight = Math.min(hostels.length * 40, 272);
    const below = Math.max(0, window.innerHeight - rect.bottom - viewportPadding - gap);
    const above = Math.max(0, rect.top - viewportPadding - gap);
    const openAbove = below < desiredHeight && above > below;
    const maxHeight = Math.min(desiredHeight, openAbove ? above : below);
    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const left = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding));
    setPosition({
      left,
      width,
      maxHeight,
      top: openAbove ? Math.max(viewportPadding, rect.top - gap - maxHeight) : rect.bottom + gap,
    });
  }, [hostels.length]);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const closeOnOutsidePointer = (event) => {
      if (!controlRef.current?.contains(event.target) && !event.target.closest?.(".hostel-dropdown-menu")) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  function choose(hostel) {
    onChange(hostel._id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + hostels.length) % hostels.length);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : hostels.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (hostels[activeIndex]) choose(hostels[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  return (
    <span ref={controlRef} className="registration-control registration-select-control hostel-dropdown-control">
      <Building2 size={20} aria-hidden="true" />
      <button
        ref={triggerRef}
        type="button"
        className={`hostel-dropdown-trigger${selectedHostel ? " has-value" : ""}`}
        role="combobox"
        aria-label="Hostel"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-required="true"
        onClick={() => {
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        {selectedHostel?.name || <span className="hostel-dropdown-placeholder">Select your hostel</span>}
      </button>
      <ChevronDown className="registration-select-chevron" size={18} aria-hidden="true" />
      <input
        className="hostel-dropdown-required"
        tabIndex={-1}
        required
        value={value}
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
          setOpen(true);
        }}
        aria-hidden="true"
      />
      {open && position && createPortal(
        <div
          id={listId}
          className="hostel-dropdown-menu"
          role="listbox"
          aria-label="Available hostels"
          style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
        >
          {hostels.map((hostel, index) => (
            <button
              ref={(node) => { optionRefs.current[index] = node; }}
              id={`${listId}-${index}`}
              key={hostel._id}
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={hostel._id === value}
              className={`hostel-dropdown-option${hostel._id === value ? " is-selected" : ""}${index === activeIndex ? " is-active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(hostel)}
            >
              <span>{hostel.name}</span>
              {hostel._id === value && <CheckCircle2 size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </span>
  );
}

export function Browse() {
  const [search, setSearch] = useSearchParams();
  const [filters, F] = useState({
    search: search.get("search") || "",
    category: search.get("category") || "",
    status: "",
    type: "all",
    hostelId: "",
    startDate: "",
    endDate: "",
  });
  const [page, P] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const host = useLoad(hostelApi.getHostels, []);
  const [result, R] = useState({
    loading: true,
    error: "",
    rows: [],
    pages: 1,
    total: 0,
  });
  const load = useCallback(async () => {
    R((s) => ({ ...s, loading: true, error: "" }));
    try {
      const params = {
        page,
        limit: 9,
        category: filters.category || undefined,
        status: filters.status || undefined,
        hostelId: filters.hostelId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      if (filters.search) params.search = filters.search;
      const calls =
        filters.type === "lost"
          ? [
              lostApi.getLost({
                ...params,
                itemName: filters.search || undefined,
              }),
            ]
          : filters.type === "found"
            ? [foundApi.getFound(params)]
            : [
                lostApi.getLost({
                  ...params,
                  itemName: filters.search || undefined,
                }),
                foundApi.getFound(params),
              ];
      const res = await Promise.all(calls);
      const reports = res
        .flatMap((r) => r.data?.data || [])
        .map((x) => ({ ...x, _type: x.lostAt ? "lost" : "found" }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      R({
        loading: false,
        error: "",
        rows: reports,
        pages: Math.max(...res.map((r) => r.data?.pagination?.totalPages || 1)),
        total: res.reduce((s, r) => s + (r.data?.pagination?.total || 0), 0),
      });
    } catch (e) {
      R({
        loading: false,
        error: errorMessage(e),
        rows: [],
        pages: 1,
        total: 0,
      });
    }
  }, [page, filters, search]);
  useEffect(() => {
    load();
  }, [load]);
  const visibleRows = useMemo(
    () => [...result.rows].sort((a, b) => {
      const difference = new Date(a.createdAt) - new Date(b.createdAt);
      return sortOrder === "oldest" ? difference : -difference;
    }),
    [result.rows, sortOrder],
  );
  const categoryIcons = {
    Electronics: Laptop,
    "ID/Cards": CreditCard,
    "Books/Stationery": BookOpen,
    Clothing: Shirt,
    Accessories: Watch,
    Keys: KeyRound,
    Bags: Briefcase,
    Other: Grid3X3,
  };
  const setCategory = (category) => {
    F((current) => ({ ...current, category }));
    P(1);
  };
  const typeOptions = [
    { value: "all", label: "Lost & found" },
    { value: "lost", label: "Lost items" },
    { value: "found", label: "Found items" },
  ];
  const categoryOptions = [
    { value: "", label: "All categories" },
    ...CATEGORIES.map((category) => ({ value: category, label: category })),
  ];
  const statusOptions = [
    { value: "", label: "All statuses" },
    ...["ACTIVE", "MATCH_FOUND", "CLAIM_IN_PROGRESS", "RECOVERED", "CLOSED", "REPORTED", "AWAITING_HANDOVER", "WITH_RECTOR", "RETURNED"].map((status) => ({
      value: status,
      label: status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    })),
  ];
  const hostelOptions = [
    { value: "", label: "All hostels" },
    ...(host.data || []).map((hostel) => ({ value: hostel._id, label: hostel.name })),
  ];
  return (
    <div className="content browse-page">
      <section className="browse-hero" aria-labelledby="browse-heading">
        <div className="browse-hero-copy">
          <div className="eyebrow">THE CAMPUS BOARD</div>
          <h1 id="browse-heading">Browse <span>lost</span> &amp; found items</h1>
          <p>Explore items reported from across campus and help reunite them with their owners.</p>
        </div>
      </section>
      <div className="browse-filters">
        <div className="searchbox">
          <Search size={18} />
          <input
            aria-label="Search item name"
            placeholder="Search by item name, brand, description..."
            value={filters.search}
            onChange={(e) => {
              F({ ...filters, search: e.target.value });
              P(1);
            }}
          />
        </div>
        <div className="browse-filter-controls">
          <BrowseSelect label="Report type" value={filters.type} options={typeOptions} icon={Filter} className="type-filter" onChange={(type) => { F({ ...filters, type }); P(1); }} />
          <BrowseSelect label="Category" value={filters.category} options={categoryOptions} onChange={setCategory} />
          <BrowseSelect label="Status" value={filters.status} options={statusOptions} onChange={(status) => { F({ ...filters, status }); P(1); }} />
          <div className="browse-date-range" role="group" aria-label="Filter by date range">
            <label className="browse-date-field"><span>Start</span><input aria-label="Start date" type="date" value={filters.startDate} onChange={(e) => { F({ ...filters, startDate: e.target.value }); P(1); }} /></label>
            <span className="browse-date-divider" aria-hidden="true" />
            <label className="browse-date-field"><span>End</span><input aria-label="End date" type="date" value={filters.endDate} onChange={(e) => { F({ ...filters, endDate: e.target.value }); P(1); }} /></label>
          </div>
          <BrowseSelect label="Hostel" value={filters.hostelId} options={hostelOptions} onChange={(hostelId) => { F({ ...filters, hostelId }); P(1); }} />
        </div>
      </div>
      <nav className="browse-categories" aria-label="Filter by category">
        <button className={!filters.category ? "active" : ""} aria-pressed={!filters.category} onClick={() => setCategory("")}><LayoutGrid size={18} aria-hidden="true" />All</button>
        {CATEGORIES.map((category) => {
          const Icon = categoryIcons[category] || Grid3X3;
          return <button key={category} className={filters.category === category ? "active" : ""} aria-pressed={filters.category === category} onClick={() => setCategory(category)}><Icon size={18} aria-hidden="true" />{category}</button>;
        })}
      </nav>
      {result.loading ? (
        <Loading label="Finding reports…" />
      ) : result.error ? (
        <ErrorState message={result.error} onRetry={load} />
      ) : result.rows.length ? (
        <>
          <div className="browse-results-toolbar">
            <strong>{result.total} reports</strong>
            <div className="browse-results-actions">
              <BrowseSelect label="Sort reports" value={sortOrder} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} icon={ArrowDownAZ} className="browse-sort-control" onChange={setSortOrder} />
              <div className="browse-view-toggle" role="group" aria-label="Results view">
                <button aria-label="Grid view" aria-pressed={viewMode === "grid"} className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}><LayoutGrid size={18} /></button>
                <button aria-label="List view" aria-pressed={viewMode === "list"} className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><List size={18} /></button>
              </div>
            </div>
          </div>
          <div className={`item-grid browse-item-grid ${viewMode === "list" ? "is-list" : ""}`}>
            {visibleRows.map((item) => (
              <ItemCard
                key={`${item._type}-${item._id}`}
                item={item}
                type={item._type}
              />
            ))}
          </div>
          {result.pages > 1 && (
            <div className="pagination browse-pagination">
              <button disabled={page <= 1} onClick={() => P(page - 1)}>
                <ChevronLeft size={17} />
                Previous
              </button>
              <div className="browse-page-numbers" aria-label="Report pages">
                {Array.from({ length: result.pages }, (_, index) => index + 1).map((number) => (
                  <button key={number} aria-label={`Page ${number}`} aria-current={page === number ? "page" : undefined} className={page === number ? "active" : ""} onClick={() => P(number)}>{number}</button>
                ))}
              </div>
              <button
                disabled={page >= result.pages}
                onClick={() => P(page + 1)}
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No reports match those filters"
          action={
            <button
              className="button outline"
              onClick={() =>
                F({
                  search: "",
                  category: "",
                  status: "",
                  type: "all",
                  hostelId: "",
                  startDate: "",
                  endDate: "",
                })
              }
            >
              Clear filters
            </button>
          }
        >
          Try another search or check back later for new reports.
        </EmptyState>
      )}
    </div>
  );
}

function ReportCategoryDropdown({ value, onChange, invalid }) {
  const controlRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, CATEGORIES.indexOf(value)));
  const [position, setPosition] = useState(null);
  const selectedIndex = CATEGORIES.indexOf(value);
  const listId = "report-category-options";

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const edge = 8;
    const gap = 5;
    const wantedHeight = Math.min(CATEGORIES.length * 40 + 8, 264);
    const roomBelow = Math.max(0, window.innerHeight - rect.bottom - edge - gap);
    const roomAbove = Math.max(0, rect.top - edge - gap);
    const openAbove = roomBelow < wantedHeight && roomAbove > roomBelow;
    const maxHeight = Math.max(40, Math.min(wantedHeight, openAbove ? roomAbove : roomBelow));
    setPosition({
      left: Math.max(edge, Math.min(rect.left, window.innerWidth - rect.width - edge)),
      width: Math.min(rect.width, window.innerWidth - edge * 2),
      top: openAbove ? Math.max(edge, rect.top - gap - maxHeight) : rect.bottom + gap,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const closeOnOutsidePointer = (event) => {
      if (!controlRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function choose(category) {
    onChange(category);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + CATEGORIES.length) % CATEGORIES.length);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : CATEGORIES.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (CATEGORIES[activeIndex]) choose(CATEGORIES[activeIndex]);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1 && /[\p{L}\p{N}]/u.test(event.key)) {
      const query = event.key.toLocaleLowerCase();
      const start = selectedIndex >= 0 ? selectedIndex + 1 : 0;
      const next = [...CATEGORIES.slice(start), ...CATEGORIES.slice(0, start)].findIndex((item) => item.toLocaleLowerCase().startsWith(query));
      if (next >= 0) setActiveIndex((start + next) % CATEGORIES.length);
    }
  }

  return (
    <span ref={controlRef} className="report-category-control">
      <button
        ref={triggerRef}
        id="report-category-trigger"
        type="button"
        className={`report-category-trigger${value ? " has-value" : ""}${invalid ? " is-invalid" : ""}`}
        role="combobox"
        aria-label="Category"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-required="true"
        aria-invalid={invalid || undefined}
        onClick={() => {
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={value ? "" : "report-category-placeholder"}>{value || "Choose a category"}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          id={listId}
          className="report-category-menu"
          role="listbox"
          aria-label="Category options"
          style={position}
        >
          {CATEGORIES.map((category, index) => (
            <div
              ref={(node) => { optionRefs.current[index] = node; }}
              id={`${listId}-${index}`}
              key={category}
              role="option"
              aria-selected={index === selectedIndex}
              className={`report-category-option${index === activeIndex ? " is-active" : ""}${index === selectedIndex ? " is-selected" : ""}`}
              onPointerMove={() => setActiveIndex(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(category)}
            >
              {category}
              {index === selectedIndex && <CheckCircle2 size={16} aria-hidden="true" />}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </span>
  );
}

export function ReportForm({ type = "lost", edit = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const host = useLoad(hostelApi.getMyHostel, []);
  const imageInput = useRef(null);
  const objectUrls = useRef(new Set());
  const [form, F] = useState({
    itemName: "",
    category: "",
    brand: "",
    color: "",
    description: "",
    location: { area: "", coordinates: null, mode: "", confirmed: false },
    date: new Date().toISOString().slice(0, 10),
    images: [],
  });
  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [step, setStep] = useState(1);
  const [err, E] = useState(""),
    [busy, B] = useState(false);
  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);
  useEffect(() => {
    if (edit && id) {
      (type === "lost" ? lostApi.getLostItem(id) : foundApi.getFoundItem(id))
        .then((r) => {
          const x = r.report || r;
          F((s) => ({
            ...s,
            itemName: x.itemName || "",
            category: x.category || "",
            brand: x.brand || "",
            color: x.color || "",
            description: x.description || "",
            location: {
              area: x.location?.area || "",
              coordinates: Array.isArray(x.location?.coordinates) ? x.location.coordinates : null,
              mode: Array.isArray(x.location?.coordinates) ? "map" : "manual",
              confirmed: Boolean(x.location?.coordinates),
            },
            images: [],
            date: (type === "lost" ? x.lostAt : x.foundAt || "").slice(0, 10),
          }));
          setExistingImages(Array.isArray(x.images) ? x.images : []);
        })
        .catch((x) => E(errorMessage(x)));
    }
  }, [edit, id, type]);
  function selectImages(event) {
    const files = Array.from(event.target.files || []);
    if (event.target) event.target.value = "";
    if (!files.length) return;

    const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
    if (files.some((file) => !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024)) {
      E("Choose JPG, PNG or WEBP images no larger than 5 MB each.");
      return;
    }
    E("");
    const remaining = Math.max(0, 5 - form.images.length);
    if (files.length > remaining) E("You can attach up to five images. The first available images were added.");
    const added = files.slice(0, remaining).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return { key: `${file.name}-${file.lastModified}-${previewUrl}`, file, previewUrl };
    });
    if (added.length) F((current) => ({ ...current, images: [...current.images, ...added] }));
  }
  function removeNewImage(key) {
    const image = form.images.find((candidate) => candidate.key === key);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
      objectUrls.current.delete(image.previewUrl);
    }
    F((current) => ({ ...current, images: current.images.filter((candidate) => candidate.key !== key) }));
  }
  function removeExistingImage(image) {
    const identifier = image.publicId || image.url;
    setExistingImages((current) => current.filter((candidate) => candidate !== image));
    if (identifier) setRemovedImageIds((current) => current.includes(identifier) ? current : [...current, identifier]);
  }
  function validateStep(stepNumber) {
    if (stepNumber === 1) {
      if (!form.itemName.trim()) return "Enter the item name to continue.";
      if (!CATEGORIES.includes(form.category)) return "Choose an item category to continue.";
      if (!form.date) return type === "lost" ? "Choose when you lost the item." : "Choose when you found the item.";
    }
    if (stepNumber === 3) {
      const { area, coordinates, mode, confirmed } = form.location;
      if (!mode || !area.trim()) return "Choose a location method and enter a place or nearby landmark.";
      if (mode === "map" && (!confirmed || !Array.isArray(coordinates) || coordinates.length !== 2 || !Number.isFinite(Number(coordinates[0])) || !Number.isFinite(Number(coordinates[1])) || Math.abs(Number(coordinates[0])) > 180 || Math.abs(Number(coordinates[1])) > 90)) {
        return "Select a valid point on the map and confirm the location.";
      }
    }
    return "";
  }
  function moveToStep(targetStep) {
    if (targetStep > step) {
      for (let current = step; current < targetStep; current += 1) {
        const message = validateStep(current);
        if (message) {
          E(message);
          setStep(current);
          return;
        }
      }
    }
    E("");
    setStep(targetStep);
  }
  function advanceStep() {
    if (step < 4) moveToStep(step + 1);
  }
  async function submit(e) {
    e.preventDefault();
    if (step < 4) {
      advanceStep();
      return;
    }
    const detailsError = validateStep(1);
    if (detailsError) {
      E(detailsError);
      setStep(1);
      return;
    }
    const locationError = validateStep(3);
    if (locationError) {
      E(locationError);
      setStep(3);
      return;
    }
    const { area, coordinates, mode, confirmed } = form.location;
    if (!mode || !area.trim()) {
      E("Choose a location method and enter a place or nearby landmark.");
      return;
    }
    if (mode === "map" && (!confirmed || !Array.isArray(coordinates) || coordinates.length !== 2 || !Number.isFinite(Number(coordinates[0])) || !Number.isFinite(Number(coordinates[1])) || Math.abs(Number(coordinates[0])) > 180 || Math.abs(Number(coordinates[1])) > 90)) {
      E("Select a valid point on the map and confirm the location.");
      return;
    }
    B(true);
    E("");
    try {
      const data = {
        itemName: form.itemName,
        category: form.category,
        brand: form.brand,
        color: form.color,
        description: form.description,
        location: {
          area: area.trim(),
          ...(mode === "map" ? { type: "Point", coordinates: [Number(coordinates[0]), Number(coordinates[1])] } : {}),
        },
        [type === "lost" ? "lostAt" : "foundAt"]: form.date,
        images: form.images.map((image) => image.file),
        ...(edit && removedImageIds.length ? { removeImageIds: removedImageIds } : {}),
      };
      if (edit) {
        if (type === "lost") await lostApi.updateLost(id, data);
        else await foundApi.updateFound(id, data);
      } else if (type === "lost") await lostApi.createLost(data);
      else await foundApi.createFound(data);
      nav("/dashboard", { replace: true });
    } catch (x) {
      E(errorMessage(x));
    } finally {
      B(false);
    }
  }
  const stepDetails = [
    ["Item details", "Basic information"],
    ["Photos", "Add images"],
    ["Location", "Select on map or type"],
    ["Review", "Check and submit"],
  ];
  const reportLabel = type === "lost" ? "lost" : "found";
  return (
    <div className="content report-page">
      <div className="report-workspace">
        <nav className="report-stepper" aria-label="Report progress">
          <ol>
            {stepDetails.map(([title, description], index) => {
              const stepNumber = index + 1;
              const completed = stepNumber < step;
              const active = stepNumber === step;
              return (
                <li key={title} className={`${active ? "active" : ""} ${completed ? "completed" : ""}`}>
                  <button
                    type="button"
                    className="report-stepper-button"
                    aria-current={active ? "step" : undefined}
                    aria-label={`${stepNumber}. ${title}: ${description}${active ? ", current step" : completed ? ", completed" : ", upcoming"}`}
                    onClick={() => moveToStep(stepNumber)}
                  >
                    <span className="report-step-number">{completed ? <CheckCircle2 size={20} aria-hidden="true" /> : stepNumber}</span>
                    <span className="report-step-label"><b>{title}</b><small>{description}</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <form className={`report-form report-main-card report-step-${step}`} onSubmit={submit}>
          <header className="report-form-header">
            <span className="report-form-icon">{step === 2 ? <ImageIcon size={32} aria-hidden="true" /> : <ClipboardCheck size={38} aria-hidden="true" />}</span>
            <div>
              <h1>{step === 1 ? "Item details" : step === 2 ? "Add photos" : step === 3 ? "Add a location" : "Review your report"}</h1>
            <p>{step === 1 ? `Tell us what you ${reportLabel}.` : step === 2 ? "Help others identify your item by adding clear photos." : step === 3 ? "Where should we look for your item?" : "Check the details before submitting."}</p>
            </div>
          </header>

          {err && step !== 2 && <div className="form-alert report-form-alert" role="alert">{err}</div>}

          {step === 1 && (
            <div className="form-grid report-details-grid">
              <label className="wide">
                <span className="report-field-label">Item name <span className="required-mark">*</span></span>
                <input
                  required
                  maxLength="100"
                  value={form.itemName}
                  placeholder="e.g. Blue stainless steel bottle"
                  onChange={(e) => F({ ...form, itemName: e.target.value })}
                  aria-invalid={Boolean(err && !form.itemName.trim())}
                />
              </label>
              <label>
                <span className="report-field-label">Category <span className="required-mark">*</span></span>
                <ReportCategoryDropdown
                  value={form.category}
                  onChange={(category) => F((current) => ({ ...current, category }))}
                  invalid={Boolean(err && !form.category)}
                />
              </label>
              <label>
                <span className="report-field-label">Brand <span className="optional">(optional)</span></span>
                <input value={form.brand} placeholder="e.g. Nike" onChange={(e) => F({ ...form, brand: e.target.value })} />
              </label>
              <label>
                <span className="report-field-label">Color <span className="optional">(optional)</span></span>
                <input value={form.color} placeholder="e.g. Black" onChange={(e) => F({ ...form, color: e.target.value })} />
              </label>
              <label>
                <span className="report-field-label">{type === "lost" ? "When did you lose it?" : "When did you find it?"}</span>
                <input required type="date" value={form.date} onChange={(e) => F({ ...form, date: e.target.value })} aria-invalid={Boolean(err && !form.date)} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="report-step-panel">
              <p className="report-step-intro">Include a few angles to make your item easier to recognise.</p>
              <ReportImagePicker
                inputRef={imageInput}
                existingImages={existingImages}
                newImages={form.images}
                validationError={err}
                onFilesSelected={selectImages}
                onRemoveExisting={removeExistingImage}
                onRemoveNew={removeNewImage}
              />
            </div>
          )}

          {step === 3 && (
            <div className="report-step-panel report-location-step">
              <label className="report-extra-details">
                <span className="report-field-label">More details <span className="optional">(optional)</span></span>
                <textarea
                  rows="3"
                  maxLength="1000"
                  placeholder="Distinctive details that could help identify this item"
                  value={form.description}
                  onChange={(e) => F({ ...form, description: e.target.value })}
                />
              </label>
              <LocationSelector value={form.location} onChange={(location) => F((current) => ({ ...current, location }))} />
            </div>
          )}

          {step === 4 && (
            <div className="report-step-panel report-review">
              <p className="report-step-intro">Review your {reportLabel} item details before sending your report.</p>
              <dl>
                <div><dt>Item name</dt><dd>{form.itemName || "—"}</dd></div>
                <div><dt>Category</dt><dd>{form.category || "—"}</dd></div>
                <div><dt>Brand</dt><dd>{form.brand || "Not provided"}</dd></div>
                <div><dt>Color</dt><dd>{form.color || "Not provided"}</dd></div>
                <div><dt>{type === "lost" ? "Lost date" : "Found date"}</dt><dd>{form.date || "—"}</dd></div>
                <div><dt>Location</dt><dd>{form.location.area || "—"}</dd></div>
                <div><dt>Photos</dt><dd>{existingImages.length + form.images.length} selected</dd></div>
                {form.description && <div className="report-review-wide"><dt>More details</dt><dd>{form.description}</dd></div>}
              </dl>
            </div>
          )}

          <div className={`report-form-actions ${step === 1 ? "first-step" : ""}`}>
            {step > 1 && <button className="button outline report-back-button" type="button" onClick={() => moveToStep(step - 1)}><ChevronLeft size={17} /> Back</button>}
            {step < 4 ? (
              <button className="button primary large report-next-button" type="button" onClick={advanceStep}>
                Next: {stepDetails[step][0]} <ArrowRight size={18} />
              </button>
            ) : (
              <button className="button primary large report-next-button" type="submit" disabled={busy || host.loading}>
                {busy ? "Submitting…" : edit ? "Save changes" : `Submit ${reportLabel} report`} <ArrowRight size={17} />
              </button>
            )}
          </div>
        </form>

        <aside className="report-tips-panel" aria-labelledby="report-tips-title">
          <h2 id="report-tips-title"><span><Lightbulb size={21} aria-hidden="true" /></span>Tips for better matches</h2>
          <ul>
            <li><span><Search size={19} aria-hidden="true" /></span>Be specific</li>
            <li><span><CheckCircle2 size={19} aria-hidden="true" /></span>Mention unique features</li>
            <li><span><ImageIcon size={19} aria-hidden="true" /></span>Add clear photos</li>
            <li><span><MapPin size={19} aria-hidden="true" /></span>Include exact location</li>
          </ul>
          <svg className="report-botanical" viewBox="0 0 300 210" aria-hidden="true">
            <path d="M34 210C72 162 95 116 130 45M104 210c18-62 49-110 77-181M171 210c-1-50 21-98 48-142M232 210c-7-44-2-73 14-112" fill="none" stroke="#647f4b" strokeWidth="3" strokeLinecap="round" />
            <g fill="#8ea66a" stroke="#738d53" strokeWidth="1.4">
              <path d="M95 139C56 136 42 116 40 89c31 2 50 18 55 50ZM117 94C83 81 74 59 79 35c27 9 40 27 38 55ZM158 139c33-11 43-35 36-61-27 9-41 27-41 53ZM186 81c32-15 38-40 28-64-26 12-38 32-33 58ZM214 139c28-15 34-38 22-62-23 14-33 33-27 56ZM78 188c-35-3-53-20-58-45 30 1 50 17 58 45ZM256 183c25-20 27-44 12-66-20 17-27 38-19 60Z" />
            </g>
            <g fill="#b6c48b">
              <ellipse cx="53" cy="128" rx="5" ry="2" transform="rotate(28 53 128)" />
              <ellipse cx="95" cy="70" rx="5" ry="2" transform="rotate(42 95 70)" />
              <ellipse cx="176" cy="110" rx="5" ry="2" transform="rotate(-25 176 110)" />
              <ellipse cx="226" cy="109" rx="5" ry="2" transform="rotate(-36 226 109)" />
            </g>
          </svg>
        </aside>
      </div>
    </div>
  );
}

export function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const type = q.get("type") || "lost";
  const [refresh, setRefresh] = useState(0);
  const data = useLoad(
    () =>
      type === "lost" ? lostApi.getLostItem(id) : foundApi.getFoundItem(id),
    [id, type, refresh],
  );
  const { user } = useAuth();
  const [matches, M] = useState([]),
    [claim, C] = useState(false),
    [evidence, E] = useState(""),
    [msg, S] = useState(""),
    [deleteBusy, setDeleteBusy] = useState(false),
    [deleteError, setDeleteError] = useState("");
  useEffect(() => {
    if (!data.data) return;
    (type === "lost"
      ? matchApi.getMatchesForLost(id)
      : matchApi.getMatchesForFound(id)
    )
      .then(M)
      .catch(() => {});
  }, [data.data, id, type]);
  if (data.loading)
    return (
      <div className="content">
        <Loading />
      </div>
    );
  if (data.error)
    return (
      <div className="content">
        <ErrorState message={data.error} onRetry={data.reload} />
      </div>
    );
  const item = data.data?.report || data.data;
  const canDeleteLostReport =
    type === "lost" &&
    user?.role === "student" &&
    entityId(item.reportedBy) === user?._id &&
    ["ACTIVE", "MATCH_FOUND"].includes(item.status);
  async function deleteLostReport() {
    if (!window.confirm("Delete this lost-item report? This action cannot be undone.")) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await lostApi.deleteLost(id);
      window.alert("Lost-item report deleted successfully.");
      nav("/dashboard", { replace: true });
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  }
  return (
    <div className="content detail-layout">
      <article className="panel detail-main">
        <div className="detail-photo">
          {item.images?.[0]?.url ? (
            <img src={item.images[0].url} alt={item.itemName} />
          ) : (
            <PackageSearch size={42} />
          )}
        </div>
        <div className="detail-body">
          <div className="item-topline">
            <span className={`type-chip ${type}`}>
              {type === "lost" ? "Lost item" : "Found item"}
            </span>
            <Badge value={item.status} />
          </div>
          <h1>{item.itemName}</h1>
          <p className="detail-category">
            {item.category}
            {item.brand && ` · ${item.brand}`}
            {item.color && ` · ${item.color}`}
          </p>
          <div className="detail-facts">
            <span>
              <MapPin size={16} />
              {item.location?.area || "Campus"}
            </span>
            <span>
              <CalendarDays size={16} />
              {fmtDate(type === "lost" ? item.lostAt : item.foundAt)}
            </span>
            <span>
              <Building2 size={16} />
              {item.hostelId?.name || "Hostel community"}
            </span>
          </div>
          {item.description && (
            <section>
              <h3>Item details</h3>
              <p>{item.description}</p>
            </section>
          )}
          {user?.role === "student" && entityId(item.reportedBy) === user?._id && (
            <div className="report-owner-actions">
              <Link
                className="button outline small edit-item"
                to={"/report/" + type + "/" + id + "/edit"}
              >
                Edit report
              </Link>
              {canDeleteLostReport && (
                <button className="button danger small" type="button" disabled={deleteBusy} onClick={deleteLostReport}>
                  <Trash2 size={15} aria-hidden="true" /> {deleteBusy ? "Deleting…" : "Delete report"}
                </button>
              )}
              {deleteError && <p className="form-alert report-delete-error" role="alert">{deleteError}</p>}
            </div>
          )}
        </div>
      </article>
      <aside className="detail-side">
        <div className="panel side-panel">
          <div className="eyebrow">NEXT STEP</div>
          <h3>
            {type === "found"
              ? "Think this could be yours?"
              : "See a familiar item?"}
          </h3>
          <p>
            {type === "found"
              ? "Share details only the owner would know. The Rector will verify the claim."
              : "Possible matches are suggestions only. Ownership is verified by the Rector."}
          </p>
          {type === "found" && user?.role === "student" && (
            <button className="button primary full" onClick={() => C(!claim)}>
              Make a claim <ArrowRight size={16} />
            </button>
          )}
          {claim && (
            <form
              className="form-stack claim-form"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await claimApi.createClaim({ foundReportId: id, evidence });
                  S("Claim submitted for Rector review.");
                  C(false);
                } catch (x) {
                  S(errorMessage(x));
                }
              }}
            >
              <label>
                Ownership evidence
                <textarea
                  required
                  rows="4"
                  value={evidence}
                  onChange={(e) => E(e.target.value)}
                  placeholder="Describe a detail that only the owner would know"
                />
              </label>
              <button className="button primary">Submit claim</button>
            </form>
          )}
          {msg && <p className="success-inline">{msg}</p>}
        </div>
        {matches.length > 0 && (
          <div className="panel side-panel">
            <div className="eyebrow">SUGGESTED</div>
            <h3>Possible matches</h3>
            <p className="small-note">
              A possible match is an automated suggestion based on item details,
              location and timeframe. It does not prove ownership. Ownership is
              verified by the Rector.
            </p>
            {matches.map((m, i) => (
              <Link
                className="match-row"
                to={`/items/${m.foundReportId?._id || m.lostReportId?._id || m._id}?type=${m.foundReportId ? "found" : "lost"}`}
                key={m._id || i}
              >
                <span>
                  <b>
                    {m.foundReportId?.itemName ||
                      m.lostReportId?.itemName ||
                      m.itemName ||
                      "Related report"}
                  </b>
                  <small>
                    {m.foundReportId?.location?.area ||
                      m.lostReportId?.location?.area ||
                      "View related report"}
                  </small>
                </span>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
        {user?.role === "rector" && (
          <ModerationControl
            type={type}
            id={id}
            onDone={() => setRefresh((n) => n + 1)}
          />
        )}
      </aside>
    </div>
  );
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [showAllReports, setShowAllReports] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const lost = useLoad(() => lostApi.getLost({ page: 1, limit: 100 }), []),
    found = useLoad(() => foundApi.getFound({ page: 1, limit: 100 }), []),
    claims = useLoad(claimApi.getMyClaims, []);
  const own = (r) => entityId(r.reportedBy) === user?._id;
  const mineLost = useMemo(() => listOf(lost.data).filter(own), [lost.data, user?._id]),
    mineFound = useMemo(() => listOf(found.data).filter(own), [found.data, user?._id]),
    campusFound = useMemo(() => listOf(found.data), [found.data]);
  const claimList = Array.isArray(claims.data) ? claims.data : [];
  const matchedLostIds = mineLost
    .filter((item) => item.status === "MATCH_FOUND")
    .map((item) => item._id);
  const matchedLostKey = matchedLostIds.join(",");
  const matchState = useLoad(
    async () => {
      const reports = mineLost.filter((item) => item.status === "MATCH_FOUND");
      const groups = await Promise.all(
        reports.map(async (report) => ({
          report,
          matches: await matchApi.getMatchesForLost(report._id),
        })),
      );
      return groups
        .flatMap(({ report, matches }) =>
          (Array.isArray(matches) ? matches : []).map((match) => ({ report, match })),
        )
        .filter(({ match }) => match.foundReportId)
        .sort((a, b) => (b.match.matchScore || 0) - (a.match.matchScore || 0));
    },
    [matchedLostKey],
  );
  const latestClaim = [...claimList].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )[0];
  const possibleMatches = Array.isArray(matchState.data) ? matchState.data : [];
  const recentlyFound = campusFound
    .filter((item) => !["RETURNED", "CLOSED"].includes(item.status))
    .slice(0, 3);
  const activeReports = [
    ...mineLost
      .filter((item) => !["RECOVERED", "CLOSED"].includes(item.status))
      .map((item) => ({ item, type: "lost" })),
    ...mineFound
      .filter((item) => !["RETURNED", "CLOSED"].includes(item.status))
      .map((item) => ({ item, type: "found" })),
  ].sort(
    (a, b) =>
      new Date(b.item.createdAt || b.item.lostAt || b.item.foundAt || 0) -
      new Date(a.item.createdAt || a.item.lostAt || a.item.foundAt || 0),
  );
  const activeClaimCount = claimList.filter((claim) =>
    ["SUBMITTED", "UNDER_VERIFICATION", "APPROVED"].includes(claim.status),
  ).length;
  const recoveredCount =
    mineLost.filter((item) => item.status === "RECOVERED").length +
    claimList.filter((claim) => claim.studentConfirmedAt != null).length;
  const activity = buildStudentActivity(mineLost, mineFound, claimList).slice(0, 5);
  async function withdraw(id) {
    try {
      await claimApi.withdrawClaim(id);
      claims.reload();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  async function confirm(id) {
    try {
      await recApi.confirmRecovery(id);
      claims.reload();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  const trackerSteps = [
    {
      title: "Report submitted",
      description: "We’ve received your report.",
      count: lost.loading || found.loading ? "…" : mineLost.length + mineFound.length,
      active: mineLost.length + mineFound.length > 0,
      icon: ClipboardCheck,
      href: "/report/lost",
    },
    {
      title: "Looking for matches",
      description: "We’ll notify you if we find a match.",
      count: matchState.loading ? "…" : possibleMatches.length,
      active: possibleMatches.length > 0,
      icon: Search,
      href: "/browse",
    },
    {
      title: "Claim in progress",
      description: "Track your claims here.",
      count: claims.loading ? "…" : activeClaimCount,
      active: activeClaimCount > 0,
      icon: HeartHandshake,
      href: "/claims",
    },
    {
      title: "Item recovered",
      description: "We’ll update you once it’s returned.",
      count: lost.loading || claims.loading ? "…" : recoveredCount,
      active: recoveredCount > 0,
      icon: CheckCircle2,
      href: "/claims",
    },
  ];

  return (
    <div className="content student-dashboard recovery-dashboard">
      <div className="recovery-overview-panel">
        <section className="recovery-journey-hero" aria-labelledby="recovery-journey-title">
          <div className="recovery-hero-copy">
            {/* <div className="eyebrow">YOUR CAMPUS, YOUR COMMUNITY</div> */}
            <h1 id="recovery-journey-title">Your recovery journey</h1>
            <p>We’ll keep you updated at every step.</p>
            <Link className="button primary recovery-hero-action" to="/report/lost">
              <Plus size={16} /> Report lost item <ArrowRight size={9} />
            </Link>
          </div>
        </section>

        {/* <section className="recovery-journey-tracker" aria-label="Recovery journey overview">
          <ol className="recovery-tracker-steps">
            {trackerSteps.map(({ title, description, count, active, icon: Icon, href }, index) => (
              <li className={active ? "is-active" : ""} key={title}>
                <Link to={href} className="recovery-step-link" aria-label={`${title}: ${count}`}>
                  <span className="recovery-step-icon"><Icon size={16} aria-hidden="true" /></span>
                  <span className="recovery-step-copy">
                    <b>{title}</b>
                    <small>{description}</small>
                    <em>{count} {index === 0 ? "reports" : index === 1 ? "matches" : index === 2 ? "claims" : "recovered"}</em>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section> */}
      </div>

      <div className="recovery-dashboard-grid">
        <section className="recovery-dashboard-card possible-matches-card">
          <div className="section-title recovery-card-heading">
            <div>
              <div className="eyebrow">POSSIBLE MATCHES</div>
              <h2>We’re looking for your item</h2>
            </div>
            <Link className="text-button" to="/browse">View all <ArrowRight size={14} /></Link>
          </div>
          {matchState.loading || lost.loading ? (
            <Loading />
          ) : matchState.error ? (
            <ErrorState message={matchState.error} onRetry={matchState.reload} />
          ) : possibleMatches.length ? (
            <div className="mini-list recovery-match-list">
              {possibleMatches.slice(0, showAllMatches ? possibleMatches.length : 3).map((result) => (
                <PossibleMatchCard key={result.match._id} result={result} />
              ))}
              {possibleMatches.length > 3 && (
                <button className="text-button recovery-list-toggle" type="button" onClick={() => setShowAllMatches((show) => !show)}>
                  {showAllMatches ? "Show fewer" : `View ${possibleMatches.length - 3} more matches`} <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="recovery-empty-state">
              <span className="recovery-empty-icon"><Search size={23} aria-hidden="true" /></span>
              <b>No possible matches yet</b>
              <p>We’ll notify you when we find a match.</p>
              <Link className="button primary small" to="/browse">Browse found items <ArrowRight size={14} /></Link>
            </div>
          )}
        </section>

        <section className="recovery-dashboard-card active-reports-card">
          <div className="section-title recovery-card-heading">
            <div>
              <div className="eyebrow">YOUR REPORTS</div>
              <h2>My active reports</h2>
            </div>
            {activeReports.length > 3 && (
              <button className="text-button" type="button" onClick={() => setShowAllReports((show) => !show)}>
                {showAllReports ? "Show less" : "View all"} <ArrowRight size={14} />
              </button>
            )}
          </div>
          {lost.loading || found.loading ? (
            <Loading />
          ) : lost.error || found.error ? (
            <ErrorState message={lost.error || found.error} onRetry={() => { lost.reload(); found.reload(); }} />
          ) : activeReports.length ? (
            <div className="mini-list">
              {activeReports.slice(0, showAllReports ? activeReports.length : 4).map(({ item, type }) => (
                <DashboardItem key={`${type}-${item._id}`} item={item} type={type} />
              ))}
              <Link className="text-button recovery-claims-link" to="/claims">View my claims <ArrowRight size={14} /></Link>
            </div>
          ) : (
            <div className="recovery-empty-state">
              <span className="recovery-empty-icon"><ClipboardCheck size={23} aria-hidden="true" /></span>
              <b>You don’t have any active reports yet.</b>
              <p>Report a lost item to start your journey.</p>
              <Link className="button primary small" to="/report/lost">Report an item <ArrowRight size={14} /></Link>
            </div>
          )}
          {!claims.loading && latestClaim && (
            <div className="recovery-dashboard-claim">
              <RecoveryTimeline claim={latestClaim} onWithdraw={withdraw} onConfirm={confirm} />
            </div>
          )}
          {!claims.loading && claims.error && <ErrorState message={claims.error} onRetry={claims.reload} />}
        </section>
      </div>

      <section className="student-contribution recovery-contribution">
        <span className="contribution-icon"><Heart size={19} aria-hidden="true" /></span>
        <div>
          <b>Your contribution matters</b>
          <p>Found something on campus? Help get it back to its owner.</p>
          {mineFound.some((item) => ["RETURNED", "CLOSED"].includes(item.status)) && (
            <small>{mineFound.filter((item) => ["RETURNED", "CLOSED"].includes(item.status)).length} items helped on their way home</small>
          )}
        </div>
        <Link className="button primary small" to="/report/found">Report a found item <ArrowRight size={14} /></Link>
      </section>

      {/* <div className="recovery-dashboard-secondary">
        <section className="recovery-dashboard-card">
          <div className="section-title recovery-card-heading">
            <div><div className="eyebrow">ON CAMPUS</div><h2>Recently found</h2></div>
            <Link className="text-button" to="/browse">Browse all <ArrowRight size={14} /></Link>
          </div>
          {found.loading ? <Loading /> : found.error ? <ErrorState message={found.error} onRetry={found.reload} /> : recentlyFound.length ? (
            <div className="mini-list">{recentlyFound.map((item) => <DashboardItem key={item._id} item={item} type="found" />)}</div>
          ) : <CompactEmpty title="No recent found items" description="New reports from your campus will show up here." to="/browse" action="Browse found items" />}
        </section>
        <section className="student-activity recovery-dashboard-card">
          <div className="eyebrow">RECENT ACTIVITY</div>
          <h2>Your campus updates</h2>
          {activity.length ? (
            <ol className="activity-list">
              {activity.map((event) => (
                <li key={event.id}>
                  <span className={`activity-mark ${event.kind}`}>
                    {event.kind === "match" ? <Search size={13} /> : event.kind === "recovered" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                  </span>
                  <div><b>{event.title}</b><p>{event.detail}</p><small>{fmtDate(event.date)}</small></div>
                </li>
              ))}
            </ol>
          ) : <div className="activity-empty">Your report and claim updates will appear here.</div>}
        </section>
      </div> */}
    </div>
  );
}
function buildStudentActivity(lost, found, claims) {
  const events = [];
  lost.forEach((item) => events.push({
    id: `lost-${item._id}`, date: item.createdAt || item.lostAt,
    kind: item.status === "MATCH_FOUND" ? "match" : "report",
    title: item.status === "MATCH_FOUND" ? "Possible match found" : "Lost report submitted",
    detail: item.itemName,
  }));
  found.forEach((item) => events.push({
    id: `found-${item._id}`, date: item.createdAt || item.foundAt, kind: "report",
    title: "Found report submitted", detail: item.itemName,
  }));
  claims.forEach((claim) => {
    const name = claim.foundReportId?.itemName || claim.lostReportId?.itemName || "your item";
    events.push({ id: `claim-${claim._id}`, date: claim.createdAt, kind: "claim", title: "Claim submitted", detail: name });
    if (claim.infoRequestedReason) events.push({ id: `info-${claim._id}`, date: claim.updatedAt, kind: "claim", title: "Rector requested more information", detail: claim.infoRequestedReason });
    else if (claim.reviewedAt) events.push({
      id: `review-${claim._id}`, date: claim.reviewedAt, kind: "claim",
      title: claim.status === "APPROVED" ? "Claim approved" : claim.status === "REJECTED" ? "Claim declined" : "Claim reviewed",
      detail: name,
    });
    if (claim.studentConfirmedAt) events.push({ id: `recovered-${claim._id}`, date: claim.studentConfirmedAt, kind: "recovered", title: "Item recovered", detail: name });
  });
  return events
    .filter((event) => event.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function PossibleMatchCard({ result }) {
  const foundItem = result.match.foundReportId;
  const image = imageUrl(foundItem);
  return (
    <Link className="possible-match-card" to={`/items/${foundItem._id}?type=found`}>
      <span className={`dashboard-thumb ${image ? "has-image" : ""}`}>
        {image ? <img src={image} alt="" loading="lazy" /> : <PackageSearch size={19} />}
      </span>
      <span className="possible-match-copy">
        <small>Your report: {result.report.itemName}</small>
        <b>{foundItem.itemName || "Found item"}</b>
        <span>{foundItem.location?.area || "Campus"} · {fmtDate(foundItem.foundAt)}</span>
      </span>
      <span className="match-score">{result.match.matchScore}%<small>match</small></span>
      <ArrowRight size={17} />
    </Link>
  );
}

function DashboardItem({ item, type }) {
  const image = imageUrl(item);
  const matchFound = type === "lost" && item.status === "MATCH_FOUND";
  return (
    <Link
      className="mini-item dashboard-item"
      to={`/items/${item._id}?type=${type}`}
    >
      <span className={`dashboard-thumb ${image ? "has-image" : ""}`}>
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <ImageIcon size={18} />
        )}
      </span>
      <span className="mini-title">
        <b>{item.itemName}</b>
        <small>
          {item.category || "Other"} · {item.location?.area || "Campus"} ·{" "}
          {fmtDate(type === "lost" ? item.lostAt : item.foundAt)}
        </small>
        {matchFound && (
          <span className="possible-match">
            <CheckCircle2 size={12} /> Possible match
          </span>
        )}
      </span>
      <Badge value={item.status} />
      <ArrowRight size={16} />
    </Link>
  );
}

function CompactEmpty({ title, description, to, action }) {
  return (
    <div className="dashboard-empty">
      <div>
        <b>{title}</b>
        <p>{description}</p>
      </div>
      <Link className="text-button" to={to}>
        {action} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function RecoveryTimeline({ claim, onWithdraw, onConfirm }) {
  const itemRecovered =
    claim.studentConfirmedAt != null ||
    claim.foundReportId?.status === "RETURNED" ||
    claim.lostReportId?.status === "RECOVERED";
  const rejected = claim.status === "REJECTED";
  const currentStep = itemRecovered
    ? 4
    : claim.status === "APPROVED"
      ? 3
      : claim.status === "UNDER_VERIFICATION"
        ? 2
        : 1;
  const steps = [
    "Match identified",
    "Claim submitted",
    "Rector review",
    "Item handover",
    "Recovered",
  ];
  return (
    <section className="recovery-timeline" aria-label="Most recent recovery progress">
      <div className="recovery-head">
        <div>
          <div className="eyebrow">LATEST CLAIM</div>
          <h3>Claim timeline</h3>
        </div>
        <HeartHandshake size={18} />
      </div>
      {rejected ? (
        <p className="recovery-note">
          This claim was declined. Your report remains available for other
          matches.
        </p>
      ) : (
        <>
          <ol>
            {steps.map((step, index) => {
              const done = itemRecovered || index < currentStep;
              const current = !itemRecovered && index === currentStep;
              return (
                <li
                  key={step}
                  className={done ? "done" : current ? "current" : "pending"}
                >
                  <span>
                    {done ? (
                      <CompleteIcon size={14} />
                    ) : current ? (
                      <ProgressIcon size={14} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <b>{step}</b>
                </li>
              );
            })}
          </ol>
          <p className="recovery-note">
            The Rector verifies ownership. After approval, confirm receipt once
            the item is handed over.
          </p>
          <div className="recovery-actions">
            {claim.infoRequestedReason && <p className="recovery-note">Rector requested: {claim.infoRequestedReason}</p>}
            {claim.status === "APPROVED" && claim.studentConfirmedAt == null && (
              <button className="button primary small" onClick={() => onConfirm(claim._id)}>Confirm I received it</button>
            )}
            {["SUBMITTED", "UNDER_VERIFICATION"].includes(claim.status) && (
              <button className="text-button danger-text" onClick={() => onWithdraw(claim._id)}>Withdraw claim</button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function Claims() {
  const data = useLoad(claimApi.getMyClaims, []);
  const [busy, B] = useState(false);
  async function act(fn, id) {
    B(true);
    try {
      await fn(id);
      data.reload();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      B(false);
    }
  }
  return (
    <div className="content">
      <PageHead
        eyebrow="OWNERSHIP & RECOVERY"
        title="My claims"
        description="Follow each claim as it moves through Rector verification and handover."
      />
      <div className="workflow-strip">
        {[
          ["01", "Submitted"],
          ["02", "Verification"],
          ["03", "Approved"],
          ["04", "Handover"],
          ["05", "Your confirmation"],
          ["06", "Rector completion"],
        ].map(([n, t]) => (
          <span key={n}>
            <i>{n}</i>
            {t}
          </span>
        ))}
      </div>
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={data.reload} />
      ) : data.data?.length ? (
        <div className="claim-list">
          {data.data.map((c) => (
            <ClaimCard
              key={c._id}
              claim={c}
              onWithdraw={(id) => act(claimApi.withdrawClaim, id)}
              onConfirm={(id) => act(recApi.confirmRecovery, id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No claims yet"
          action={
            <Link className="button primary" to="/browse">
              Browse found items
            </Link>
          }
        >
          When you recognise a found item, you can make an ownership claim.
        </EmptyState>
      )}
    </div>
  );
}

export function RectorDashboard() {
  const user = useAuth().user;
  const found = useLoad(() => foundApi.getFound({ page: 1, limit: 100 }), []),
    analytic = useLoad(analyticsApi.getRectorAnalytics, []),
    users = useLoad(userApi.getUsers, []);
  const rows = found.data?.data?.data || [];
  const pending = rows.filter((i) =>
    ["REPORTED", "AWAITING_HANDOVER"].includes(i.status),
  );
  async function receive(id) {
    try {
      await foundApi.receiveFound(id);
      found.reload();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  async function account(id, active) {
    try {
      await userApi.updateUserStatus(id, active);
      users.reload();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  return (
    <div className="content">
      <PageHead
        eyebrow="RECTOR WORKSPACE"
        title="What needs your attention?"
        description={`Your assigned hostel${user?.hostelId?.name ? `: ${user.hostelId.name}` : ""}. Review found items, oversee recovery and support students.`}
      >
        <Link className="button outline" to="/analytics">
          <TrendingUp size={17} />
          Hostel analytics
        </Link>
      </PageHead>
      <div className="summary-grid">
        <Stat
          icon={ClipboardCheck}
          label="Claims awaiting review"
          value={analytic.data?.summary?.pendingClaims ?? "—"}
        />
        <Stat
          icon={PackageSearch}
          label="Found items awaiting custody"
          value={pending.length}
        />
        <Stat
          icon={Building2}
          label="Items with Rector"
          value={rows.filter((i) => i.status === "WITH_RECTOR").length}
        />
        <Stat
          icon={TrendingUp}
          label="Recovery rate"
          value={
            analytic.data?.summary?.recoveryRate != null
              ? `${analytic.data.summary.recoveryRate}%`
              : "—"
          }
        />
      </div>
      <div className="notice-banner">
        <AlertCircle size={19} />
        <p>
          <b>Claim queue access unavailable.</b> The backend provides individual
          claim review actions but no Rector endpoint to list claims needing
          review. Claims requiring verification cannot be loaded in this
          dashboard.
        </p>
      </div>
      <section className="panel rector-panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">CUSTODY QUEUE</div>
            <h2>Found items awaiting handover</h2>
          </div>
          <span className="counter-pill">{pending.length} items</span>
        </div>
        {found.loading ? (
          <Loading />
        ) : found.error ? (
          <ErrorState message={found.error} onRetry={found.reload} />
        ) : pending.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Location</th>
                  <th>Reported</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((i) => (
                  <tr key={i._id}>
                    <td>
                      <b>{i.itemName}</b>
                      <small>{i.category}</small>
                    </td>
                    <td>{i.location?.area || "—"}</td>
                    <td>{fmtDate(i.foundAt)}</td>
                    <td>
                      <Badge value={i.status} />
                    </td>
                    <td>
                      <button
                        className="button outline small"
                        onClick={() => receive(i._id)}
                      >
                        Confirm receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No items awaiting handover" />
        )}
      </section>
      <div className="dashboard-columns rector-columns">
        <section className="panel rector-panel">
          <div className="eyebrow">ASSIGNED HOSTEL</div>
          <h2>Recent found reports</h2>
          {found.loading ? (
            <Loading />
          ) : (
            <div className="mini-list">
              {rows.slice(0, 6).map((i) => (
                <MiniItem key={i._id} item={i} type="found" />
              ))}
            </div>
          )}
        </section>
        <section className="panel rector-panel">
          <div className="section-title">
            <div>
              <div className="eyebrow">STUDENT SUPPORT</div>
              <h2>Student accounts</h2>
            </div>
          </div>
          {users.loading ? (
            <Loading />
          ) : users.error ? (
            <ErrorState message={users.error} onRetry={users.reload} />
          ) : users.data?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Hostel</th>
                    <th>Account</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.slice(0, 8).map((u) => (
                    <tr key={u._id}>
                      <td>
                        <b>{u.name}</b>
                        <small>{u.studentId}</small>
                      </td>
                      <td>{u.hostelId?.name || "—"}</td>
                      <td>
                        <span
                          className={u.isActive ? "account-on" : "account-off"}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => account(u._id, !u.isActive)}
                        >
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No students found" />
          )}
        </section>
      </div>
    </div>
  );
}

export function Analytics() {
  const { user } = useAuth();
  const rector = user?.role === "rector";
  const data = useLoad(
    rector ? analyticsApi.getRectorAnalytics : analyticsApi.getStudentAnalytics,
    [rector],
  );
  const d = data.data;
  if (data.loading)
    return (
      <div className="content">
        <Loading label="Loading campus analytics…" />
      </div>
    );
  if (data.error)
    return (
      <div className="content">
        <ErrorState message={data.error} onRetry={data.reload} />
      </div>
    );
  const summary = d?.summary || {};
  const categories = rector
    ? { found: d?.categoryBreakdown || [] }
    : d?.categoryBreakdown || { lost: [], found: [] };
  const locations = rector
    ? { found: d?.locationBreakdown || [] }
    : d?.locationBreakdown || { lost: [], found: [] };
  return (
    <div className="content">
      <PageHead
        eyebrow={rector ? "YOUR HOSTEL" : "CAMPUS SNAPSHOT"}
        title={rector ? "Hostel analytics" : "Campus analytics"}
        description={
          rector
            ? "Activity and recovery across your assigned hostel."
            : "A live picture of lost and found activity across campus."
        }
      />
      <div className="summary-grid">
        <Stat
          icon={Search}
          label="Items reported lost"
          value={summary.totalLost ?? "—"}
        />
        <Stat
          icon={PackageSearch}
          label="Items reported found"
          value={summary.totalFound ?? "—"}
        />
        <Stat
          icon={CheckCircle2}
          label="Items recovered"
          value={summary.totalRecovered ?? "—"}
        />
        <Stat
          icon={TrendingUp}
          label="Recovery rate"
          value={
            summary.recoveryRate != null ? `${summary.recoveryRate}%` : "—"
          }
        />
      </div>
      {rector && (
        <section className="analytics-attention" aria-live="polite">
          <div className="analytics-attention-mark">
            <ClipboardCheck size={19} />
          </div>
          <div>
            <b>
              {summary.pendingClaims ?? "—"} claims awaiting verification
            </b>
            <p>
              {typeof summary.pendingClaims !== "number"
                ? "Claim review totals are unavailable in this response."
                : summary.pendingClaims
                ? "Claims in your hostel need review."
                : "No claims are awaiting verification in the current analytics response."}
            </p>
          </div>
          <span>{summary.unresolved ?? "—"} unresolved reports</span>
        </section>
      )}
      <div className="analytics-grid">
        <section className="panel chart-panel">
          <div className="eyebrow">REPORT VOLUME</div>
          <h2>Lost vs found</h2>
          <CountComparison lost={summary.totalLost} found={summary.totalFound} />
        </section>
        <section className="panel chart-panel recovery-panel">
          <div className="eyebrow">RECOVERY OVERVIEW</div>
          <h2>Recovery rate</h2>
          <RecoveryRate summary={summary} />
        </section>
        <section className="panel chart-panel wide-chart">
          <div className="eyebrow">ITEM MIX</div>
          <h2>{rector ? "Found item categories" : "Lost and found by category"}</h2>
          <BreakdownChart
            groups={categories}
            singleSeries={rector}
            emptyLabel="Not enough activity yet"
            emptyDescription="Category distribution will appear as items are reported."
          />
        </section>
        <section className="panel chart-panel">
          <div className="eyebrow">{rector ? "HOSTEL AREAS" : "CAMPUS AREAS"}</div>
          <h2>{rector ? "Found items by area" : "Reports by area"}</h2>
          <BreakdownChart
            groups={locations}
            singleSeries={rector}
            emptyLabel="Not enough activity yet"
            emptyDescription="Area comparisons will appear as reports include a location."
          />
        </section>
        <section className="panel chart-panel">
          <div className="eyebrow">RECENT MONTHLY ACTIVITY</div>
          <h2>Lost and found trend</h2>
          <MonthlyTrend data={d?.monthlyTrends} />
        </section>
        <section className="panel chart-panel wide-chart">
          <div className="eyebrow">RECOVERY PATH</div>
          <h2>Reported and recovered</h2>
          <RecoveryPath summary={summary} rector={rector} />
        </section>
        {rector ? (
          <>
            <section className="panel chart-panel">
              <div className="eyebrow">HOSTEL ACTIVITY</div>
              <h2>Recent reports</h2>
              <RecentReports activity={d?.recentActivity} />
            </section>
            <section className="analytics-limitations" aria-label="Analytics data availability">
              <b>More workflow detail isn’t in this response yet</b>
              <p>
                Full status distribution, returned and unclaimed item totals,
                and turnaround times aren’t provided by the current analytics API.
              </p>
            </section>
          </>
        ) : (
          <section className="analytics-limitations" aria-label="Analytics data availability">
            <b>Some recovery stages aren’t available here</b>
            <p>
              Match, claim and approval stage totals aren’t provided by the
              student analytics API, so they aren’t estimated in this view.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function CountComparison({ lost, found }) {
  if (typeof lost !== "number" || typeof found !== "number") {
    return (
      <AnalyticsEmpty
        title="Report totals unavailable"
        description="The analytics response doesn’t include both report totals."
      />
    );
  }
  const rows = [
      { key: "lost", label: "Lost", value: lost },
      { key: "found", label: "Found", value: found },
    ],
    max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.some((row) => row.value > 0)) {
    return (
      <AnalyticsEmpty
        title="Not enough activity yet"
        description="Lost and found comparisons will appear as reports are submitted."
      />
    );
  }
  return (
    <div className="analytics-comparison" role="img" aria-label={`Lost reports: ${lost || 0}; found reports: ${found || 0}`}>
      {rows.map((row) => (
        <div className="analytics-comparison-row" key={row.key}>
          <div className="analytics-row-label">
            <span className={`analytics-dot ${row.key}`} />
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
          <div className="analytics-track">
            <i
              className={row.key}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecoveryRate({ summary }) {
  const rate = summary.recoveryRate;
  if (typeof rate !== "number" || summary.totalLost === 0) {
    return (
      <AnalyticsEmpty
        title={summary.totalLost === 0 ? "Not enough activity yet" : "Recovery rate unavailable"}
        description={
          summary.totalLost === 0
            ? "A recovery rate needs at least one lost report."
            : "The analytics response doesn’t include a recovery rate."
        }
      />
    );
  }
  const safeRate = Math.max(0, Math.min(100, rate));
  return (
    <div className="analytics-rate-content">
      <div
        className="rate-ring"
        role="img"
        aria-label={`Recovery rate ${rate}%`}
        style={{ "--rate": `${safeRate}%` }}
      >
        <div>
          <b>{rate}%</b>
          <small>recovery rate</small>
        </div>
      </div>
      <p className="small-note">
        Based on recovered lost reports, using the backend’s analytics definition.
      </p>
    </div>
  );
}

function BreakdownChart({ groups, singleSeries, emptyLabel, emptyDescription }) {
  const series = singleSeries
    ? [{ key: "found", label: "Found", rows: groups?.found || [] }]
    : [
        { key: "lost", label: "Lost", rows: groups?.lost || [] },
        { key: "found", label: "Found", rows: groups?.found || [] },
      ];
  const combined = new Map();
  series.forEach(({ key, rows }) => {
    rows.forEach(({ _id, count }) => {
      const label = _id || "Unspecified";
      const row = combined.get(label) || { label, lost: 0, found: 0 };
      row[key] = count;
      combined.set(label, row);
    });
  });
  const rows = [...combined.values()].sort(
    (a, b) => b.lost + b.found - (a.lost + a.found),
  );
  const max = Math.max(1, ...rows.flatMap((row) => [row.lost, row.found]));
  if (!rows.length) {
    return <AnalyticsEmpty title={emptyLabel} description={emptyDescription} />;
  }
  return (
    <div className="analytics-breakdown" aria-label="Breakdown counts">
      {!singleSeries && (
        <div className="analytics-legend">
          <span><i className="lost" /> Lost</span>
          <span><i className="found" /> Found</span>
        </div>
      )}
      {rows.map((row) => (
        <div className="analytics-breakdown-row" key={row.label}>
          <b className="analytics-breakdown-label" title={row.label}>{row.label}</b>
          <div className="analytics-breakdown-bars">
            {series.map(({ key }) => (
              <div className="analytics-track" key={key}>
                <i
                  className={key}
                  style={{ width: `${(row[key] / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <span className="analytics-breakdown-counts">
            {series.map(({ key }) => (
              <b key={key} aria-label={`${key}: ${row[key]}`}>
                {row[key]}
              </b>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function MonthlyTrend({ data }) {
  const months = new Map();
  ["lost", "found"].forEach((series) => {
    (data?.[series] || []).forEach((entry) => {
      const year = entry._id?.year;
      const month = entry._id?.month;
      if (!year || !month) return;
      const key = `${year}-${month}`;
      const point = months.get(key) || { year, month, lost: 0, found: 0 };
      point[series] = entry.count;
      months.set(key, point);
    });
  });
  const points = [...months.values()].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
  const max = Math.max(1, ...points.flatMap((point) => [point.lost, point.found]));
  if (!points.length) {
    return (
      <AnalyticsEmpty
        title="Not enough activity yet"
        description="Monthly trends will appear as reports are submitted."
      />
    );
  }
  return (
    <div className="analytics-trend-wrap">
      <div className="analytics-legend">
        <span><i className="lost" /> Lost</span>
        <span><i className="found" /> Found</span>
      </div>
      <div className="trend-chart" role="img" aria-label="Monthly lost and found report counts">
        {points.map((point) => (
          <div className="trend-col" key={`${point.year}-${point.month}`}>
            <div className="trend-bars">
              {[
                ["lost", point.lost],
                ["found", point.found],
              ].map(([key, value]) => (
                <i
                  key={key}
                  className={key}
                  title={`${key}: ${value}`}
                  style={{ height: `${(value / max) * 100}%` }}
                />
              ))}
            </div>
            <small>
              {new Date(point.year, point.month - 1).toLocaleDateString(undefined, {
                month: "short",
                year: "2-digit",
              })}
            </small>
          </div>
        ))}
      </div>
      <div className="analytics-trend-values">
        {points.map((point) => (
          <span key={`${point.year}-${point.month}`}>
            {point.lost} lost · {point.found} found
          </span>
        ))}
      </div>
    </div>
  );
}

function RecoveryPath({ summary, rector }) {
  const totalLost = summary.totalLost;
  const recovered = summary.totalRecovered;
  if (typeof totalLost !== "number" || typeof recovered !== "number") {
    return (
      <AnalyticsEmpty
        title="Recovery stages unavailable"
        description="The analytics response doesn’t include both reported and recovered totals."
      />
    );
  }
  if (totalLost === 0) {
    return (
      <AnalyticsEmpty
        title="Not enough activity yet"
        description="Recovery stages will appear as lost items are reported."
      />
    );
  }
  return (
    <div className="analytics-path">
      {[
        { label: "Reported lost", value: totalLost },
        { label: "Recovered", value: recovered, recovered: true },
      ].map((step) => (
        <div className="analytics-path-row" key={step.label}>
          <span>{step.label}</span>
          <div className="analytics-track">
            <i
              className={step.recovered ? "success" : "lost"}
              style={{ width: `${Math.min(100, (step.value / totalLost) * 100)}%` }}
            />
          </div>
          <b>{step.value}</b>
        </div>
      ))}
      <p className="small-note">
        {rector
          ? "Match and approval totals, and full claim-stage counts, aren’t included. Pending claim review is summarized above."
          : "Match, claim and approval stage counts aren’t included in this API response."}
      </p>
    </div>
  );
}

function RecentReports({ activity }) {
  const reports = [
    ...(activity?.lost || []).map((report) => ({ ...report, type: "Lost" })),
    ...(activity?.found || []).map((report) => ({ ...report, type: "Found" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!reports.length) {
    return (
      <AnalyticsEmpty
        title="Not enough activity yet"
        description="Recent hostel reports will appear here."
      />
    );
  }
  return (
    <ul className="analytics-recent-list">
      {reports.slice(0, 8).map((report) => (
        <li key={`${report.type}-${report._id}`}>
          <span className={`analytics-dot ${report.type.toLowerCase()}`} />
          <span className="analytics-recent-main">
            <b>{report.itemName}</b>
            <small>{report.type} · {report.status?.replaceAll("_", " ")}</small>
          </span>
          <time>{fmtDate(report.createdAt)}</time>
        </li>
      ))}
    </ul>
  );
}

function AnalyticsEmpty({ title, description }) {
  return (
    <div className="analytics-empty">
      <b>{title}</b>
      <p>{description}</p>
    </div>
  );
}

export function Notifications() {
  const d = useLoad(() => notifApi.getNotifications({ limit: 1000 }), []);
  const nav = useNavigate();
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const notifications = d.data?.notifications || [];
  const unreadCount = d.data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;
  const categories = [
    { id: "matches", label: "Item matches", icon: Search, types: ["MATCH_FOUND"] },
    { id: "claims", label: "Claim updates", icon: ClipboardCheck, types: ["CLAIM_SUBMITTED", "CLAIM_APPROVED", "CLAIM_REJECTED", "MORE_INFO_REQUIRED"] },
    { id: "handovers", label: "Handover updates", icon: PackageCheck, types: ["ITEM_RECEIVED", "RECOVERY_CONFIRMED"] },
    { id: "reports", label: "New reports", icon: Bell, types: ["REPORT_MODERATED"] },
    { id: "comments", label: "Comments", icon: MessageCircle, types: [] },
  ];
  const visibleNotifications = notifications.filter((n) => {
    const readMatch = filter === "all" || (filter === "unread" ? !n.isRead : n.isRead);
    const selectedCategory = categories.find((item) => item.id === category);
    const type = String(n.type || "").toUpperCase();
    const categoryMatch = category === "all" || (selectedCategory?.types.includes(type) ?? false) || (category === "comments" && /comment/i.test(`${n.type} ${n.title}`));
    return readMatch && categoryMatch;
  });
  const todayCount = notifications.filter((n) => new Date(n.createdAt).toDateString() === new Date().toDateString()).length;
  async function read(n) {
    try {
      await notifApi.markRead(n._id);
      d.reload();
      const id = n.relatedId || n.itemId;
      if (id)
        nav(`/items/${id}?type=${n.relatedType === "lost" ? "lost" : "found"}`);
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  async function all() {
    try {
      await notifApi.markAllRead();
      d.reload();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  const relativeTime = (value) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (!Number.isFinite(minutes)) return fmtDate(value);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    return fmtDate(value);
  };
  const notificationIcon = (n) => {
    const type = String(n.type || "").toUpperCase();
    if (type === "MATCH_FOUND") return Search;
    if (type.startsWith("CLAIM") || type === "MORE_INFO_REQUIRED") return ClipboardCheck;
    if (["ITEM_RECEIVED", "RECOVERY_CONFIRMED"].includes(type)) return PackageCheck;
    if (type === "REPORT_MODERATED") return Bell;
    if (/comment/i.test(`${n.type} ${n.title}`)) return MessageCircle;
    return AlertCircle;
  };
  return (
    <div className="content notifications-page">
      <PageHead eyebrow="YOUR CAMPUS, AT A GLANCE" title="Notifications" description="Stay up to date with reports, claims and handovers." />
      {d.loading ? (
        <Loading />
      ) : d.error ? (
        <ErrorState message={d.error} onRetry={d.reload} />
      ) : (
        <>
          <section className="notification-stats" aria-label="Notification summary">
            <div className="notification-stat"><span className="notification-stat-icon"><Bell /></span><span><small>All notifications</small><b>{d.data?.pagination?.total ?? notifications.length}</b></span></div>
            <div className="notification-stat orange"><span className="notification-stat-icon"><Mail /></span><span><small>Unread</small><b>{unreadCount}</b></span></div>
            <div className="notification-stat"><span className="notification-stat-icon"><Clock3 /></span><span><small>Today</small><b>{todayCount}</b></span></div>
          </section>
          <div className="notification-toolbar">
            <div className="notification-tabs" role="tablist" aria-label="Read status">
              {[ ["all", "All", d.data?.pagination?.total ?? notifications.length], ["unread", "Unread", unreadCount], ["read", "Read", Math.max(0, (d.data?.pagination?.total ?? notifications.length) - unreadCount)] ].map(([id, label, count]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)} role="tab" aria-selected={filter === id}>{label} ({count})</button>)}
            </div>
            {unreadCount > 0 && <button className="notification-mark-read" onClick={all}><RotateCw size={16} />Mark all as read</button>}
          </div>
          <div className="notifications-layout">
            <section className="notification-list" aria-label="Notifications">
              {visibleNotifications.length ? visibleNotifications.map((n) => {
                const Icon = notificationIcon(n);
                return <button className={`notification-row ${n.isRead ? "read" : "unread"}`} key={n._id} onClick={() => read(n)}>
                  <span className="notification-icon"><Icon size={23} /></span>
                  <span className="notification-copy"><b>{n.title || n.type?.replaceAll("_", " ") || "Campus update"}</b><small>{n.message || "There is an update to one of your workflows."}</small></span>
                  <time>{relativeTime(n.createdAt)}</time>
                  {!n.isRead && <i className="unread-dot" aria-label="Unread" />}
                  <ChevronRight className="notification-chevron" size={21} />
                </button>;
              }) : <EmptyState title={category === "all" ? "You’re all caught up" : "No notifications in this category"} />}
            </section>
            <aside className="notification-types">
              <div className="notification-types-heading"><span><LeafIcon /></span><div><b>Notification types</b><small>Filter updates by category.</small></div></div>
              <div className="notification-category-list">
                {categories.map(({ id, label, icon: Icon, types }) => <button key={id} className={category === id ? "selected" : ""} onClick={() => setCategory(category === id ? "all" : id)}><span className="category-icon"><Icon size={19} /></span><span>{label}</span><b>{id === "comments" ? notifications.filter((n) => /comment/i.test(`${n.type} ${n.title}`)).length : notifications.filter((n) => types.includes(String(n.type || "").toUpperCase())).length}</b><ChevronRight size={17} /></button>)}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function LeafIcon() { return <span className="notification-leaf-mark">✦</span>; }

export function Profile() {
  const d = useLoad(userApi.getProfile, []),
    [message, M] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const saveLock = useRef(false);
  useEffect(
    () => () => {
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );
  async function save(e) {
    e.preventDefault();
    if (!editing) return;
    if (saveLock.current) return;
    M("");
    const f = new FormData(e.currentTarget);
    saveLock.current = true;
    setSaving(true);
    try {
      const updated = await userApi.updateProfile(f);
      const updatedUser = updated?.user || updated;
      if (updatedUser?.profileImage) setPhotoPreview(updatedUser.profileImage);
      d.setData((current) => {
        const currentUser = current?.user || current || {};
        return { user: { ...currentUser, ...updatedUser } };
      });
      await d.reload();
      setEditing(false);
      M("Profile saved.");
    } catch (x) {
      M(errorMessage(x));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }
  function cancelEdit() {
    formRef.current?.reset();
    setPhotoPreview(u.profileImage || "");
    setEditing(false);
    M("");
  }
  if (d.loading)
    return (
      <div className="content profile-page">
        <Loading />
      </div>
    );
  if (d.error)
    return (
      <div className="content profile-page">
        <ErrorState message={d.error} onRetry={d.reload} />
      </div>
    );
  const u = d.data?.user || d.data || {};
  const isStudent = u.role === "student";
  const image = photoPreview || u.profileImage;
  const initials = (u.name || "FikrNot User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const hostelName = typeof u.hostelId === "object" ? u.hostelId?.name : "";
  return (
    <div className="content profile-page">
      <PageHead
        eyebrow="YOUR ACCOUNT"
        title="Profile"
        description="Manage your profile and campus information."
      />
      <form ref={formRef} onSubmit={save} className="panel profile-card" encType="multipart/form-data">
        <section className="profile-identity" aria-label="Profile identity">
          <div className="profile-avatar" aria-label={`${u.name || "User"} profile image`}>
            {image ? <img src={image} alt="" /> : <span>{initials}</span>}
          </div>
          <div className="profile-identity-copy">
            <span className="profile-role">{isStudent ? "Student" : "Rector"}</span>
            <h2>{u.name}</h2>
            <p>
              {isStudent
                ? [u.course, u.department].filter(Boolean).join(" · ") || "Student account"
                : u.designation || "Rector account"}
            </p>
            {hostelName && (
              <span className="profile-campus"><MapPin size={14} /> {hostelName}</span>
            )}
          </div>
          <label className="profile-photo-button">
            <ImageIcon size={15} /> Change photo
            <input
              name="profileImage"
              type="file"
              accept="image/*"
              disabled={!editing || saving}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPhotoPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </section>

        <div className="profile-field-sections">
          <section className="profile-field-section">
            <div className="profile-section-heading">
              <h3>Personal information</h3>
              <p>Your name and contact details</p>
            </div>
            <div className="profile-fields">
              <label className="profile-field profile-field-wide">
                <span>Name</span>
                <input name="name" defaultValue={u.name || ""} autoComplete="name" readOnly={!editing} />
              </label>
              <label className="profile-field">
                <span>Email</span>
                <input type="email" value={u.email || ""} disabled readOnly />
                <small>Your login email</small>
              </label>
              <label className="profile-field">
                <span>Phone</span>
                <input name="phone" defaultValue={u.phone || ""} autoComplete="tel" readOnly={!editing} />
              </label>
            </div>
          </section>

          {isStudent ? (
            <>
              <section className="profile-field-section">
                <div className="profile-section-heading">
                  <h3>Academic information</h3>
                  <p>Your course and department</p>
                </div>
                <div className="profile-fields">
                  <label className="profile-field">
                    <span>Course</span>
                    <input name="course" defaultValue={u.course || ""} readOnly={!editing} />
                  </label>
                  <label className="profile-field">
                    <span>Department</span>
                    <input name="department" defaultValue={u.department || ""} readOnly={!editing} />
                  </label>
                </div>
              </section>
              <section className="profile-field-section">
                <div className="profile-section-heading">
                  <h3>Campus information</h3>
                  <p>Your assigned residence</p>
                </div>
                <div className="profile-fields">
                  <div className="profile-field">
                    <span>Hostel</span>
                    <div className="profile-readonly-field">{hostelName || "Not assigned"}</div>
                  </div>
                  <label className="profile-field">
                    <span>Room number</span>
                    <input name="roomNumber" defaultValue={u.roomNumber || ""} readOnly={!editing} />
                  </label>
                </div>
              </section>
            </>
          ) : (
            <section className="profile-field-section">
              <div className="profile-section-heading">
                <h3>Campus information</h3>
                <p>Your Rector assignment</p>
              </div>
              <div className="profile-fields">
                <label className="profile-field">
                  <span>Designation</span>
                  <input name="designation" defaultValue={u.designation || ""} readOnly={!editing} />
                </label>
                <div className="profile-field">
                  <span>Assigned hostel</span>
                  <div className="profile-readonly-field">{hostelName || "Not assigned"}</div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="profile-form-footer">
          {message && (
            <p className={message === "Profile saved." ? "success-inline" : "error-inline"} role="status">
              {message}
            </p>
          )}
          {editing ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button secondary" type="button" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
              <button className="button primary" type="submit" disabled={saving}>
                {saving ? <><RefreshCw size={15} className="spin" /> Saving…</> : "Save changes"}
              </button>
            </div>
          ) : (
            <button className="button primary" type="button" onClick={() => { M(""); setEditing(true); }}>
              Edit details
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export function RectorClaims() {
  return (
    <div className="content">
      <PageHead
        eyebrow="CLAIM REVIEW"
        title="Claims requiring verification"
        description="Review requests and verify ownership carefully."
      />
      <div className="notice-banner">
        <AlertCircle size={19} />
        <p>
          The backend has review, approval, rejection and request information
          actions, but does not expose an endpoint for Rectors to list claims.
          This page cannot show claim records until that backend endpoint
          exists.
        </p>
      </div>
      <EmptyState title="Claim queue is not available" />
    </div>
  );
}
export function NotFound() {
  return (
    <div className="content">
      <EmptyState
        title="We couldn’t find that page"
        action={
          <Link className="button primary" to="/">
            Go home
          </Link>
        }
      />
    </div>
  );
}
