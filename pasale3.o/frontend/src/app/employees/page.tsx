import { useState, useEffect, useCallback } from "react";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
// Your Django server address. Since you run: python manage.py runserver
// the address is always http://localhost:8000 during local development.
// The "/api" at the end must match whatever prefix you used in your
// root urls.py when you included your app's urls, e.g.:
//   path("api/", include("api.urls"))  →  API_BASE = "http://localhost:8000/api"
const API_BASE = "http://localhost:8000/api";

// business_id is saved to localStorage after login (your LoginView returns it).
const getBusinessId = () => {
  if (typeof window === "undefined") return 1;
  return Number(localStorage.getItem("business_id")) || 1;
};

// ─── URL REFERENCE (from your urls.py) ───────────────────────────────────────
//  GET  /api/employee/b<business_id>/                  → list all employees
//  POST /api/employee/b<business_id>/                  → create employee
//  GET  /api/employee/b<business_id>/e<employee_id>/   → single employee
//  PUT  /api/employee/b<business_id>/e<employee_id>/   → update employee
//  DEL  /api/employee/b<business_id>/e<employee_id>/   → delete employee
//  GET  /api/scheduler/b<business_id>/                 → get scheduled shifts
//  POST /api/scheduler/                                → run WSM scheduler
// ─────────────────────────────────────────────────────────────────────────────

const api = {
  // GET /api/employee/b1/
  getEmployees: () =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/`).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw err.error || "Failed to fetch employees";
      }
      return r.json();
    }),

  // GET /api/employee/b1/e5/
  getEmployee: (id) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw err.error || "Failed to fetch employee";
      }
      return r.json();
    }),

  // POST /api/employee/b1/
  createEmployee: (data) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    }),

  // PUT /api/employee/b1/e5/
  updateEmployee: (id, data) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    }),

  // DELETE /api/employee/b1/e5/
  deleteEmployee: (id) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`, {
      method: "DELETE",
    }).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw err.error || "Delete failed";
      }
      return r.json();
    }),

  // GET /api/scheduler/b1/           (optionally ?employee_id=X)
  getShifts: (employeeId) =>
    fetch(
      `${API_BASE}/scheduler/b${getBusinessId()}/${employeeId ? `?employee_id=${employeeId}` : ""
      }`
    ).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw err.error || "Failed to fetch shifts";
      }
      return r.json();
    }),

  // POST /api/scheduler/  — body includes business_id, shift_ids, apply_schedule
  runScheduler: (payload) =>
    fetch(`${API_BASE}/scheduler/b${getBusinessId()}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, business_id: getBusinessId() }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    }),

  // GET /api/departments/b1/
  getDepartments: () =>
    fetch(`${API_BASE}/departments/b${getBusinessId()}/`).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw err.error || "Failed to fetch departments";
      }
      return r.json();
    }),

  // POST /api/departments/b1/
  createDepartment: (name) =>
    fetch(`${API_BASE}/departments/b${getBusinessId()}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    }),
};

