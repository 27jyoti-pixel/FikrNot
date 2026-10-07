import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ShieldCheck,
  HeartHandshake,
  MapPin,
  TrendingUp,
  PackageSearch,
  Plus,
  Check,
  Filter,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
  CheckCircle2 as CompleteIcon,
  Clock3 as ProgressIcon,
} from "lucide-react";
import ItemCard from "../components/items/ItemCard";
import MiniItem from "../components/items/MiniItem";
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
  const heroReveal = useScrollReveal();
  const journeyReveal = useScrollReveal();
  const closingReveal = useScrollReveal();
  return (
    <div className="home">
      <section className="hero reveal-on-scroll" ref={heroReveal}>
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot-live" /> CAMPUS LOST & FOUND
          </div>
          <h1>
            Lost something?
            <br />
            <span>Let’s bring it <em>back.</em></span>
          </h1>
          <p className="hero-text">
            A little less worry. A little more looking out for each other. Find,
            report and recover belongings across campus.
          </p>
          <div className="hero-buttons">
            <Link
              className="button primary large"
              to={user ? "/report/lost" : "/login"}
            >
              <Search size={18} />I lost something
            </Link>
            <Link
              className="button outline large"
              to={user ? "/report/found" : "/login"}
            >
              <Plus size={18} />I found something
            </Link>
          </div>
          <div className="hero-proof">
            <ShieldCheck size={17} />
            <span>Every claim is reviewed by your hostel Rector</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-sun" />
          <div className="art-card card-one">
            <span className="art-icon">⌁</span>
            <div>
              <b>Item reports start here</b>
              <small>Add a few useful details</small>
            </div>
            <span className="art-check">
              <Check size={15} />
            </span>
          </div>
          <div className="art-card card-two">
            <span className="art-icon yellow">✳</span>
            <div>
              <b>Possible Match</b>
              <small>A suggestion, never proof</small>
            </div>
          </div>
          <div className="art-plant">✳</div>
          <div className="art-shape">
            <PackageSearch size={72} strokeWidth={1.2} />
          </div>
          <span className="spark spark-a">✦</span>
          <span className="spark spark-b">✦</span>
        </div>
      </section>
      <section className="steps-section reveal-on-scroll" ref={journeyReveal}>
        <div>
          <div className="eyebrow">A clearer way to recover</div>
          <h2>
            From lost to <em>found.</em>
          </h2>
        </div>
        <div className="steps">
          {[
            ["01", "Lost", "Report an item with useful details."],
            ["02", "Discover", "Browse campus reports."],
            ["03", "Possible Match", "A suggestion based on item details."],
            ["04", "Rector Verified", "Your Rector reviews the claim."],
            [
              "05",
              "Reunited",
              "Confirm handover, then Rector completes recovery.",
            ],
          ].map(([n, t, d]) => (
            <div className="step" key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="home-bottom reveal-on-scroll" ref={closingReveal}>
        <div>
          <div className="eyebrow">A campus that cares</div>
          <h2>
            Small acts. <em>Big relief.</em>
          </h2>
          <p>Found something? A quick report could make someone’s day.</p>
        </div>
        <Link
          className="button dark large"
          to={user ? "/report/found" : "/register"}
        >
          Help reunite an item <ArrowRight size={17} />
        </Link>
      </section>
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
      eyebrow={rectorEntry ? "CAMPUS STAFF" : "CAMPUS LOST & FOUND"}
      title={rectorEntry ? "Rector sign in" : "Welcome back"}
      description={rectorEntry ? "Sign in to manage reports, claims and recovery for your assigned hostel." : "Sign in to pick up where you left off."}
    >
      <form onSubmit={submit} className="form-stack">
        {err && (
          <div className="form-alert" role="alert">
            {err}
          </div>
        )}
        <label>
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="you@campus.edu"
            value={values.email}
            onChange={(e) => set({ ...values, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <div className="password-field">
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
        <button disabled={busy} className="button primary auth-submit">
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={17} />
        </button>
        <p className="auth-foot">
          {rectorEntry ? (
            <>Not a Rector? <Link to="/login">Student sign in →</Link></>
          ) : (
            <>New to FikrNot? <Link to="/register">Create an account</Link></>
          )}
        </p>
        {!rectorEntry && <p className="auth-secondary-link">Are you a Rector? <Link to="/rector-login">Rector sign in →</Link></p>}
      </form>
    </AuthPanel>
  );
}
function AuthPanel({
  eyebrow = "CAMPUS LOST & FOUND",
  title,
  description,
  children,
}) {
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
    [busy, B] = useState(false);
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
            <input
              required
              value={form.name}
              onChange={(e) => F({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Student ID
            <input
              required
              value={form.studentId}
              onChange={(e) => F({ ...form, studentId: e.target.value })}
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => F({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Phone <span className="optional">optional</span>
            <input
              value={form.phone}
              onChange={(e) => F({ ...form, phone: e.target.value })}
            />
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
              <select
                required
                value={form.hostelId}
                onChange={(e) => F({ ...form, hostelId: e.target.value })}
              >
                <option value="">Select your hostel</option>
                {host.data.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label>
            Room number
            <input
              value={form.roomNumber}
              onChange={(e) => F({ ...form, roomNumber: e.target.value })}
            />
          </label>
          <label>
            Course
            <input
              value={form.course}
              onChange={(e) => F({ ...form, course: e.target.value })}
            />
          </label>
          <label>
            Department
            <input
              value={form.department}
              onChange={(e) => F({ ...form, department: e.target.value })}
            />
          </label>
          <label>
            Year
            <input
              type="number"
              min="1"
              value={form.year}
              onChange={(e) => F({ ...form, year: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength="6"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => F({ ...form, password: e.target.value })}
            />
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
  return (
    <div className="content">
      <PageHead
        eyebrow="THE CAMPUS BOARD"
        title="Browse items"
        description="Explore lost and found reports from across campus."
      />
      <div className="browse-tools">
        <div className="searchbox">
          <Search size={18} />
          <input
            aria-label="Search item name"
            placeholder="Search by item name…"
            value={filters.search}
            onChange={(e) => {
              F({ ...filters, search: e.target.value });
              P(1);
            }}
          />
        </div>
        <div className="filter-line">
          <label>
            <Filter size={15} />
            <select
              aria-label="Report type"
              value={filters.type}
              onChange={(e) => {
                F({ ...filters, type: e.target.value });
                P(1);
              }}
            >
              <option value="all">Lost & found</option>
              <option value="lost">Lost items</option>
              <option value="found">Found items</option>
            </select>
          </label>
          <select
            aria-label="Category"
            value={filters.category}
            onChange={(e) => {
              F({ ...filters, category: e.target.value });
              P(1);
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            aria-label="Status"
            value={filters.status}
            onChange={(e) => {
              F({ ...filters, status: e.target.value });
              P(1);
            }}
          >
            <option value="">All statuses</option>
            {[
              "ACTIVE",
              "MATCH_FOUND",
              "CLAIM_IN_PROGRESS",
              "RECOVERED",
              "CLOSED",
              "REPORTED",
              "AWAITING_HANDOVER",
              "WITH_RECTOR",
              "RETURNED",
            ].map((x) => (
              <option key={x} value={x}>
                {x.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <input
            aria-label="Start date"
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              F({ ...filters, startDate: e.target.value });
              P(1);
            }}
          />
          <input
            aria-label="End date"
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              F({ ...filters, endDate: e.target.value });
              P(1);
            }}
          />
          <select
            aria-label="Hostel"
            value={filters.hostelId}
            onChange={(e) => {
              F({ ...filters, hostelId: e.target.value });
              P(1);
            }}
          >
            <option value="">All hostels</option>
            {host.data?.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {result.loading ? (
        <Loading label="Finding reports…" />
      ) : result.error ? (
        <ErrorState message={result.error} onRetry={load} />
      ) : result.rows.length ? (
        <>
          <div className="results-label">
            {result.total} reports <span>Newest first</span>
          </div>
          <div className="item-grid">
            {result.rows.map((item) => (
              <ItemCard
                key={`${item._type}-${item._id}`}
                item={item}
                type={item._type}
              />
            ))}
          </div>
          {result.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => P(page - 1)}>
                <ChevronLeft size={17} />
                Previous
              </button>
              <span>
                Page {page} of {result.pages}
              </span>
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
  async function submit(e) {
    e.preventDefault();
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
  return (
    <div className="content narrow">
      <PageHead
        eyebrow={edit ? "UPDATE YOUR REPORT" : "HELP YOUR CAMPUS COMMUNITY"}
        title={edit ? "Edit report" : `Report ${type} item`}
        description="Clear details help the right person recognise an item."
      />
      <form className="panel report-form" onSubmit={submit}>
        {err && (
          <div className="form-alert" role="alert">
            {err}
          </div>
        )}
        <div className="form-grid">
          <label className="wide">
            Item name
            <input
              required
              maxLength="100"
              value={form.itemName}
              placeholder="e.g. Blue stainless steel bottle"
              onChange={(e) => F({ ...form, itemName: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              required
              value={form.category}
              onChange={(e) => F({ ...form, category: e.target.value })}
            >
              <option value="">Choose a category</option>
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Brand <span className="optional">optional</span>
            <input
              value={form.brand}
              onChange={(e) => F({ ...form, brand: e.target.value })}
            />
          </label>
          <label>
            Color <span className="optional">optional</span>
            <input
              value={form.color}
              onChange={(e) => F({ ...form, color: e.target.value })}
            />
          </label>
          <label>
            {type === "lost"
              ? "When did you lose it?"
              : "When did you find it?"}
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => F({ ...form, date: e.target.value })}
            />
          </label>
          <label className="wide">
            More details <span className="optional">optional</span>
            <textarea
              rows="4"
              maxLength="1000"
              placeholder="Distinctive details that could help identify this item"
              value={form.description}
              onChange={(e) => F({ ...form, description: e.target.value })}
            />
          </label>
        </div>
        <ReportImagePicker
          inputRef={imageInput}
          existingImages={existingImages}
          newImages={form.images}
          onFilesSelected={selectImages}
          onRemoveExisting={removeExistingImage}
          onRemoveNew={removeNewImage}
        />
        <LocationSelector value={form.location} onChange={(location) => F((current) => ({ ...current, location }))} />
        <button
          className="button primary large"
          disabled={busy || host.loading}
        >
          {busy ? "Submitting…" : edit ? "Save changes" : "Submit report"}
          <ArrowRight size={17} />
        </button>
      </form>
    </div>
  );
}

export function ItemDetail() {
  const { id } = useParams();
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
    [msg, S] = useState("");
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
          {user?.role === "student" &&
            entityId(item.reportedBy) === user?._id && (
              <Link
                className="button outline small edit-item"
                to={"/report/" + type + "/" + id + "/edit"}
              >
                Edit report
              </Link>
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
  const bestMatch = Array.isArray(matchState.data) ? matchState.data[0] : null;
  const recentlyFound = campusFound
    .filter((item) => !["RETURNED", "CLOSED"].includes(item.status))
    .slice(0, 4);
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
  return (
    <div className="content student-dashboard">
      <PageHead
        eyebrow="YOUR CAMPUS, YOUR COMMUNITY"
        title={`Good to see you, ${(user?.name || "there").split(" ")[0]}.`}
        description="Here’s what’s happening with your items."
      />
      <div className="student-status-line">
        {lost.loading || found.loading || claims.loading
          ? "Loading your activity…"
          : `${mineLost.filter((item) => !["RECOVERED", "CLOSED"].includes(item.status)).length} active lost ${mineLost.length === 1 ? "report" : "reports"} · ${activeClaimCount} ${activeClaimCount === 1 ? "claim" : "claims"} in progress · ${bestMatch ? "A possible match is ready to view" : "We’ll surface possible matches here"}`}
      </div>
      <div className="quick-actions" aria-label="Quick actions">
        <Link to="/report/lost" className="quick-action quick-action-primary">
          <span className="quick-action-icon lost"><Search size={17} /></span>
          <span>
            <b>Report lost</b>
            <small>Share what you’re looking for</small>
          </span>
          <ArrowRight size={16} />
        </Link>
        <Link to="/report/found" className="quick-action">
          <span className="quick-action-icon found"><PackageSearch size={17} /></span>
          <span>
            <b>Report found</b>
            <small>Help return an item</small>
          </span>
          <ArrowRight size={16} />
        </Link>
        <Link to="/browse" className="quick-action">
          <span className="quick-action-icon browse"><PackageSearch size={17} /></span>
          <span>
            <b>Browse found items</b>
            <small>See what’s been found on campus</small>
          </span>
          <ArrowRight size={16} />
        </Link>
        <Link to="/notifications" className="quick-action">
          <span className="quick-action-icon updates"><Inbox size={17} /></span>
          <span>
            <b>View updates</b>
            <small>Stay on top of activity</small>
          </span>
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="student-focus-grid">
        <section className="student-focus-panel match-focus">
          <div className="section-title">
            <div>
              <div className="eyebrow">POSSIBLE MATCH</div>
              <h2>{bestMatch ? "We may have found your item" : "We’re looking for your item"}</h2>
            </div>
            <span className="focus-icon"><Search size={18} /></span>
          </div>
          {matchState.loading || lost.loading ? (
            <Loading />
          ) : matchState.error ? (
            <ErrorState message={matchState.error} onRetry={matchState.reload} />
          ) : bestMatch ? (
            <PossibleMatchCard result={bestMatch} />
          ) : (
            <div className="match-empty">
              <b>No possible matches yet</b>
              <p>We’ll show you here when a found item may belong to you.</p>
              <Link className="text-button" to="/browse">
                Browse found items <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
        <section className="student-focus-panel journey-focus">
          <div className="section-title">
            <div>
              <div className="eyebrow">YOUR RECOVERY JOURNEY</div>
              <h2>{latestClaim ? claimJourneyTitle(latestClaim) : "One step at a time"}</h2>
            </div>
            <Link className="text-button" to="/claims">All claims <ArrowRight size={14} /></Link>
          </div>
          {claims.loading ? (
            <Loading />
          ) : claims.error ? (
            <ErrorState message={claims.error} onRetry={claims.reload} />
          ) : latestClaim ? (
            <RecoveryTimeline claim={latestClaim} onWithdraw={withdraw} onConfirm={confirm} />
          ) : mineLost.some((item) => item.status === "MATCH_FOUND") ? (
            <div className="journey-current">
              <span className="journey-dot"><CheckCircle2 size={15} /></span>
              <div><b>Possible match found</b><p>Review the match and submit a claim if it looks like yours.</p></div>
              {bestMatch && <Link className="text-button" to={`/items/${bestMatch.match.foundReportId._id}?type=found`}>View <ArrowRight size={14} /></Link>}
            </div>
          ) : (
            <div className="journey-current">
              <span className="journey-dot"><Search size={15} /></span>
              <div><b>Report submitted</b><p>We’ll keep checking new found reports for a possible match.</p></div>
            </div>
          )}
          {!claims.loading && !claims.error && !claimList.length && (
            <Link className="journey-browse-link" to="/browse">No claims in progress · Browse items to find a match <ArrowRight size={14} /></Link>
          )}
        </section>
      </div>
      <div className="student-summary-strip" aria-label="Your personal summary">
        <span><b>{lost.loading ? "…" : mineLost.length}</b> lost</span>
        <span><b>{claims.loading ? "…" : activeClaimCount}</b> claims</span>
        <span><b>{matchState.loading ? "…" : Array.isArray(matchState.data) ? matchState.data.length : 0}</b> matches</span>
        <span><b>{lost.loading || claims.loading ? "…" : recoveredCount}</b> recovered</span>
      </div>
      <div className="student-dashboard-columns">
        <section className="student-section">
          <div className="section-title">
            <div>
              <div className="eyebrow">YOUR REPORTS</div>
              <h2>My active reports</h2>
            </div>
            <Link className="text-button" to="/report/lost">
              Report item <ArrowRight size={15} />
            </Link>
          </div>
          {lost.loading || found.loading ? (
            <Loading />
          ) : lost.error || found.error ? (
            <ErrorState message={lost.error || found.error} onRetry={() => { lost.reload(); found.reload(); }} />
          ) : activeReports.length ? (
            <div className="mini-list">
              {activeReports.slice(0, 6).map(({ item, type }) => (
                <DashboardItem key={`${type}-${item._id}`} item={item} type={type} />
              ))}
            </div>
          ) : (
            <CompactEmpty
              title="You’re all caught up"
              description="Your active lost and found reports will be easy to follow here."
              to="/report/lost"
              action="Report an item"
            />
          )}
        </section>
        <aside className="student-side-stack">
          <div className="section-title">
            <div>
              <div className="eyebrow">ON CAMPUS</div>
              <h2>Recently found</h2>
            </div>
            <Link className="text-button" to="/browse">
              Browse all
            </Link>
          </div>
          {found.loading ? (
            <Loading />
          ) : found.error ? (
            <ErrorState message={found.error} onRetry={found.reload} />
          ) : recentlyFound.length ? (
            <div className="mini-list">
              {recentlyFound.map((item) => (
                <DashboardItem key={item._id} item={item} type="found" />
              ))}
            </div>
          ) : (
            <CompactEmpty
              title="No recent found items"
              description="New reports from your campus will show up here."
              to="/browse"
              action="Browse found items"
            />
          )}
          <section className="student-activity">
            <div className="eyebrow">RECENT ACTIVITY</div>
            <h2>Only what matters</h2>
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
            ) : (
              <div className="activity-empty">Your report and claim updates will appear here.</div>
            )}
          </section>
        </aside>
      </div>
      <section className="student-contribution">
        <span className="contribution-icon"><HeartHandshake size={19} /></span>
        <div>
          <div className="eyebrow">YOUR CONTRIBUTION</div>
          <b>{mineFound.filter((item) => ["RETURNED", "CLOSED"].includes(item.status)).length} items helped on their way home</b>
          <p>{mineFound.length ? "Thanks for looking out for your campus community." : "Found something on campus? Help get it back to its owner."}</p>
        </div>
        {!mineFound.length && <Link className="text-button" to="/report/found">Report a found item <ArrowRight size={14} /></Link>}
      </section>
    </div>
  );
}
function claimJourneyTitle(claim) {
  if (claim.studentConfirmedAt) return "Your item is recovered";
  if (claim.infoRequestedReason) return "The Rector needs a little more information";
  if (claim.status === "APPROVED") return "Your item is ready for handover";
  if (claim.status === "REJECTED") return "This claim was declined";
  return "Your claim is being reviewed";
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
  const d = useLoad(() => notifApi.getNotifications(), []);
  const nav = useNavigate();
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
  return (
    <div className="content">
      <PageHead
        eyebrow="UPDATES FROM YOUR CAMPUS"
        title="Notifications"
        description="Stay up to date with reports, claims and handovers."
      >
        {d.data?.some((n) => !n.isRead) && (
          <button className="button outline" onClick={all}>
            Mark all as read
          </button>
        )}
      </PageHead>
      {d.loading ? (
        <Loading />
      ) : d.error ? (
        <ErrorState message={d.error} onRetry={d.reload} />
      ) : d.data?.length ? (
        <div className="notification-list">
          {d.data.map((n) => (
            <button
              className={`notification-row ${n.isRead ? "read" : ""}`}
              key={n._id}
              onClick={() => read(n)}
            >
              <span className="notification-icon">
                <Inbox size={18} />
              </span>
              <span>
                <b>
                  {n.title || n.type?.replaceAll("_", " ") || "Campus update"}
                </b>
                <small>
                  {n.message || "There is an update to one of your workflows."}
                </small>
                <small>{fmtDate(n.createdAt)}</small>
              </span>
              {!n.isRead && <i className="unread-dot" />}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="You’re all caught up" />
      )}
    </div>
  );
}

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
