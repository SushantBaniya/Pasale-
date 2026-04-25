import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000/api";

const getBusinessId = () => {
  if (typeof window === "undefined") return 1;
  return Number(localStorage.getItem("business_id")) || 1;
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
  getDepartments: () =>
    fetch(`${API_BASE}/departments/b${getBusinessId()}/`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch departments"; }
      return r.json();
    }),
  createDepartment: (name) =>
    fetch(`${API_BASE}/departments/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
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
    const id = Date.now();
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
interface FieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (e: any) => void;
  type?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

function Field({ label, name, value, onChange, type = "text", options, required, placeholder }: FieldProps) {
  const base = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: "1px solid #e2e8f0", outline: "none", background: "#f8fafc",
    boxSizing: "border-box" as any, fontFamily: "inherit", color: "#0f172a",
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

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = () => onSave(form);

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

// ─── SCHEDULE MODAL ───────────────────────────────────────────────────────────
function ScheduleModal({ employees, onClose, onRun, loading }) {
  const [shiftIds, setShiftIds] = useState("");
  const [apply, setApply] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    const ids = shiftIds.split(",").map(s => parseInt(s.trim())).filter(Boolean);
    if (!ids.length) return;
    const r = await onRun({ business_id: getBusinessId(), shift_ids: ids, apply_schedule: apply });
    setResult(r);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 480, maxHeight: "88vh", overflow: "auto", border: "1px solid #f1f5f9", boxShadow: "0 8px 40px rgba(0,0,0,.12)" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>WSM Auto-Scheduler</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Assign best-fit employees to shifts</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", borderRadius: 7, padding: 6, cursor: "pointer", color: "#94a3b8" }}>
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {!result ? (
            <>
              <div style={{ background: "#eff6ff", borderRadius: 9, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#1d4ed8", lineHeight: 1.6 }}>
                <strong>How it works:</strong> The WSM algorithm ranks employees by availability (30%), skill match (25%), fairness (20%), skill level (15%), and cost (10%).
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Shift IDs (comma-separated)" name="shift_ids" value={shiftIds} onChange={e => setShiftIds(e.target.value)} placeholder="1, 2, 5, 8" />
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", fontWeight: 500, color: "#374151" }}>
                  <div style={{ width: 38, height: 20, borderRadius: 10, background: apply ? "#3b82f6" : "#e2e8f0", position: "relative", transition: "background .2s", cursor: "pointer", flexShrink: 0 }}
                    onClick={() => setApply(p => !p)}>
                    <div style={{ position: "absolute", top: 2, left: apply ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
                  </div>
                  Apply assignments to database immediately
                </label>
              </div>
              <button onClick={handleRun} disabled={loading} style={{
                marginTop: 18, width: "100%", padding: "11px 0", borderRadius: 9, border: "none",
                background: loading ? "#93c5fd" : "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Running…" : "Run WSM Scheduler"}
              </button>
            </>
          ) : (
            <div>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Schedule Generated</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  ["Scheduled", result.scheduling_result?.scheduled_count ?? "—"],
                  ["Unscheduled", result.scheduling_result?.unscheduled_count ?? "—"],
                  ["Total Shifts", result.scheduling_result?.total_shifts ?? "—"],
                  ["Success Rate", result.scheduling_result?.success_rate ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", borderRadius: 9, padding: "11px 13px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{v}</div>
                  </div>
                ))}
              </div>
              {result.schedule_summary?.employee_summary?.map(e => (
                <div key={e.employee} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", background: "#f8fafc", borderRadius: 9, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{e.employee}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{e.shifts_assigned} shift{e.shifts_assigned !== 1 ? "s" : ""} · avg {e.avg_score}</span>
                </div>
              ))}
              <button onClick={() => setResult(null)} style={{ marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}>
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
  const [viewMode, setViewMode] = useState("grid");
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
        <ScheduleModal employees={employees} onClose={() => setShowScheduler(false)}
          onRun={handleSchedule} loading={scheduling} />
      )}
    </div>
  );
}