// ─── MOCK DATA (for demo when backend not connected) ─────────────────────────
const MOCK_EMPLOYEES = [
  {
    id: 1,
    name: "Priya Sharma",
    email: "priya@pasale.com",
    phone_no: "+977-9841234567",
    position: "Store Manager",
    salary: "45000",
    status: { name: "Active" },
    department: "Operations",
    join_date: "2023-01-15",
  },
  {
    id: 2,
    name: "Rohan Thapa",
    email: "rohan@pasale.com",
    phone_no: "+977-9851234567",
    position: "Sales Associate",
    salary: "28000",
    status: { name: "Active" },
    department: "Sales",
    join_date: "2023-03-20",
  },
  {
    id: 3,
    name: "Aarti Patel",
    email: "aarti@pasale.com",
    phone_no: "+977-9861234567",
    position: "Inventory Clerk",
    salary: "25000",
    status: { name: "Active" },
    department: "Inventory",
    join_date: "2023-06-01",
  },
  {
    id: 4,
    name: "Bikash Karki",
    email: "bikash@pasale.com",
    phone_no: "+977-9871234567",
    position: "Cashier",
    salary: "22000",
    status: { name: "On Leave" },
    department: "Finance",
    join_date: "2022-11-10",
  },
  {
    id: 5,
    name: "Sunita Rai",
    email: "sunita@pasale.com",
    phone_no: "+977-9881234567",
    position: "Supervisor",
    salary: "35000",
    status: { name: "Active" },
    department: "Operations",
    join_date: "2022-07-05",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const DEPT_COLORS = {
  Operations: { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9" },
  Sales: { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  Inventory: { bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
  Finance: { bg: "#fce7f3", text: "#9d174d", dot: "#ec4899" },
  HR: { bg: "#ede9fe", text: "#6d28d9", dot: "#8b5cf6" },
  default: { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
};

const STATUS_COLORS = {
  Active: { bg: "#dcfce7", text: "#16a34a" },
  "On Leave": { bg: "#fef3c7", text: "#d97706" },
  Inactive: { bg: "#fee2e2", text: "#dc2626" },
};

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

const AVATAR_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
];

const avatarGrad = (id) => AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];

// ─── ICONS (inline SVG so no extra deps) ─────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 0 0 -8 0",
  plus: "M12 5v14 M5 12h14",
  search: "M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  calendar:
    "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  close: "M18 6L6 18 M6 6l12 12",
  chevronDown: "M6 9l6 6 6-6",
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  check: "M20 6L9 17l-5-5",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2",
  filter: "M22 3H2l8 9.46V19l4 2V12.46L22 3z",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  trendUp: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  schedule: "M8 6h13 M8 12h13 M8 18h4 M3 6h.01 M3 12h.01 M3 18h.01",
  warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.type === "error" ? "#fee2e2" : t.type === "warning" ? "#fef3c7" : "#dcfce7",
            border: `1px solid ${t.type === "error" ? "#fca5a5" : t.type === "warning" ? "#fcd34d" : "#86efac"}`,
            color: t.type === "error" ? "#991b1b" : t.type === "warning" ? "#92400e" : "#166534",
            padding: "12px 16px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            animation: "slideIn .2s ease",
            minWidth: 280,
          }}
        >
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}>
            <Icon d={ICONS.close} size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "20px 24px",
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      transition: "box-shadow .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
        <Icon d={ICONS[icon]} size={20} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── EMPLOYEE CARD ────────────────────────────────────────────────────────────
function EmployeeCard({ emp, onEdit, onDelete, onView }) {
  const statusName = typeof emp.status === "string" ? emp.status : emp.status?.name || "Active";
  const deptName = typeof emp.department === "string" ? emp.department : emp.department?.name || emp.department;
  const deptColor = DEPT_COLORS[deptName] || DEPT_COLORS.default;
  const statusColor = STATUS_COLORS[statusName] || STATUS_COLORS.Active;
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #f1f5f9",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      transition: "all .25s",
      cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: avatarGrad(emp.id),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
              fontFamily: "'Sora', sans-serif",
            }}>
              {getInitials(emp.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{emp.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{emp.position}</div>
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
            background: statusColor.bg, color: statusColor.text,
          }}>
            {statusName}
          </span>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
            <Icon d={ICONS.mail} size={13} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
            <Icon d={ICONS.phone} size={13} />
            {emp.phone_no}
          </div>
          {emp.salary && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
              <Icon d={ICONS.dollar} size={13} />
              NPR {Number(emp.salary).toLocaleString()} / mo
            </div>
          )}
        </div>

        {emp.department && (
          <div style={{ marginTop: 12 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
              background: deptColor.bg, color: deptColor.text,
            }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: deptColor.dot, marginRight: 5, verticalAlign: "middle" }} />
              {deptName}
            </span>
          </div>
        )}
      </div>
      <div style={{ borderTop: "1px solid #f8fafc", display: "flex" }}>
        <button onClick={() => onView(emp)}
          style={{ flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3b82f6", fontWeight: 600, transition: "background .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >View</button>
        <button onClick={() => onEdit(emp)}
          style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderLeft: "1px solid #f8fafc", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 600, transition: "background .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >Edit</button>
        <button onClick={() => onDelete(emp)}
          style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderLeft: "1px solid #f8fafc", cursor: "pointer", fontSize: 13, color: "#ef4444", fontWeight: 600, transition: "background .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fff1f2"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >Remove</button>
      </div>
    </div>
  );
}

