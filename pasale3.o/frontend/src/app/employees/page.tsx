import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000/api";

const getBusinessId = () => {
  if (typeof window === "undefined") return 1;
  return Number(localStorage.getItem("business_id")) || 1;
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  const directToken = localStorage.getItem("auth_token");
  if (directToken) return directToken;
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) return accessToken;
  const authStorage = localStorage.getItem("auth-storage");
  if (authStorage) {
    try { return JSON.parse(authStorage).state?.accessToken || null; } catch {}
  }
  return null;
};

const api = {
  getEmployees: () =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch employees"; }
      return r.json();
    }),
  getEmployee: (id) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch employee"; }
      return r.json();
    }),
  createEmployee: (data) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  updateEmployee: (id, data) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  deleteEmployee: (id) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`, { method: "DELETE" }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Delete failed"; }
      return r.json();
    }),
  getShifts: (employeeId) =>
    fetch(`${API_BASE}/scheduler/b${getBusinessId()}/${employeeId ? `?employee_id=${employeeId}` : ""}`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch shifts"; }
      return r.json();
    }),
  runScheduler: (payload) =>
    fetch(`${API_BASE}/scheduler/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, business_id: getBusinessId() }),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  getDepartments: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/departments/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch departments"; }
      return r.json();
    });
  },
  createDepartment: (name) =>
    fetch(`${API_BASE}/departments/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  getUnscheduledShifts: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/scheduler/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch shifts"; }
      return r.json();
    });
  },
  runWSMScheduler: (payload) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${API_BASE}/scheduler/schedule/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        business_id: getBusinessId(),
        ...payload,
      }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    });
  },
  manualAssign: (shiftId, employeeId) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${API_BASE}/scheduler/shift/${shiftId}/assign/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ employee_id: employeeId }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    });
  },
  deleteShift: (id) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/s${id}/`, { method: "DELETE", headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to delete shift"; }
      return r.json();
    });
  },
  getSkills: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch skills"; }
      return r.json();
    });
  },
  createSkill: (data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/`, { method: "POST", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  updateSkill: (id, data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/s${id}/`, { method: "PUT", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  deleteSkill: (id) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/s${id}/`, { method: "DELETE", headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to delete skill"; }
      return r.json();
    });
  },
  getEmployeeSkills: (employeeId) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/employee-skills/b${getBusinessId()}/e${employeeId}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch employee skills"; }
      return r.json();
    });
  },
  assignEmployeeSkill: (employeeId, data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/employee-skills/b${getBusinessId()}/e${employeeId}/`, { method: "POST", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  removeEmployeeSkill: (employeeId, skillId) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/employee-skills/b${getBusinessId()}/e${employeeId}/s${skillId}/`, { method: "DELETE", headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to remove employee skill"; }
      return r.json();
    });
  },
  getShiftsCRUD: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch shifts"; }
      return r.json();
    });
  },
  createShift: (data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/`, { method: "POST", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  updateShift: (id, data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/s${id}/`, { method: "PUT", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
};

const MOCK_EMPLOYEES = [
  {
    id: 1,
    name: "Ramesh Sharma",
    email: "ramesh@pasale.com",
    phone_no: "+977-9841234567",
    position: "Store Manager",
    salary: "45000",
    status: { name: "Active" },
    department: "Operations",
    join_date: "2023-01-15",
  },
  {
    id: 2,
    name: "Sita Thapa",
    email: "sita@pasale.com",
    phone_no: "+977-9851234567",
    position: "Sales Associate",
    salary: "28000",
    status: { name: "Active" },
    department: "Sales",
    join_date: "2023-03-20",
  },
  {
    id: 3,
    name: "Aarav Shrestha",
    email: "aarav@pasale.com",
    phone_no: "+977-9861234567",
    position: "Inventory Officer",
    salary: "25000",
    status: { name: "Active" },
    department: "Inventory",
    join_date: "2023-06-01",
  },
  {
    id: 4,
    name: "Bikram Karki",
    email: "bikram@pasale.com",
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
    position: "Shift Supervisor",
    salary: "35000",
    status: { name: "Active" },
    department: "Operations",
    join_date: "2022-07-05",
  },
  {
    id: 6,
    name: "Dipendra Lama",
    email: "dipendra@pasale.com",
    phone_no: "+977-9811234567",
    position: "Sales Associate",
    salary: "27000",
    status: { name: "Active" },
    department: "Sales",
    join_date: "2024-02-12",
  },
  {
    id: 7,
    name: "Maya Gurung",
    email: "maya@pasale.com",
    phone_no: "+977-9821234567",
    position: "Inventory Assistant",
    salary: "24000",
    status: { name: "Active" },
    department: "Inventory",
    join_date: "2023-09-18",
  },
];
const DEPT_COLORS = {
  Operations: { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  Sales: { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  Inventory: { bg: "#fefce8", text: "#a16207", dot: "#eab308" },
  Finance: { bg: "#fdf2f8", text: "#9d174d", dot: "#ec4899" },
  HR: { bg: "#f5f3ff", text: "#6d28d9", dot: "#8b5cf6" },
  default: { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" },
};

const STATUS_COLORS = {
  Active: { bg: "#f0fdf4", text: "#16a34a" },
  "On Leave": { bg: "#fffbeb", text: "#d97706" },
  Inactive: { bg: "#fef2f2", text: "#dc2626" },
};

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#22c55e", "#f59e0b", "#6366f1", "#06b6d4", "#10b981"];
const avatarGrad = (id) => AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
  calendar: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  close: "M18 6L6 18 M6 6l12 12",
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  check: "M20 6L9 17l-5-5",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  schedule: "M8 6h13 M8 12h13 M8 18h4 M3 6h.01 M3 12h.01 M3 18h.01",
  warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#fee2e2" : t.type === "warning" ? "#fef3c7" : "#f0fdf4",
          border: `1px solid ${t.type === "error" ? "#fca5a5" : t.type === "warning" ? "#fcd34d" : "#bbf7d0"}`,
          color: t.type === "error" ? "#991b1b" : t.type === "warning" ? "#92400e" : "#166534",
          padding: "11px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, fontWeight: 500, boxShadow: "0 2px 12px rgba(0,0,0,.08)", minWidth: 260,
        }}>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: 0 }}>
            <Icon d={ICONS.close} size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
      border: "1px solid #f1f5f9",
    }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
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
      background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9",
      overflow: "hidden", transition: "box-shadow .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.07)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ padding: "16px 18px 14px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: avatarGrad(emp.id),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 600, fontSize: 13, flexShrink: 0,
            }}>
              {getInitials(emp.name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{emp.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{emp.position}</div>
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
            background: statusColor.bg, color: statusColor.text, whiteSpace: "nowrap",
          }}>
            {statusName}
          </span>
        </div>

        {/* Info rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon d={ICONS.mail} size={12} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon d={ICONS.phone} size={12} />
            {emp.phone_no}
          </div>
          {deptName && (
            <div style={{ marginTop: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                background: deptColor.bg, color: deptColor.text,
              }}>
                <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: deptColor.dot, marginRight: 4, verticalAlign: "middle" }} />
                {deptName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ borderTop: "1px solid #f8fafc", display: "flex" }}>
        <button onClick={() => onView(emp)} style={cardBtn("#3b82f6", false)}>View</button>
        <button onClick={() => onEdit(emp)} style={cardBtn("#64748b", true)}>Edit</button>
        <button onClick={() => onDelete(emp)} style={cardBtn("#ef4444", true)}>Remove</button>
      </div>
    </div>
  );
}

const cardBtn = (color, border) => ({
  flex: 1, padding: "9px 0", background: "none", border: "none",
  borderLeft: border ? "1px solid #f8fafc" : "none",
  cursor: "pointer", fontSize: 12, color, fontWeight: 600,
});

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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: avatarGrad(emp.id),
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 600, fontSize: 12, flexShrink: 0,
          }}>{getInitials(emp.name)}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{emp.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{emp.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{emp.position}</td>
      <td style={{ padding: "14px 16px" }}>
        {deptName && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: deptColor.bg, color: deptColor.text }}>
            {deptName}
          </span>
        )}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{emp.phone_no}</td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
        NPR {emp.salary ? Number(emp.salary).toLocaleString() : "—"}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: statusColor.bg, color: statusColor.text }}>
          {statusName}
        </span>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onView(emp)} style={rowBtn("#3b82f6")} title="View"><Icon d={ICONS.users} size={13} /></button>
          <button onClick={() => onEdit(emp)} style={rowBtn("#64748b")} title="Edit"><Icon d={ICONS.edit} size={13} /></button>
          <button onClick={() => onDelete(emp)} style={rowBtn("#ef4444")} title="Delete"><Icon d={ICONS.trash} size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

const rowBtn = (color) => ({
  background: "none", border: `1px solid ${color}25`, padding: "5px 8px", borderRadius: 6,
  cursor: "pointer", color, display: "flex", alignItems: "center", transition: "background .15s",
});

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "text", options, required, placeholder }) {
  const base = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: "1px solid #e2e8f0", outline: "none", background: "#f8fafc",
    boxSizing: "border-box", fontFamily: "inherit", color: "#0f172a",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} style={base}
          onFocus={e => e.target.style.borderColor = "#3b82f6"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        >
          <option value="">— Select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder || label} style={base} required={required}
          onFocus={e => e.target.style.borderColor = "#3b82f6"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
      )}
    </div>
  );
}

// ─── DRAWER: ADD / EDIT EMPLOYEE ──────────────────────────────────────────────
const EMPTY_FORM = { name: "", email: "", phone_no: "", position: "", salary: "", department: "", status: "Active" };

function EmployeeDrawer({ open, onClose, employee, onSave, loading, options }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [employeeSkills, setEmployeeSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [newSkillForm, setNewSkillForm] = useState({ skill: "", proficiency_level: "Beginner" });
  const [skillsLoading, setSkillsLoading] = useState(false);
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
      setEmployeeSkills([]);
    }

    if (employee && employee.id && open) {
      setSkillsLoading(true);
      Promise.all([api.getSkills(), api.getEmployeeSkills(employee.id)])
        .then(([resSkills, resEmpSkills]) => {
          setAllSkills(resSkills.data || []);
          setEmployeeSkills(resEmpSkills.data || []);
        })
        .finally(() => setSkillsLoading(false));
    }
  }, [employee, open]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = () => onSave(form);

  const handleAddSkill = async () => {
    if (!newSkillForm.skill) return;
    try {
      await api.assignEmployeeSkill(employee.id, newSkillForm);
      const res = await api.getEmployeeSkills(employee.id);
      setEmployeeSkills(res.data || []);
      setNewSkillForm({ skill: "", proficiency_level: "Beginner" });
    } catch {}
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await api.removeEmployeeSkill(employee.id, skillId);
      const res = await api.getEmployeeSkills(employee.id);
      setEmployeeSkills(res.data || []);
    } catch {}
  };

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 200, backdropFilter: "blur(2px)" }} />}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: 420, maxWidth: "100vw",
        background: "#fff", zIndex: 201, boxShadow: "-4px 0 32px rgba(0,0,0,.1)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{employee ? "Edit Employee" : "Add Employee"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{employee ? `Updating ${employee.name}` : "Fill in the details below"}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f8fafc", border: "none", borderRadius: 7, padding: 7, cursor: "pointer", color: "#64748b" }}>
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Priya Sharma" />
          <Field label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" required placeholder="name@company.com" />
          <Field label="Phone Number" name="phone_no" value={form.phone_no} onChange={handleChange} required placeholder="+977-9XXXXXXXX" />
          <Field label="Position / Title" name="position" value={form.position} onChange={handleChange} required placeholder="e.g. Store Manager" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Department" name="department" value={form.department} onChange={handleChange}
              options={options?.departments?.length ? options.departments : ["Operations", "Sales", "Inventory", "Finance", "HR"]} />
            <Field label="Salary (NPR)" name="salary" value={form.salary} onChange={handleChange} type="number" placeholder="25000" />
          </div>
          <Field label="Status" name="status" value={form.status} onChange={handleChange} options={["Active", "On Leave", "Inactive"]} />
          
          {employee && employee.id && (
            <div style={{ marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Skills & Proficiency</div>
              {skillsLoading ? (
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Loading skills...</div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {employeeSkills.map(es => (
                      <div key={es.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{es.skill_name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{es.proficiency_level}</div>
                        </div>
                        <button onClick={() => handleRemoveSkill(es.skill.id || es.skill)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>
                          <Icon d={ICONS.close} size={12} />
                        </button>
                      </div>
                    ))}
                    {employeeSkills.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>No skills assigned yet.</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={newSkillForm.skill} onChange={e => setNewSkillForm({...newSkillForm, skill: e.target.value})} style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }}>
                      <option value="">Select skill...</option>
                      {allSkills.filter(s => !employeeSkills.find(es => (es.skill.id || es.skill) === s.id)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select value={newSkillForm.proficiency_level} onChange={e => setNewSkillForm({...newSkillForm, proficiency_level: e.target.value})} style={{ width: 100, padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <button onClick={handleAddSkill} disabled={!newSkillForm.skill} style={{ padding: "6px 10px", background: newSkillForm.skill ? "#3b82f6" : "#cbd5e1", color: "#fff", border: "none", borderRadius: 6, cursor: newSkillForm.skill ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}>Add</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: "10px 0", borderRadius: 9, border: "none",
            background: loading ? "#93c5fd" : "#3b82f6",
            cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff",
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", width: 360, maxWidth: "100%", boxShadow: "0 8px 40px rgba(0,0,0,.15)", border: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Remove employee?</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          This will permanently remove <strong>{emp?.name}</strong>. This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "#ef4444", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Removing…" : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPLOYEE DETAIL PANEL (clean, white, simple) ─────────────────────────────
function EmployeeDetail({ emp, onClose, onEdit }) {
  const statusName = typeof emp?.status === "string" ? emp.status : emp?.status?.name || "Active";
  const deptName = typeof emp?.department === "string" ? emp.department : emp?.department?.name || emp?.department;
  const statusColor = STATUS_COLORS[statusName] || STATUS_COLORS.Active;
  if (!emp) return null;

  const details = [
    { icon: ICONS.mail, label: "Email", value: emp.email },
    { icon: ICONS.phone, label: "Phone", value: emp.phone_no },
    { icon: ICONS.briefcase, label: "Department", value: deptName || "—" },
    { icon: ICONS.dollar, label: "Salary", value: emp.salary ? `NPR ${Number(emp.salary).toLocaleString()}` : "—" },
    { icon: ICONS.calendar, label: "Joined", value: emp.join_date || "—" },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)", padding: 20 }}
    >
      <div style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", border: "1px solid #f1f5f9", boxShadow: "0 8px 40px rgba(0,0,0,.12)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Employee details</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px 4px" }}>
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Profile row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 13, background: avatarGrad(emp.id),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 17, flexShrink: 0,
            }}>
              {getInitials(emp.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{emp.name}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{emp.position}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
              background: statusColor.bg, color: statusColor.text, whiteSpace: "nowrap",
            }}>
              {statusName}
            </span>
          </div>

          {/* Details table */}
          <div style={{ border: "1px solid #f1f5f9", borderRadius: 10, overflow: "hidden" }}>
            {details.map(({ icon, label, value }, i) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 14px", gap: 12,
                borderTop: i > 0 ? "1px solid #f1f5f9" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", flexShrink: 0 }}>
                  <Icon d={icon} size={13} />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Edit button */}
          <button
            onClick={() => { onClose(); onEdit(emp); }}
            style={{ marginTop: 14, width: "100%", padding: "11px 0", borderRadius: 9, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Edit profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE MODAL (WSM VERSION) ─────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  availability: 30,
  skill_match: 25,
  fairness: 20,
  skill_level: 15,
  cost: 10,
};

const FACTOR_COLORS = {
  availability: "#185FA5",
  skill_match:  "#3B6D11",
  fairness:     "#7F77DD",
  skill_level:  "#BA7517",
  cost:         "#A32D2D",
};

function WSMScheduleModal({ employees, onClose, loading, setLoading, toast }) {
  const [step, setStep] = useState("weights");   // weights → preview → result
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [unscheduledShifts, setUnscheduledShifts] = useState([]);
  const [scheduleResult, setScheduleResult] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [applying, setApplying] = useState(false);
  const [manualOverrides, setManualOverrides] = useState({});

  // Total weight tracker
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  // Fetch unscheduled shifts on open
  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setFetching(true);
    try {
      const data = await api.getUnscheduledShifts();
      const shifts = data.data || [];
      setUnscheduledShifts(shifts.filter(s => !s.is_scheduled));
    } catch (e) {
      toast("Could not load shifts. Check backend.", "error");
    } finally {
      setFetching(false);
    }
  };

  const handlePreview = async () => {
    if (!unscheduledShifts.length) {
      toast("No unscheduled shifts found.", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await api.runWSMScheduler({
        shift_ids: unscheduledShifts.map(s => s.id),
        apply_schedule: false,
        weights: {
          availability: weights.availability / 100,
          skill_match:  weights.skill_match / 100,
          fairness:     weights.fairness / 100,
          skill_level:  weights.skill_level / 100,
          cost:         weights.cost / 100,
        },
      });
      setScheduleResult(result);
      setStep("preview");
    } catch (e) {
      toast("Scheduler failed. Check backend logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const result = await api.runWSMScheduler({
        shift_ids: unscheduledShifts.map(s => s.id),
        apply_schedule: true,
        weights: {
          availability: weights.availability / 100,
          skill_match:  weights.skill_match / 100,
          fairness:     weights.fairness / 100,
          skill_level:  weights.skill_level / 100,
          cost:         weights.cost / 100,
        },
      });
      setScheduleResult(result);
      setStep("result");
      toast("Schedule applied successfully!");
    } catch {
      toast("Failed to apply schedule.", "error");
    } finally {
      setApplying(false);
    }
  };

  const handleManualAssign = async (shiftId, employeeId, employeeName) => {
    try {
      await api.manualAssign(shiftId, employeeId);
      setManualOverrides(p => ({ ...p, [shiftId]: employeeName }));
      toast(`Manually assigned ${employeeName}`);
    } catch {
      toast("Manual assignment failed.", "error");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: 560, maxHeight: "90vh",
        overflow: "auto", border: "1px solid #f1f5f9",
        boxShadow: "0 8px 40px rgba(0,0,0,.12)",
      }}>

        {/* Header */}
        <div style={{
          padding: "18px 20px 16px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              WSM Auto-Scheduler
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {step === "weights" && "Set factor weights → preview → apply"}
              {step === "preview" && "Review suggestions — override if needed"}
              {step === "result"  && "Schedule applied to database"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", borderRadius: 7,
            padding: 6, cursor: "pointer", color: "#94a3b8",
          }}>
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>

        <div style={{ padding: "18px 20px" }}>

          {/* ── STEP 1: WEIGHTS ── */}
          {step === "weights" && (
            <>
              {/* Info box */}
              <div style={{
                background: "#eff6ff", borderRadius: 9, padding: "12px 14px",
                marginBottom: 18, fontSize: 12, color: "#1d4ed8", lineHeight: 1.6,
              }}>
                <strong>How WSM works:</strong> Each employee is scored across
                5 factors. Adjust weights to match your business priority.
                Weights must total <strong>100%</strong>.
              </div>

              {/* Weight sliders */}
              {Object.entries(weights).map(([key, val]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 4,
                  }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>
                      {key.replace("_", " ")}
                    </label>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: FACTOR_COLORS[key],
                      background: "#f8fafc", padding: "2px 10px",
                      borderRadius: 20, border: "1px solid #e2e8f0",
                    }}>
                      {val}%
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5} value={val}
                    onChange={e => setWeights(p => ({ ...p, [key]: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: FACTOR_COLORS[key] }}
                  />
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {key === "availability" && "Hard gate — employee must be free. Higher = stricter priority."}
                    {key === "skill_match"  && "Employee must have the required POS skill for the shift."}
                    {key === "fairness"     && "Spread shifts evenly. Employees with fewer shifts score higher."}
                    {key === "skill_level"  && "Advanced proficiency scores higher than Beginner."}
                    {key === "cost"         && "Lower salary employees score higher. Reduces wage cost."}
                  </div>
                </div>
              ))}

              {/* Weight total indicator */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 9, marginBottom: 16,
                background: isWeightValid ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${isWeightValid ? "#bbf7d0" : "#fca5a5"}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: isWeightValid ? "#166534" : "#991b1b" }}>
                  Total weight
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: isWeightValid ? "#166534" : "#991b1b" }}>
                  {totalWeight}%
                  {isWeightValid ? " ✓" : " — must equal 100%"}
                </span>
              </div>

              {/* Unscheduled shifts count */}
              <div style={{
                padding: "10px 14px", borderRadius: 9, marginBottom: 16,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  {fetching ? "Loading shifts…" : `${unscheduledShifts.length} unscheduled shift(s) found`}
                </span>
                <button onClick={fetchShifts} style={{
                  fontSize: 12, padding: "4px 10px", borderRadius: 6,
                  border: "1px solid #e2e8f0", background: "#fff",
                  cursor: "pointer", color: "#475569",
                }}>
                  Refresh
                </button>
              </div>

              <button
                onClick={handlePreview}
                disabled={!isWeightValid || loading || fetching || !unscheduledShifts.length}
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 9, border: "none",
                  background: isWeightValid ? "#3b82f6" : "#e2e8f0",
                  color: isWeightValid ? "#fff" : "#94a3b8",
                  fontWeight: 700, fontSize: 14,
                  cursor: isWeightValid ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Running…" : "Preview Schedule →"}
              </button>
            </>
          )}

          {/* ── STEP 2: PREVIEW ── */}
          {step === "preview" && scheduleResult && (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  ["Scheduled",   scheduleResult.scheduling_result?.scheduled_count,   "#166534", "#f0fdf4"],
                  ["Unscheduled", scheduleResult.scheduling_result?.unscheduled_count,  "#991b1b", "#fef2f2"],
                  ["Success",     scheduleResult.scheduling_result?.success_rate,       "#1d4ed8", "#eff6ff"],
                ].map(([label, val, color, bg]) => (
                  <div key={label} style={{ background: bg, borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{val ?? "—"}</div>
                  </div>
                ))}
              </div>

              {/* Shift ranking cards */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" }}>
                Shift assignments — click to see full rankings
              </div>

              {scheduleResult.schedule_summary?.employee_summary?.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "#ef4444", fontSize: 13 }}>
                  No employees could be assigned. Check skills and availability in the backend.
                </div>
              )}

              {unscheduledShifts.map(shift => {
                const assigned = manualOverrides[shift.id] ||
                  scheduleResult.scheduling_result?.assignments?.find(a => a.shift_id === shift.id)?.assigned;
                const score = scheduleResult.scheduling_result?.assignments?.find(a => a.shift_id === shift.id)?.score;
                const rankings = scheduleResult.scheduling_result?.assignments?.find(a => a.shift_id === shift.id)?.rankings || [];
                const isOpen = selectedShift === shift.id;

                return (
                  <div key={shift.id} style={{
                    border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 8, overflow: "hidden",
                    borderLeft: assigned ? "3px solid #22c55e" : "3px solid #ef4444",
                  }}>
                    {/* Shift header */}
                    <div
                      onClick={() => setSelectedShift(isOpen ? null : shift.id)}
                      style={{
                        padding: "10px 14px", display: "flex", alignItems: "center",
                        justifyContent: "space-between", cursor: "pointer",
                        background: isOpen ? "#f8fafc" : "#fff",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                          {shift.shift_date} · {shift.start_time?.slice(0,5)}–{shift.end_time?.slice(0,5)}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          Required: {shift.required_skill_name || "Any"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {assigned ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#166534", background: "#f0fdf4", padding: "3px 10px", borderRadius: 20 }}>
                            {assigned} {score ? `· ${Number(score).toFixed(3)}` : ""}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "#fef2f2", padding: "3px 10px", borderRadius: 20 }}>
                            Unassigned
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {/* Rankings dropdown */}
                    {isOpen && (
                      <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 14px" }}>
                        {rankings.length === 0 ? (
                          <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>
                            No eligible employees — check skill assignments
                          </div>
                        ) : (
                          rankings.map((r, i) => (
                            <div key={r.employee} style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 0", borderBottom: i < rankings.length - 1 ? "1px solid #f8fafc" : "none",
                            }}>
                              <span style={{ fontSize: 12, color: "#94a3b8", width: 18 }}>{i + 1}</span>
                              <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: AVATAR_COLORS[(i) % AVATAR_COLORS.length],
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontWeight: 600, fontSize: 11, flexShrink: 0,
                              }}>
                                {getInitials(r.employee)}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: "#0f172a" }}>
                                {r.employee}
                              </span>
                              {/* Score bar */}
                              <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                                <div style={{
                                  height: 4, borderRadius: 2, background: "#3b82f6",
                                  width: `${Math.round(r.score * 100)}%`,
                                }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", width: 44, textAlign: "right" }}>
                                {Number(r.score).toFixed(3)}
                              </span>
                              <button
                                onClick={() => handleManualAssign(shift.id, r.employee_id, r.employee)}
                                style={{
                                  fontSize: 11, padding: "4px 10px", borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                  background: manualOverrides[shift.id] === r.employee || (i === 0 && assigned === r.employee)
                                    ? "#3b82f6" : "#fff",
                                  color: manualOverrides[shift.id] === r.employee || (i === 0 && assigned === r.employee)
                                    ? "#fff" : "#475569",
                                  cursor: "pointer",
                                }}
                              >
                                {manualOverrides[shift.id] === r.employee || (i === 0 && assigned === r.employee)
                                  ? "Assigned" : "Assign"}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => setStep("weights")}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 9,
                    border: "1px solid #e2e8f0", background: "#fff",
                    cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569",
                  }}
                >
                  ← Adjust weights
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  style={{
                    flex: 2, padding: "10px 0", borderRadius: 9, border: "none",
                    background: applying ? "#93c5fd" : "#3b82f6",
                    cursor: applying ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: 13, color: "#fff",
                  }}
                >
                  {applying ? "Applying…" : "Confirm & Apply Schedule"}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: RESULT ── */}
          {step === "result" && scheduleResult && (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Schedule Applied</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  Saved to database — employees can view their shifts
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["Scheduled",   scheduleResult.scheduling_result?.scheduled_count],
                  ["Unscheduled", scheduleResult.scheduling_result?.unscheduled_count],
                  ["Total Shifts", scheduleResult.scheduling_result?.total_shifts],
                  ["Success Rate", scheduleResult.scheduling_result?.success_rate],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", borderRadius: 9, padding: "11px 13px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{v ?? "—"}</div>
                  </div>
                ))}
              </div>

              {scheduleResult.schedule_summary?.employee_summary?.map(e => (
                <div key={e.employee} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 13px", background: "#f8fafc", borderRadius: 9, marginBottom: 5,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: "#3b82f6", display: "flex", alignItems: "center",
                      justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700,
                    }}>
                      {getInitials(e.employee)}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{e.employee}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{e.shifts_assigned} shift(s)</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>avg score: {e.avg_score}</div>
                  </div>
                </div>
              ))}

              <button onClick={onClose} style={{
                marginTop: 14, width: "100%", padding: "11px 0", borderRadius: 9,
                border: "none", background: "#3b82f6", color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillsTab({ toast }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await api.getSkills();
      setSkills(res.data || []);
    } catch {
      toast("Failed to load skills", "error");
    }
    setLoading(false);
  };

  useEffect(() => { loadSkills(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return toast("Skill name is required", "warning");
    try {
      if (editingSkill) {
        await api.updateSkill(editingSkill.id, form);
        toast("Skill updated");
      } else {
        await api.createSkill(form);
        toast("Skill created");
      }
      setShowModal(false);
      loadSkills();
    } catch (e) {
      toast(e.name?.[0] || "Failed to save skill", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.deleteSkill(id);
      toast("Skill deleted");
      loadSkills();
    } catch {
      toast("Failed to delete skill", "error");
    }
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Skills Directory</h2>
        <button onClick={() => { setEditingSkill(null); setForm({name:"", description:""}); setShowModal(true); }} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Skill</button>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8" }}>Loading...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Skill Name</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Description</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600, width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{s.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{s.description || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditingSkill(s); setForm({name: s.name, description: s.description||""}); setShowModal(true); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#3b82f6" }}><Icon d={ICONS.edit} size={14}/></button>
                      <button onClick={() => handleDelete(s.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}><Icon d={ICONS.trash} size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {skills.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No skills found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 400, borderRadius: 12, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>{editingSkill ? "Edit Skill" : "New Skill"}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, minHeight: 80, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftsTab({ toast }) {
  const [shifts, setShifts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [form, setForm] = useState({ shift_date: "", start_time: "", end_time: "", required_skill: "", required_employees: 1 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, skillsRes] = await Promise.all([api.getShiftsCRUD(), api.getSkills()]);
      setShifts(shiftsRes.data || []);
      setSkills(skillsRes.data || []);
    } catch {
      toast("Failed to load shifts/skills", "error");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.shift_date || !form.start_time || !form.end_time) return toast("Date and times are required", "warning");
    const payload = { ...form, required_skill: form.required_skill || null };
    try {
      if (editingShift) {
        await api.updateShift(editingShift.id, payload);
        toast("Shift updated");
      } else {
        await api.createShift(payload);
        toast("Shift created");
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      toast("Failed to save shift", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.deleteShift(id);
      toast("Shift deleted");
      loadData();
    } catch {
      toast("Failed to delete shift", "error");
    }
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Shift Management</h2>
        <button onClick={() => { setEditingShift(null); setForm({shift_date:"", start_time:"", end_time:"", required_skill:"", required_employees:1}); setShowModal(true); }} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Shift</button>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8" }}>Loading...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Time</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Req. Skill</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Req. Staff</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Assigned To</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 600, width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{s.shift_date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>
                    {s.required_skill_name ? <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{s.required_skill_name}</span> : "-"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{s.required_employees}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{s.assigned_employee_name || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{ color: s.is_scheduled ? "#16a34a" : "#ca8a04", fontWeight: 600 }}>{s.is_scheduled ? "Scheduled" : "Unscheduled"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditingShift(s); setForm({shift_date: s.shift_date, start_time: s.start_time, end_time: s.end_time, required_skill: s.required_skill||"", required_employees: s.required_employees}); setShowModal(true); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#3b82f6" }}><Icon d={ICONS.edit} size={14}/></button>
                      <button onClick={() => handleDelete(s.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}><Icon d={ICONS.trash} size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No shifts found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 400, borderRadius: 12, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>{editingShift ? "Edit Shift" : "New Shift"}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Date</label>
              <input type="date" value={form.shift_date} onChange={e => setForm({...form, shift_date: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>End Time</label>
                <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Required Skill (Optional)</label>
              <select value={form.required_skill} onChange={e => setForm({...form, required_skill: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                <option value="">None</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Required Employees</label>
              <input type="number" min="1" value={form.required_employees} onChange={e => setForm({...form, required_employees: Number(e.target.value)})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
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
  const [viewMode, setViewMode] = useState("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [activeTab, setActiveTab] = useState("employees");
  const { toasts, add: toast, remove: removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      if (Array.isArray(data)) { setEmployees(data); setUseMock(false); }
      else throw new Error("Non-array response");
    } catch {
      setEmployees(MOCK_EMPLOYEES);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
    try {
      const depts = await api.getDepartments();
      if (Array.isArray(depts)) setAvailableDepts(depts.map(d => d.name));
    } catch { }
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

  const DEFAULT_DEPTS = ["Operations", "Sales", "Inventory", "Finance", "HR"];

  const departments = [...new Set([
    ...DEFAULT_DEPTS,
    ...availableDepts,
    ...employees.map(e => typeof e.department === "string" ? e.department : e.department?.name || e.department).filter(Boolean),
  ])];

  const stats = {
    total: employees.length,
    active: employees.filter(e => { const s = typeof e.status === "string" ? e.status : e.status?.name || "Active"; return s === "Active"; }).length,
    onLeave: employees.filter(e => { const s = typeof e.status === "string" ? e.status : e.status?.name || "Active"; return s === "On Leave"; }).length,
    avgSalary: employees.length ? Math.round(employees.reduce((s, e) => s + (Number(e.salary) || 0), 0) / employees.length) : 0,
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (useMock) {
        if (editTarget) {
          setEmployees(p => p.map(e => e.id === editTarget.id ? { ...e, ...form, status: { name: form.status } } : e));
          toast("Employee updated!");
        } else {
          setEmployees(p => [...p, { ...form, id: Date.now(), status: { name: form.status } }]);
          toast("Employee added!");
        }
        setDrawerOpen(false); setEditTarget(null); return;
      }
      if (editTarget) { await api.updateEmployee(editTarget.id, form); toast("Employee updated!"); }
      else { await api.createEmployee(form); toast("Employee added!"); }
      await load(); setDrawerOpen(false); setEditTarget(null);
    } catch (e) {
      let msg = "Something went wrong.";
      if (typeof e === "object" && e !== null) {
        const firstKey = Object.keys(e)[0];
        if (firstKey) { const err = e[firstKey]; msg = `${firstKey}: ${Array.isArray(err) ? err[0] : err}`; }
      }
      toast(msg, "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (useMock) { setEmployees(p => p.filter(e => e.id !== deleteTarget.id)); toast(`${deleteTarget.name} removed.`); setDeleteTarget(null); return; }
      await api.deleteEmployee(deleteTarget.id);
      toast(`${deleteTarget.name} removed.`);
      await load(); setDeleteTarget(null);
    } catch { toast("Delete failed.", "error"); }
    finally { setDeleting(false); }
  };

  const handleSchedule = async (payload) => {
    setScheduling(true);
    try { const r = await api.runScheduler(payload); setScheduling(false); return r; }
    catch { toast("Scheduler failed.", "error"); setScheduling(false); return null; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .emp-card { animation: fadeUp .25s ease both; }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Employee Management</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            {useMock ? "Demo mode — connect backend to see live data" : `${stats.total} team members · ${stats.active} active`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowScheduler(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#475569" }}>
            <Icon d={ICONS.schedule} size={13} /> Auto-Schedule
          </button>
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff" }}>
            <Icon d={ICONS.plus} size={13} /> Add Employee
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", gap: 24 }}>
        {[
          { id: "employees", label: "Directory" },
          { id: "skills", label: "Skills" },
          { id: "shifts", label: "Shifts" }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: "none", border: "none", padding: "12px 0", cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: activeTab === t.id ? "#3b82f6" : "#64748b",
            borderBottom: activeTab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
            transition: "all .2s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "employees" && (
        <div style={{ padding: "20px 24px" }}>
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard label="Total" value={stats.total} sub={`${departments.length} departments`} />
          <StatCard label="Active" value={stats.active} sub={`${Math.round((stats.active / (stats.total || 1)) * 100)}% of team`} />
          <StatCard label="On Leave" value={stats.onLeave} sub="Currently away" />
          <StatCard label="Avg. Salary" value={`₨${stats.avgSalary.toLocaleString()}`} sub="Per month" />
        </div>

        {/* TOOLBAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
              <Icon d={ICONS.search} size={13} />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, role…"
              style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }} />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", color: deptFilter ? "#0f172a" : "#94a3b8" }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", color: statusFilter ? "#0f172a" : "#94a3b8" }}>
            <option value="">All Status</option>
            {["Active", "On Leave", "Inactive"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
            {[["grid", ICONS.grid], ["list", ICONS.list]].map(([mode, ic]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "6px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                background: viewMode === mode ? "#fff" : "transparent",
                color: viewMode === mode ? "#3b82f6" : "#94a3b8",
                boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}>
                <Icon d={ic} size={14} />
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* EMPLOYEE LIST */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 180, background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No employees found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filters</div>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {filtered.map((emp, i) => (
              <div key={emp.id} className="emp-card" style={{ animationDelay: `${i * 0.03}s` }}>
                <EmployeeCard emp={emp}
                  onEdit={e => { setEditTarget(e); setDrawerOpen(true); }}
                  onDelete={setDeleteTarget}
                  onView={setViewTarget}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Employee", "Position", "Department", "Phone", "Salary", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
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
      )}

      {activeTab === "skills" && <SkillsTab toast={toast} />}
      {activeTab === "shifts" && <ShiftsTab toast={toast} />}


      {/* MODALS / DRAWERS */}
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
        <WSMScheduleModal
          employees={employees}
          onClose={() => setShowScheduler(false)}
          loading={scheduling}
          setLoading={setScheduling}
          toast={toast}
        />
      )}
    </div>
  );
}