// ─── EMPLOYEE ROW (list view) ─────────────────────────────────────────────────
function EmployeeRow({ emp, onEdit, onDelete, onView }) {
  const statusName = typeof emp.status === "string" ? emp.status : emp.status?.name || "Active";
  const deptName = typeof emp.department === "string" ? emp.department : emp.department?.name || emp.department;
  const statusColor = STATUS_COLORS[statusName] || STATUS_COLORS.Active;
  const deptColor = DEPT_COLORS[deptName] || DEPT_COLORS.default;
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9", transition: "background .1s" }}
      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: avatarGrad(emp.id),
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>{getInitials(emp.name)}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{emp.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{emp.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{emp.position}</td>
      <td style={{ padding: "14px 16px" }}>
        {deptName && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: deptColor.bg, color: deptColor.text }}>
            {deptName}
          </span>
        )}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{emp.phone_no}</td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
        NPR {emp.salary ? Number(emp.salary).toLocaleString() : "—"}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: statusColor.bg, color: statusColor.text }}>
          {statusName}
        </span>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onView(emp)} style={rowBtn("#3b82f6")} title="View"><Icon d={ICONS.users} size={14} /></button>
          <button onClick={() => onEdit(emp)} style={rowBtn("#64748b")} title="Edit"><Icon d={ICONS.edit} size={14} /></button>
          <button onClick={() => onDelete(emp)} style={rowBtn("#ef4444")} title="Delete"><Icon d={ICONS.trash} size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

const rowBtn = (color) => ({
  background: "none", border: `1px solid ${color}30`, padding: "5px 8px", borderRadius: 6,
  cursor: "pointer", color, transition: "all .15s", display: "flex", alignItems: "center",
});

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "text", options, required, placeholder }) {
  const base = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
    border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc",
    boxSizing: "border-box", fontFamily: "inherit", color: "#0f172a",
    transition: "border-color .15s, background .15s",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange}
          style={base}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
        >
          <option value="">— Select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder || label} style={base} required={required}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
        />
      )}
    </div>
  );
}

// ─── DRAWER: ADD / EDIT EMPLOYEE ──────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", email: "", phone_no: "", position: "", salary: "",
  department: "", status: "Active",
};

function EmployeeDrawer({ open, onClose, employee, onSave, loading, options }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        phone_no: employee.phone_no || "",
        position: employee.position || "",
        salary: employee.salary || "",
        department: typeof employee.department === "string" ? employee.department : employee.department?.name || "",
        status: typeof employee.status === "string" ? employee.status : employee.status?.name || "Active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [employee, open]);

  // If a department is selected that isn't in options, we should probably add it
  // or handle it gracefully. But for now, we'll rely on the parent's departments list.

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = () => onSave(form);

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, backdropFilter: "blur(2px)" }} />}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: 440, maxWidth: "100vw",
        background: "#fff", zIndex: 201, boxShadow: "-8px 0 40px rgba(0,0,0,.15)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {employee ? "Edit Employee" : "Add New Employee"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              {employee ? `Updating ${employee.name}` : "Fill in the details below"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#64748b" }}>
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Priya Sharma" />
          <Field label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" required placeholder="name@company.com" />
          <Field label="Phone Number" name="phone_no" value={form.phone_no} onChange={handleChange} required placeholder="+977-9XXXXXXXX" />
          <Field label="Position / Title" name="position" value={form.position} onChange={handleChange} required placeholder="e.g. Store Manager" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Department" name="department" value={form.department} onChange={handleChange}
              options={options?.departments?.length ? options.departments : ["Operations", "Sales", "Inventory", "Finance", "HR"]} />
            <Field label="Monthly Salary (NPR)" name="salary" value={form.salary} onChange={handleChange} type="number" placeholder="25000" />
          </div>
          <Field label="Status" name="status" value={form.status} onChange={handleChange}
            options={["Active", "On Leave", "Inactive"]} />
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #e2e8f0",
            background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#475569",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
            background: loading ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#2563eb)",
            cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 14px rgba(59,130,246,.4)",
          }}>
            {loading ? "Saving…" : employee ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── CONFIRM DELETE MODAL ─────────────────────────────────────────────────────
function DeleteModal({ emp, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", margin: "0 auto 16px" }}>
          <Icon d={ICONS.warning} size={24} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Remove Employee</div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>
            Are you sure you want to remove <strong>{emp?.name}</strong>? This action cannot be undone.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#475569" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#ef4444", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Removing…" : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPLOYEE DETAIL PANEL ────────────────────────────────────────────────────
function EmployeeDetail({ emp, onClose, onEdit }) {
  const statusName = typeof emp?.status === "string" ? emp.status : emp?.status?.name || "Active";
  const statusColor = STATUS_COLORS[statusName] || STATUS_COLORS.Active;
  if (!emp) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, width: 480, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
        {/* Banner */}
        <div style={{ height: 100, background: avatarGrad(emp.id), borderRadius: "24px 24px 0 0", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.25)", border: "none", borderRadius: 8, padding: 7, cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)" }}>
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>
        {/* Avatar */}
        <div style={{ padding: "0 28px", marginTop: -30 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: avatarGrad(emp.id), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, border: "3px solid #fff", boxShadow: "0 4px 16px rgba(0,0,0,.15)" }}>
            {getInitials(emp.name)}
          </div>
        </div>
        <div style={{ padding: "14px 28px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{emp.name}</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>{emp.position}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: statusColor.bg, color: statusColor.text }}>
              {statusName}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
            {[
              { icon: "mail", label: "Email", val: emp.email },
              { icon: "phone", label: "Phone", val: emp.phone_no },
              { icon: "briefcase", label: "Department", val: (typeof emp.department === "string" ? emp.department : emp.department?.name) || "—" },
              { icon: "dollar", label: "Salary", val: emp.salary ? `NPR ${Number(emp.salary).toLocaleString()}` : "—" },
              { icon: "calendar", label: "Joined", val: emp.join_date || "—" },
            ].map(({ icon, label, val }) => (
              <div key={label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <span style={{ color: "#94a3b8" }}><Icon d={ICONS[icon]} size={13} /></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", wordBreak: "break-all" }}>{val}</div>
              </div>
            ))}
          </div>

          <button onClick={() => { onClose(); onEdit(emp); }} style={{
            marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontWeight: 700,
            fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,.35)",
          }}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE MODAL ───────────────────────────────────────────────────────────
function ScheduleModal({ employees, onClose, onRun, loading }) {
  const [selected, setSelected] = useState([]);
  const [shiftIds, setShiftIds] = useState("");
  const [apply, setApply] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleRun = async () => {
    const ids = shiftIds.split(",").map(s => parseInt(s.trim())).filter(Boolean);
    if (!ids.length) return;
    const r = await onRun({ business_id: getBusinessId(), shift_ids: ids, apply_schedule: apply });
    setResult(r);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: 520, maxHeight: "88vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>WSM Auto-Scheduler</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Weighted Score Model assigns best-fit employees to shifts</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#64748b" }}>
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>
        <div style={{ padding: "20px 28px" }}>
          {!result ? (
            <>
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: "14px 16px", marginBottom: 18, fontSize: 13, color: "#1e40af" }}>
                <strong>How it works:</strong> The WSM algorithm ranks employees by availability (30%), skill match (25%), fairness (20%), skill level (15%), and cost (10%).
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Shift IDs (comma-separated)" name="shift_ids" value={shiftIds}
                  onChange={e => setShiftIds(e.target.value)} placeholder="1, 2, 5, 8" />
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer", fontWeight: 500, color: "#374151" }}>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11, background: apply ? "#3b82f6" : "#e2e8f0",
                    position: "relative", transition: "background .2s", cursor: "pointer", flexShrink: 0,
                  }} onClick={() => setApply(p => !p)}>
                    <div style={{ position: "absolute", top: 2, left: apply ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s" }} />
                  </div>
                  Apply assignments to database immediately
                </label>
              </div>
              <button onClick={handleRun} disabled={loading} style={{
                marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                background: loading ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff",
                fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(59,130,246,.4)",
              }}>
                {loading ? "Running Scheduler…" : "Run WSM Scheduler"}
              </button>
            </>
          ) : (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", margin: "0 auto 12px" }}>
                  <Icon d={ICONS.check} size={24} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Schedule Generated!</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["Scheduled", result.scheduling_result?.scheduled_count ?? "—"],
                  ["Unscheduled", result.scheduling_result?.unscheduled_count ?? "—"],
                  ["Total Shifts", result.scheduling_result?.total_shifts ?? "—"],
                  ["Success Rate", result.scheduling_result?.success_rate ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{v}</div>
                  </div>
                ))}
              </div>
              {result.schedule_summary?.employee_summary?.map(e => (
                <div key={e.employee} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{e.employee}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{e.shifts_assigned} shift{e.shifts_assigned !== 1 ? "s" : ""} · avg {e.avg_score}</span>
                </div>
              ))}
              <button onClick={() => setResult(null)} style={{ marginTop: 16, width: "100%", padding: "11px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#475569" }}>
                Run Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [availableDepts, setAvailableDepts] = useState([]);
  const { toasts, add: toast, remove: removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      if (Array.isArray(data)) {
        setEmployees(data);
        setUseMock(false);
      } else throw new Error("Non-array response");
    } catch {
      setEmployees(MOCK_EMPLOYEES);
      setUseMock(true);
    } finally {
      setLoading(false);
    }

    // Also load departments
    try {
      const depts = await api.getDepartments();
      if (Array.isArray(depts)) {
        setAvailableDepts(depts.map(d => d.name));
      }
    } catch (e) {
      console.warn("Could not load departments:", e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q);
    
    const empDept = typeof e.department === "string" ? e.department : e.department?.name || e.department;
    const matchD = !deptFilter || empDept === deptFilter;
    
    const empStatus = typeof e.status === "string" ? e.status : e.status?.name || "Active";
    const matchS = !statusFilter || empStatus === statusFilter;
    
    return matchQ && matchD && matchS;
  });

  const departments = availableDepts.length 
    ? [...new Set([...availableDepts, ...employees.map(e => typeof e.department === "string" ? e.department : e.department?.name || e.department).filter(Boolean)])]
    : [...new Set(employees.map(e => typeof e.department === "string" ? e.department : e.department?.name || e.department).filter(Boolean))];

  const stats = {
    total: employees.length,
    active: employees.filter(e => {
      const s = typeof e.status === "string" ? e.status : e.status?.name || "Active";
      return s === "Active";
    }).length,
    onLeave: employees.filter(e => {
      const s = typeof e.status === "string" ? e.status : e.status?.name || "Active";
      return s === "On Leave";
    }).length,
    avgSalary: employees.length
      ? Math.round(employees.reduce((s, e) => s + (Number(e.salary) || 0), 0) / employees.length)
      : 0,
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (useMock) {
        if (editTarget) {
          setEmployees(p => p.map(e => e.id === editTarget.id ? { ...e, ...form, status: { name: form.status } } : e));
          toast("Employee updated successfully!");
        } else {
          const newEmp = { ...form, id: Date.now(), status: { name: form.status } };
          setEmployees(p => [...p, newEmp]);
          toast("Employee added successfully!");
        }
        setDrawerOpen(false);
        setEditTarget(null);
        return;
      }
      if (editTarget) {
        await api.updateEmployee(editTarget.id, form);
        toast("Employee updated!");
      } else {
        await api.createEmployee(form);
        toast("Employee added!");
      }
      await load();
      setDrawerOpen(false);
      setEditTarget(null);
    } catch (e) {
      console.error("Save error:", e);
      let msg = "Something went wrong. Please try again.";
      if (typeof e === "object" && e !== null) {
        // DRF usually returns errors as { field: ["error"] }
        const firstKey = Object.keys(e)[0];
        if (firstKey) {
          const err = e[firstKey];
          msg = Array.isArray(err) ? err[0] : typeof err === "string" ? err : JSON.stringify(err);
          msg = `${firstKey}: ${msg}`;
        }
      }
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (useMock) {
        setEmployees(p => p.filter(e => e.id !== deleteTarget.id));
        toast(`${deleteTarget.name} removed.`);
        setDeleteTarget(null);
        return;
      }
      await api.deleteEmployee(deleteTarget.id);
      toast(`${deleteTarget.name} removed.`);
      await load();
      setDeleteTarget(null);
    } catch {
      toast("Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSchedule = async (payload) => {
    setScheduling(true);
    try {
      const r = await api.runScheduler(payload);
      setScheduling(false);
      return r;
    } catch {
      toast("Scheduler failed. Check console.", "error");
      setScheduling(false);
      return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Sora', 'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .emp-card { animation: fadeUp .3s ease both; }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      {/* ── PAGE HEADER ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon d={ICONS.users} size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Employee Management</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {useMock ? "Demo mode — connect backend to see live data" : `${stats.total} team members · ${stats.active} active`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowScheduler(true)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10,
            border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569",
          }}>
            <Icon d={ICONS.schedule} size={15} /> Auto-Schedule
          </button>
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10,
            border: "none", background: "#3b82f6", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,.3)",
          }}>
            <Icon d={ICONS.plus} size={15} /> Add Employee
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* ── STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Employees" value={stats.total} color="#3b82f6" icon="users" sub={`${departments.length} departments`} />
          <StatCard label="Active Now" value={stats.active} color="#22c55e" icon="check" sub={`${Math.round((stats.active / stats.total) * 100) || 0}% of team`} />
          <StatCard label="On Leave" value={stats.onLeave} color="#f59e0b" icon="clock" sub="Currently away" />
          <StatCard label="Avg. Monthly Salary" value={`₨${stats.avgSalary.toLocaleString()}`} color="#8b5cf6" icon="dollar" sub="Across all staff" />
        </div>

        {/* ── TOOLBAR ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
              <Icon d={ICONS.search} size={15} />
            </span>
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, role…"
              style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}
            />
          </div>
          {/* Dept filter */}
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: deptFilter ? "#0f172a" : "#94a3b8", cursor: "pointer" }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: statusFilter ? "#0f172a" : "#94a3b8", cursor: "pointer" }}>
            <option value="">All Status</option>
            {["Active", "On Leave", "Inactive"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* View toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
            {[["grid", ICONS.grid], ["list", ICONS.list]].map(([mode, ic]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "7px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                background: viewMode === mode ? "#fff" : "transparent",
                color: viewMode === mode ? "#3b82f6" : "#94a3b8",
                boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                transition: "all .15s",
              }}>
                <Icon d={ic} size={15} />
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
        </div>

        {/* ── EMPLOYEE LIST ── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 220, background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", animation: "pulse 1.5s infinite" }}>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: "16px 16px 0 0" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No employees found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Try adjusting your search or filters</div>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {filtered.map((emp, i) => (
              <div key={emp.id} className="emp-card" style={{ animationDelay: `${i * 0.04}s` }}>
                <EmployeeCard emp={emp}
                  onEdit={e => { setEditTarget(e); setDrawerOpen(true); }}
                  onDelete={setDeleteTarget}
                  onView={setViewTarget}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Employee", "Position", "Department", "Phone", "Salary", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <EmployeeRow key={emp.id} emp={emp}
                    onEdit={e => { setEditTarget(e); setDrawerOpen(true); }}
                    onDelete={setDeleteTarget}
                    onView={setViewTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS / DRAWERS ── */}
      <EmployeeDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
        employee={editTarget} onSave={handleSave} loading={saving} options={{ departments }} />

      {deleteTarget && (
        <DeleteModal emp={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}

      {viewTarget && (
        <EmployeeDetail emp={viewTarget} onClose={() => setViewTarget(null)}
          onEdit={e => { setViewTarget(null); setEditTarget(e); setDrawerOpen(true); }} />
      )}

      {showScheduler && (
        <ScheduleModal employees={employees} onClose={() => setShowScheduler(false)}
          onRun={handleSchedule} loading={scheduling} />
      )}
    </div>
  );
}