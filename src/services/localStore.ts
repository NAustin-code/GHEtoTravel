import { ApiClientError } from "./httpClient";
import type {
  ApprovalDecision,
  Declaration,
  Dropdowns,
  StatusType,
  SystemConfig,
  UploadedFile,
  User,
  WorkflowInstance,
  WorkflowRule,
  WorkflowStep,
} from "@/types/declaration";

// ─── Local store (no backend) ─────────────────────────────────────────────────
// All app data persists in localStorage under the `trp.v1.` namespace and is
// seeded with demo data on first access. This is a client-side stand-in for
// the REST API — not production-grade security (passwords are obfuscated with
// a non-cryptographic hash, see hashPassword).

const PREFIX = "trp.v1.";
const SEED_VERSION = 5;
const VERSION_KEY = `${PREFIX}seedVersion`;
const DEFAULT_PASSWORD = "password";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Non-cryptographic demo hash (cyrb53) — obfuscation only, not security.
function hashPassword(password: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const salted = `trp::${password}`;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `c53:${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)}`;
}

function notFound(what: string, id: string): ApiClientError {
  return new ApiClientError(404, `${what} ${id} not found`);
}

// ─── Seed data ────────────────────────────────────────────────────────────────

interface StoredUser extends User {
  passwordHash: string;
}

function seedUsers(): StoredUser[] {
  const pw = hashPassword(DEFAULT_PASSWORD);
  return [
    { id: "user-1", name: "Nomvula Dlamini", email: "nomvula@hb.co.za", passwordHash: pw, role: "teamMember", teamMemberNumber: "HB-10001", department: "Marketing", position: "Brand Manager", lineManager: "user-2", organizationId: "org-hb" },
    { id: "user-2", name: "Sipho Nkosi", email: "sipho@hb.co.za", passwordHash: pw, role: "approver", teamMemberNumber: "HB-20001", department: "Operations", position: "Line Manager", lineManager: "user-5", organizationId: "org-hb" },
    { id: "user-3", name: "Kabelo Molefe", email: "kabelo@npn.co.za", passwordHash: pw, role: "teamMember", teamMemberNumber: "NPN-10001", department: "Sales", position: "Sales Associate", lineManager: "user-4", organizationId: "org-npn" },
    { id: "user-4", name: "James van Wyk", email: "james@npn.co.za", passwordHash: pw, role: "approver", teamMemberNumber: "NPN-20001", department: "Sales", position: "Line Manager", lineManager: "user-6", organizationId: "org-npn" },
    { id: "user-5", name: "Lindiwe Zulu", email: "lindiwe@hb.co.za", passwordHash: pw, role: "approver", teamMemberNumber: "HB-30001", department: "HR", position: "Head of HR", lineManager: null, organizationId: "org-hb" },
    { id: "user-6", name: "Aisha Patel", email: "aisha@npn.co.za", passwordHash: pw, role: "approver", teamMemberNumber: "NPN-30001", department: "HR", position: "Head of HR", lineManager: null, organizationId: "org-npn" },
    { id: "user-7", name: "Admin User", email: "admin@hb.co.za", passwordHash: pw, role: "admin", teamMemberNumber: "HB-00001", department: "Operations", position: "System Admin", lineManager: null, organizationId: "org-hb" },
  ];
}

function seedOrganizations() {
  return [
    { id: "org-hb", name: "Hollywoodbets Group", shortCode: "HB" },
    { id: "org-npn", name: "NPN", shortCode: "NPN" },
    { id: "org-hwf", name: "Hollywood Foundation NPC", shortCode: "HWF" },
    { id: "org-splash", name: "Splashout (Pty) Ltd", shortCode: "SPL" },
    { id: "org-betsoft", name: "Bet Software (Pty) Ltd", shortCode: "BSW" },
    { id: "org-race", name: "Race Coast Holding (Pty) Ltd", shortCode: "RCH" },
  ];
}

function seedConfig(): SystemConfig {
  return {
    highValueThreshold: 5000,
    mediumValueThreshold: 1000,
    slaEscalationDays: 7,
    maxDeclarationsPerCounterparty: 10,
    maximumValue: 100000,
    emailTemplate: "",
    notificationTemplates: "",
  };
}

function seedDropdowns(): Dropdowns {
  return {
    departments: ["Marketing", "Sales", "Finance", "HR", "Operations", "IT", "Compliance", "Events", "Retail Ops", "Contact Centre"],
    categories: ["Domestic", "International"],
    occasions: ["Business Trip", "Leisure", "Visiting", "Other"],
    receivedGiven: [],
    biddingProcess: [],
    publicOfficial: [],
    relationships: [],
    partyTypes: [],
  };
}

function seedApprovalOptions() {
  return [
    { id: "opt-return", value: "return", label: "Return - Team member to provide additional information." },
    { id: "opt-accept", value: "accept", label: "Approved - Team member travel request approved." },
    { id: "opt-org", value: "org", label: "Approved - Travel request approved and shared with the organisation pool." },
    { id: "opt-foundation", value: "foundation", label: "Approved - Travel request approved." },
    { id: "opt-decline", value: "decline", label: "Declined - Travel request declined." },
  ];
}

function seedWorkflowRules(): WorkflowRule[] {
  return [
    {
      id: "rule-1",
      name: "Standard travel (2-tier)",
      condition: "value < highValueThreshold",
      priority: 1,
      steps: [
        { order: 1, role: "lineManager", label: "Line Manager Review" },
        { order: 2, role: "hr", label: "HR Review" },
      ],
    },
    {
      id: "rule-2",
      name: "High-value travel (2-tier)",
      condition: "value >= highValueThreshold",
      priority: 2,
      steps: [
        { order: 1, role: "lineManager", label: "Line Manager Review" },
        { order: 2, role: "hr", label: "HR Review" },
      ],
    },
  ];
}

interface SeedDeclParams {
  id: string;
  employee: string;
  employeeId: string;
  teamMemberNumber: string;
  lineManager: string;
  approver: string;
  department: string;
  type: string;
  destination: string;
  value: number;
  submitted: string;
  status: StatusType;
  reason: string;
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  transportMode?: Declaration["transportMode"];
  travelers?: Declaration["travelers"];
  numberOfPeople?: number;
  position?: string;
  organizationId?: string;
}

function mkDecl(p: SeedDeclParams): Declaration {
  return {
    id: p.id,
    employee: p.employee,
    employeeId: p.employeeId,
    department: p.department,
    type: p.type,
    counterparty: p.destination,
    value: p.value,
    submitted: p.submitted,
    approver: p.approver,
    status: p.status,
    priority: p.value >= 5000 ? "High" : p.value >= 1000 ? "Medium" : "Low",
    description: p.reason,
    relationship: `${p.from} → ${p.to}`,
    teamMemberNumber: p.teamMemberNumber,
    lineManager: p.lineManager,
    position: p.position || "Team Member",
    receivedGiven: "",
    from: p.from,
    contactPerson: p.travelers?.[0]?.name || p.employee,
    biddingProcess: "",
    occasion: p.reason,
    date: p.departureDate,
    instances: String(p.numberOfPeople || 1),
    publicOfficial: "",
    organizationId: p.organizationId,
    destination: p.destination,
    departureDate: p.departureDate,
    returnDate: p.returnDate,
    travelType: (p.type === "International" ? "International" : "Domestic") as "Domestic" | "International",
    reason: p.reason,
    to: p.to,
    transportMode: p.transportMode || "Flight",
    transportDetails: "",
    seatPreference: "Aisle",
    firstTimeFlying: "No",
    accommodationRequired: false,
    accommodationDetails: "",
    enterTravellerDetails: false,
    travelers: p.travelers,
    numberOfPeople: p.numberOfPeople || 1,
  };
}

function step(
  order: number,
  role: "lineManager" | "hr",
  assignee: string,
  assigneeName: string,
  label: string,
  status: WorkflowStep["status"],
  extra?: Partial<WorkflowStep>,
): WorkflowStep {
  return {
    order, role, assignee, assigneeName, label, status,
    decision: null, notes: "", decidedAt: null, decidedById: null, decidedByName: null,
    ...extra,
  };
}

function seedDeclarations(): { declarations: Declaration[]; workflows: WorkflowInstance[] } {
  const declarations: Declaration[] = [
    mkDecl({ id: "TR-2024-0044", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Cape Town", value: 1200, submitted: "2024-11-02", status: "Pending", reason: "Client site visit", from: "Durban", to: "Cape Town", departureDate: "2024-11-20", returnDate: "2024-11-22", organizationId: "org-hb",
      travelers: [
        { id: "t-44-1", name: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", department: "Marketing", position: "Brand Manager", idDocument: "9001015800083", idDocumentType: "ID", email: "nomvula@hb.co.za", cellPhone: "0821234567", jobTitle: "Brand Manager", company: "Hollywoodbets Group", gender: "Female" },
      ] }),
    mkDecl({ id: "TR-2024-0045", employee: "Kabelo Molefe", employeeId: "user-3", teamMemberNumber: "NPN-10001", lineManager: "James van Wyk", approver: "James van Wyk", department: "Sales", type: "International", destination: "Windhoek", value: 8500, submitted: "2024-11-05", status: "Pending", reason: "Regional sales conference", from: "Johannesburg", to: "Windhoek", departureDate: "2024-11-25", returnDate: "2024-11-28", organizationId: "org-npn" }),
    mkDecl({ id: "TR-2024-0047", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Johannesburg", value: 900, submitted: "2024-11-08", status: "Pending", reason: "Brand activation", from: "Durban", to: "Johannesburg", departureDate: "2024-11-18", returnDate: "2024-11-19", organizationId: "org-hb" }),
    mkDecl({ id: "TR-2025-0009", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Durban", value: 1500, submitted: "2025-03-10", status: "Approved", reason: "Supplier workshop", from: "Pietermaritzburg", to: "Durban", departureDate: "2025-03-17", returnDate: "2025-03-18", organizationId: "org-hb" }),
    mkDecl({ id: "TR-2026-0001", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Cape Town", value: 2400, submitted: "2026-06-28", status: "Pending", reason: "Campaign shoot", from: "Durban", to: "Cape Town", departureDate: "2026-08-01", returnDate: "2026-08-05", transportMode: "Flight", numberOfPeople: 2, organizationId: "org-hb",
      travelers: [
        { id: "t-1", name: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", department: "Marketing", position: "Brand Manager", idDocument: "9001015800083", idDocumentType: "ID", email: "nomvula@hb.co.za", cellPhone: "0821234567", jobTitle: "Brand Manager", company: "Hollywoodbets Group", gender: "Female" },
        { id: "t-2", name: "Thandi Mokoena", teamMemberNumber: "HB-10002", department: "Marketing", position: "Designer", idDocument: "P1234567", idDocumentType: "Passport", email: "thandi@hb.co.za", cellPhone: "0831234567", jobTitle: "Designer", company: "Hollywoodbets Group", gender: "Female" },
      ] }),
    mkDecl({ id: "TR-2026-0002", employee: "Kabelo Molefe", employeeId: "user-3", teamMemberNumber: "NPN-10001", lineManager: "James van Wyk", approver: "James van Wyk", department: "Sales", type: "International", destination: "Gaborone", value: 12000, submitted: "2026-05-12", status: "Approved", reason: "Territory expansion", from: "Johannesburg", to: "Gaborone", departureDate: "2026-06-02", returnDate: "2026-06-06", organizationId: "org-npn" }),
    mkDecl({ id: "TR-2026-0003", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Bloemfontein", value: 800, submitted: "2026-06-02", status: "Declined", reason: "Store opening", from: "Durban", to: "Bloemfontein", departureDate: "2026-06-20", returnDate: "2026-06-21", transportMode: "Bus", organizationId: "org-hb" }),
    mkDecl({ id: "TR-2026-0004", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Polokwane", value: 1100, submitted: "2026-06-15", status: "Returned", reason: "Mall activation", from: "Durban", to: "Polokwane", departureDate: "2026-07-05", returnDate: "2026-07-06", transportMode: "Flight", organizationId: "org-hb" }),
    mkDecl({ id: "TR-2026-0005", employee: "Nomvula Dlamini", employeeId: "user-1", teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi", approver: "Sipho Nkosi", department: "Marketing", type: "Domestic", destination: "Umhlanga", value: 500, submitted: "2026-07-01", status: "Draft", reason: "Photoshoot", from: "Durban", to: "Umhlanga", departureDate: "2026-08-10", returnDate: "2026-08-10", transportMode: "Car", organizationId: "org-hb" }),
    mkDecl({ id: "TR-2026-0006", employee: "James van Wyk", employeeId: "user-4", teamMemberNumber: "NPN-20001", lineManager: "Aisha Patel", approver: "Aisha Patel", department: "Sales", type: "International", destination: "Maputo", value: 20000, submitted: "2026-06-20", status: "Escalated", reason: "Partner negotiations", from: "Johannesburg", to: "Maputo", departureDate: "2026-07-22", returnDate: "2026-07-26", organizationId: "org-npn" }),
  ];

  const pending = (id: string, lmId: string, lmName: string, hrId: string, hrName: string): WorkflowInstance => ({
    declarationId: id,
    steps: [
      step(1, "lineManager", lmId, lmName, "Line Manager Review", "pending"),
      step(2, "hr", hrId, hrName, "HR Review", "pending"),
    ],
  });

  const completed = (id: string, lmId: string, lmName: string, hrId: string, hrName: string, decidedAt: string, decision: ApprovalDecision = "accept"): WorkflowInstance => ({
    declarationId: id,
    steps: [
      step(1, "lineManager", lmId, lmName, "Line Manager Review", "approved", { decision, notes: "Approved", decidedAt, decidedById: lmId, decidedByName: lmName }),
      step(2, "hr", hrId, hrName, "HR Review", "approved", { decision, notes: "Approved", decidedAt, decidedById: hrId, decidedByName: hrName }),
    ],
  });

  const decided = (id: string, lmId: string, lmName: string, hrId: string, hrName: string, status: "declined" | "returned", decision: ApprovalDecision, notes: string, decidedAt: string): WorkflowInstance => ({
    declarationId: id,
    steps: [
      step(1, "lineManager", lmId, lmName, "Line Manager Review", status, { decision, notes, decidedAt, decidedById: lmId, decidedByName: lmName }),
      step(2, "hr", hrId, hrName, "HR Review", "pending"),
    ],
  });

  const workflows: WorkflowInstance[] = [
    pending("TR-2024-0044", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu"),
    pending("TR-2024-0045", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu"),
    pending("TR-2024-0047", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu"),
    completed("TR-2025-0009", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu", "2025-03-12T09:00:00.000Z"),
    pending("TR-2026-0001", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu"),
    completed("TR-2026-0002", "user-4", "James van Wyk", "user-6", "Aisha Patel", "2026-05-20T09:00:00.000Z", "org"),
    decided("TR-2026-0003", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu", "declined", "decline", "Travel not justified this quarter", "2026-06-05T10:00:00.000Z"),
    decided("TR-2026-0004", "user-2", "Sipho Nkosi", "user-5", "Lindiwe Zulu", "returned", "return", "Attach the invoice before resubmitting", "2026-06-18T10:00:00.000Z"),
    { declarationId: "TR-2026-0005", steps: [] },
    pending("TR-2026-0006", "user-6", "Aisha Patel", "user-6", "Aisha Patel"),
  ];

  return { declarations, workflows };
}

function seedAll(): void {
  write("users", seedUsers());
  write("organizations", seedOrganizations());
  write("config", seedConfig());
  write("dropdowns", seedDropdowns());
  write("approvalOptions", seedApprovalOptions());
  write("workflowRules", seedWorkflowRules());
  const { declarations, workflows } = seedDeclarations();
  write("declarations", declarations);
  write("workflows", workflows);
  write("files", []);
  write("seq", 100);
  writeVersion();
}

function writeVersion(): void {
  try {
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
  } catch { /* ignore */ }
}

function ensureSeeded(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) === String(SEED_VERSION)) return;
  } catch {
    return;
  }
  seedAll();
}

/** Clears all local data and reseeds — used by tests and available for dev reset. */
export function resetLocalStore(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
  seedAll();
}

// ─── Collection accessors ─────────────────────────────────────────────────────

function getUsers(): StoredUser[] {
  ensureSeeded();
  return read<StoredUser[]>("users", []);
}

function setUsers(users: StoredUser[]): void {
  ensureSeeded();
  write("users", users);
}

function getDeclarations(): Declaration[] {
  ensureSeeded();
  return read<Declaration[]>("declarations", []);
}

function setDeclarations(declarations: Declaration[]): void {
  ensureSeeded();
  write("declarations", declarations);
}

function getWorkflows(): WorkflowInstance[] {
  ensureSeeded();
  return read<WorkflowInstance[]>("workflows", []);
}

function setWorkflows(workflows: WorkflowInstance[]): void {
  ensureSeeded();
  write("workflows", workflows);
}

function nextSeq(): number {
  ensureSeeded();
  const n = read<number>("seq", 100) + 1;
  write("seq", n);
  return n;
}

function publicUser(u: StoredUser): User {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function authenticateUser(email: string, password: string): { token: string; user: User } | null {
  if (typeof email !== "string" || typeof password !== "string") return null;
  if (!email.trim() || !password) return null;
  const user = getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) return null;
  const token = `local.${user.id}.${Date.now().toString(36)}${Math.floor(Math.random() * 0xffff).toString(36)}`;
  return { token, user: publicUser(user) };
}

export function getUserByToken(token: string | null): User | null {
  if (!token || !token.startsWith("local.")) return null;
  const id = token.split(".")[1];
  const user = getUsers().find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function listUsers(search?: string, role?: string): User[] {
  let users = getUsers();
  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (role) users = users.filter((u) => u.role === role);
  return users.map(publicUser);
}

export function findUserById(id: string): User {
  const user = getUsers().find((u) => u.id === id);
  if (!user) throw notFound("User", id);
  return publicUser(user);
}

export function findManagers(organizationId?: string): { id: string; name: string; email: string; position: string; department: string }[] {
  return getUsers()
    .filter((u) => (u.role === "approver" || u.role === "admin") && (!organizationId || u.organizationId === organizationId))
    .map((u) => ({ id: u.id, name: u.name, email: u.email, position: u.position, department: u.department }));
}

export function listDepartments(organizationId?: string): string[] {
  const dropdowns = read<Dropdowns>("dropdowns", seedDropdowns());
  const fromUsers = [...new Set(
    getUsers()
      .filter((u) => !organizationId || u.organizationId === organizationId)
      .map((u) => u.department)
      .filter(Boolean),
  )];
  const merged = [...fromUsers];
  for (const d of dropdowns.departments) if (!merged.includes(d)) merged.push(d);
  return merged;
}

export function createUserRecord(data: Partial<User> & { password?: string }): User {
  const users = getUsers();
  const id = `user-${nextSeq()}`;
  const created: StoredUser = {
    id,
    name: data.name || "New User",
    email: data.email || `${id}@hb.co.za`,
    passwordHash: hashPassword(data.password || DEFAULT_PASSWORD),
    role: data.role || "teamMember",
    teamMemberNumber: data.teamMemberNumber || `HB-${id}`,
    department: data.department || "Operations",
    position: data.position || "Team Member",
    lineManager: data.lineManager ?? null,
    organizationId: data.organizationId,
  };
  users.push(created);
  setUsers(users);
  return publicUser(created);
}

export function updateUserRecord(id: string, data: Partial<User>): User {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw notFound("User", id);
  users[idx] = { ...users[idx], ...data, id };
  setUsers(users);
  return publicUser(users[idx]);
}

export function deleteUserRecord(id: string): { message: string } {
  const users = getUsers();
  if (!users.some((u) => u.id === id)) throw notFound("User", id);
  setUsers(users.filter((u) => u.id !== id));
  return { message: "User deleted" };
}

// ─── Declarations ─────────────────────────────────────────────────────────────

export function listDeclarations(status?: string, search?: string): Declaration[] {
  let declarations = getDeclarations();
  if (status && status !== "All") declarations = declarations.filter((d) => d.status === status);
  if (search) {
    const q = search.toLowerCase();
    declarations = declarations.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        (d.counterparty || "").toLowerCase().includes(q) ||
        (d.destination || "").toLowerCase().includes(q) ||
        d.employee.toLowerCase().includes(q) ||
        (d.approver || "").toLowerCase().includes(q),
    );
  }
  return clone(declarations);
}

export function findDeclarationById(id: string): Declaration {
  const declaration = getDeclarations().find((d) => d.id === id);
  if (!declaration) throw notFound("Declaration", id);
  return clone(declaration);
}

export function createDeclarationRecord(data: Partial<Declaration>): Declaration {
  const declarations = getDeclarations();
  const now = new Date().toISOString();
  const created: Declaration = {
    id: data.id || `TR-${new Date().getFullYear()}-${String(nextSeq()).padStart(4, "0")}`,
    employee: data.employee || "Employee",
    employeeId: data.employeeId || "user-1",
    department: data.department || "",
    type: data.type || "Domestic",
    counterparty: data.counterparty || data.destination || "",
    value: data.value ?? 0,
    submitted: data.submitted || now,
    approver: data.approver || "",
    approverId: data.approverId,
    status: data.status || "Draft",
    priority: data.priority || "Low",
    description: data.description || "",
    relationship: data.relationship || "",
    teamMemberNumber: data.teamMemberNumber || "",
    lineManager: data.lineManager || "",
    position: data.position || "",
    receivedGiven: data.receivedGiven || "",
    from: data.from || "",
    contactPerson: data.contactPerson || "",
    biddingProcess: data.biddingProcess || "",
    contractNegotiation: data.contractNegotiation,
    occasion: data.occasion || "",
    date: data.date || "",
    instances: data.instances || "1",
    publicOfficial: data.publicOfficial || "",
    company: data.company,
    companyToBeBilled: data.companyToBeBilled,
    orderNumber: data.orderNumber,
    team: data.team,
    substantiation: data.substantiation,
    files: data.files ? clone(data.files) : [],
    organizationId: data.organizationId,
    workflowSteps: data.workflowSteps ? clone(data.workflowSteps) : [],
    travelers: data.travelers ? clone(data.travelers) : [],
    numberOfPeople: data.numberOfPeople ?? 1,
    destination: data.destination || data.counterparty || "",
    departureDate: data.departureDate || "",
    returnDate: data.returnDate || "",
    travelType: data.travelType || ((data.type === "International" ? "International" : "Domestic") as "Domestic" | "International"),
    reason: data.reason || data.description || "",
    to: data.to,
    transportMode: data.transportMode || "None",
    transportDetails: data.transportDetails || "",
    flightCost: data.flightCost,
    seatPreference: data.seatPreference || "Aisle",
    firstTimeFlying: data.firstTimeFlying ?? "No",
    accommodationRequired: data.accommodationRequired || false,
    accommodationDetails: data.accommodationDetails || "",
    accommodationCost: data.accommodationCost,
    enterTravellerDetails: data.enterTravellerDetails || false,
    purpose: data.purpose,
  };
  const idx = declarations.findIndex((d) => d.id === created.id);
  if (idx === -1) declarations.push(created);
  else declarations[idx] = created;
  setDeclarations(declarations);
  return clone(created);
}

export function updateDeclarationRecord(id: string, data: Partial<Declaration>): Declaration {
  const declarations = getDeclarations();
  const idx = declarations.findIndex((d) => d.id === id);
  if (idx === -1) throw notFound("Declaration", id);
  declarations[idx] = { ...clone(declarations[idx]), ...clone(data), id };
  setDeclarations(declarations);
  return clone(declarations[idx]);
}

function hrForOrganization(organizationId?: string): { id: string; name: string } {
  const users = getUsers();
  const hr = users.find((u) => u.role === "approver" && u.department === "HR" && (!organizationId || u.organizationId === organizationId))
    || users.find((u) => u.id === "user-5")!;
  return { id: hr.id, name: hr.name };
}

function managerForUser(userId?: string): { id: string; name: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  const manager = (user?.lineManager && users.find((u) => u.id === user.lineManager))
    || users.find((u) => u.id === "user-2")!;
  return { id: manager.id, name: manager.name };
}

function buildWorkflowFor(declaration: Declaration): WorkflowInstance {
  const manager = declaration.lineManager && getUsers().some((u) => u.name === declaration.lineManager)
    ? { id: getUsers().find((u) => u.name === declaration.lineManager)!.id, name: declaration.lineManager }
    : managerForUser(declaration.employeeId);
  const hr = hrForOrganization(declaration.organizationId);
  return {
    declarationId: declaration.id,
    steps: [
      step(1, "lineManager", manager.id, manager.name, "Line Manager Review", "pending"),
      step(2, "hr", hr.id, hr.name, "HR Review", "pending"),
    ],
  };
}

export function submitDeclarationRecord(id: string): Declaration {
  const declarations = getDeclarations();
  const idx = declarations.findIndex((d) => d.id === id);
  if (idx === -1) throw notFound("Declaration", id);
  const current = declarations[idx];
  if (current.status === "Pending" || current.status === "Escalated") {
    throw new ApiClientError(409, `Declaration is already ${current.status}`);
  }
  if (current.status === "Approved") {
    throw new ApiClientError(409, "Cannot submit an Approved declaration");
  }
  if (current.status === "Declined") {
    throw new ApiClientError(409, "Cannot submit a Declined declaration");
  }
  declarations[idx] = {
    ...current,
    status: "Pending",
    submitted: new Date().toISOString(),
    approver: current.approver || current.lineManager,
  };
  setDeclarations(declarations);
  const workflows = getWorkflows().filter((w) => w.declarationId !== id);
  workflows.push(buildWorkflowFor(declarations[idx]));
  setWorkflows(workflows);
  return clone(declarations[idx]);
}

export function setDeclarationStatus(id: string, status: string): Declaration {
  return updateDeclarationRecord(id, { status: status as StatusType });
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export function listPendingWorkflows(): { declaration: Declaration; step: WorkflowStep | null }[] {
  const declarations = getDeclarations().filter((d) => d.status === "Pending" || d.status === "Escalated");
  const workflows = getWorkflows();
  return declarations.map((declaration) => {
    const instance = workflows.find((w) => w.declarationId === declaration.id);
    const current = instance?.steps.find((s) => s.status === "pending") || null;
    return { declaration: clone(declaration), step: current ? clone(current) : null };
  });
}

export function findWorkflowInstance(declarationId: string): WorkflowInstance {
  findDeclarationById(declarationId);
  const workflows = getWorkflows();
  let instance = workflows.find((w) => w.declarationId === declarationId);
  if (!instance) {
    const declaration = findDeclarationById(declarationId);
    instance = buildWorkflowFor(declaration);
    setWorkflows([...workflows, instance]);
  }
  return clone(instance);
}

const TERMINAL_BY_DECISION: Record<string, { step: WorkflowStep["status"]; declaration: StatusType }> = {
  decline: { step: "declined", declaration: "Declined" },
  return: { step: "returned", declaration: "Returned" },
};

export function decideWorkflowStep(declarationId: string, decision: string, notes?: string): { declarationId: string; steps: WorkflowStep[]; status: StatusType; newStatus: StatusType } {
  const declarations = getDeclarations();
  const idx = declarations.findIndex((d) => d.id === declarationId);
  if (idx === -1) throw notFound("Declaration", declarationId);
  if (declarations[idx].status === "Approved" || declarations[idx].status === "Declined" || declarations[idx].status === "Returned") {
    throw new ApiClientError(409, "No pending workflow step for this declaration");
  }
  if (declarations[idx].status !== "Pending" && declarations[idx].status !== "Escalated") {
    throw new ApiClientError(409, `Cannot decide a ${declarations[idx].status} declaration`);
  }
  const workflows = getWorkflows();
  let instance = workflows.find((w) => w.declarationId === declarationId);
  if (!instance) {
    instance = buildWorkflowFor(declarations[idx]);
    workflows.push(instance);
  }
  const current = instance.steps.find((s) => s.status === "pending");
  if (!current) throw new ApiClientError(409, "No pending workflow step for this declaration");
  const now = new Date().toISOString();
  current.decision = decision as ApprovalDecision;
  current.notes = notes || "";
  current.decidedAt = now;
  current.decidedById = current.assignee;
  current.decidedByName = current.assigneeName;
  const terminal = TERMINAL_BY_DECISION[decision];
  let status: StatusType;
  if (terminal) {
    current.status = terminal.step;
    status = terminal.declaration;
  } else if (instance.steps.some((s) => s !== current && s.status === "pending")) {
    current.status = "approved";
    status = "Pending";
  } else {
    current.status = "approved";
    status = "Approved";
  }
  declarations[idx] = { ...declarations[idx], status };
  setDeclarations(declarations);
  setWorkflows(workflows);
  return { declarationId, steps: clone(instance.steps), status, newStatus: status };
}

// ─── Config / dropdowns / organizations / rules / options ────────────────────

export function getConfig(): SystemConfig {
  ensureSeeded();
  return read<SystemConfig>("config", seedConfig());
}

export function saveConfigRecord(data: Partial<SystemConfig>): SystemConfig {
  const merged = { ...getConfig(), ...clone(data) };
  write("config", merged);
  return clone(merged);
}

export function getDropdowns(): Dropdowns {
  ensureSeeded();
  return read<Dropdowns>("dropdowns", seedDropdowns());
}

export function saveDropdownsRecord(data: Partial<Dropdowns>): Dropdowns {
  const merged = { ...getDropdowns(), ...clone(data) };
  write("dropdowns", merged);
  return clone(merged);
}

export function listOrganizations(): { id: string; name: string; shortCode: string }[] {
  ensureSeeded();
  return read<{ id: string; name: string; shortCode: string }[]>("organizations", []);
}

export function createOrganizationRecord(data: { name: string; shortCode: string }): { id: string; name: string; shortCode: string } {
  const orgs = listOrganizations();
  const created = { id: `org-${nextSeq()}`, name: data.name, shortCode: data.shortCode };
  write("organizations", [...orgs, created]);
  return created;
}

export function updateOrganizationRecord(id: string, data: { name: string; shortCode: string }): { id: string; name: string; shortCode: string } {
  const orgs = listOrganizations();
  const idx = orgs.findIndex((o) => o.id === id);
  if (idx === -1) throw notFound("Organization", id);
  orgs[idx] = { ...orgs[idx], ...data, id };
  write("organizations", orgs);
  return orgs[idx];
}

export function deleteOrganizationRecord(id: string): { message: string } {
  const orgs = listOrganizations();
  if (!orgs.some((o) => o.id === id)) throw notFound("Organization", id);
  write("organizations", orgs.filter((o) => o.id !== id));
  return { message: "Organization deleted" };
}

export function listWorkflowRules(): WorkflowRule[] {
  ensureSeeded();
  return read<WorkflowRule[]>("workflowRules", []);
}

export function createWorkflowRuleRecord(data: Partial<WorkflowRule>): WorkflowRule {
  const rules = listWorkflowRules();
  const created: WorkflowRule = {
    id: `rule-${nextSeq()}`,
    name: data.name || "New Rule",
    condition: data.condition || "",
    priority: data.priority ?? rules.length + 1,
    steps: data.steps ? clone(data.steps) : [],
  };
  write("workflowRules", [...rules, created]);
  return clone(created);
}

export function updateWorkflowRuleRecord(id: string, data: Partial<WorkflowRule>): WorkflowRule {
  const rules = listWorkflowRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) throw notFound("Workflow rule", id);
  rules[idx] = { ...rules[idx], ...clone(data), id };
  write("workflowRules", rules);
  return clone(rules[idx]);
}

export function deleteWorkflowRuleRecord(id: string): { message: string } {
  const rules = listWorkflowRules();
  if (!rules.some((r) => r.id === id)) throw notFound("Workflow rule", id);
  write("workflowRules", rules.filter((r) => r.id !== id));
  return { message: "Workflow rule deleted" };
}

export function listApprovalOptions(): { id: string; value: string; label: string }[] {
  ensureSeeded();
  return read<{ id: string; value: string; label: string }[]>("approvalOptions", []);
}

export function createApprovalOptionRecord(data: { id: string; value: string; label: string }): { id: string; value: string; label: string } {
  const options = listApprovalOptions();
  const created = { id: data.id || `opt-${nextSeq()}`, value: data.value, label: data.label };
  write("approvalOptions", [...options, created]);
  return created;
}

export function updateApprovalOptionRecord(id: string, data: { value: string; label: string }): { id: string; value: string; label: string } {
  const options = listApprovalOptions();
  const idx = options.findIndex((o) => o.id === id || o.value === id);
  if (idx === -1) throw notFound("Approval option", id);
  options[idx] = { ...options[idx], ...data };
  write("approvalOptions", options);
  return options[idx];
}

export function deleteApprovalOptionRecord(id: string): { message: string } {
  const options = listApprovalOptions();
  const idx = options.findIndex((o) => o.id === id || o.value === id);
  if (idx === -1) throw notFound("Approval option", id);
  write("approvalOptions", options.filter((_, i) => i !== idx));
  return { message: "Approval option deleted" };
}

// ─── Files ────────────────────────────────────────────────────────────────────

export function uploadFileRecord(file: File, declarationId: string): UploadedFile {
  ensureSeeded();
  const files = read<(UploadedFile & { declarationId: string })[]>("files", []);
  const record = {
    name: file.name,
    size: file.size,
    type: file.type,
    url: `local:file/${declarationId}/${encodeURIComponent(file.name)}`,
    declarationId,
  };
  write("files", [...files, record]);
  const { declarationId: _ignored, ...uploaded } = record;
  return uploaded;
}

// ─── Dashboards & reports ─────────────────────────────────────────────────────

export interface LocalDashboardStats {
  kpis: { total: number; pending: number; approved: number; declined: number; escalated: number; totalValue: number };
  complianceTrend: { month: string; approved: number; declined: number }[];
  typeBreakdown: { name: string; value: number; color: string }[];
}

const TYPE_COLOR_FALLBACK: Record<string, string> = {
  Domestic: "#0D9488",
  International: "#F97316",
  Business: "#0D9488",
  Leisure: "#F97316",
  Visiting: "#10B981",
  Other: "#6B7280",
};

export function getDashboardStats(): LocalDashboardStats {
  const declarations = getDeclarations();
  const byStatus = (s: string) => declarations.filter((d) => d.status === s);
  const kpis = {
    total: declarations.length,
    pending: byStatus("Pending").length,
    approved: byStatus("Approved").length,
    declined: byStatus("Declined").length,
    escalated: byStatus("Escalated").length,
    totalValue: declarations.filter((d) => d.status === "Pending" || d.status === "Approved").reduce((sum, d) => sum + d.value, 0),
  };
  const trend = new Map<string, { month: string; approved: number; declined: number }>();
  for (const d of declarations) {
    const month = String(d.submitted).slice(0, 7);
    if (!trend.has(month)) trend.set(month, { month, approved: 0, declined: 0 });
    const point = trend.get(month)!;
    if (d.status === "Approved") point.approved += 1;
    if (d.status === "Declined") point.declined += 1;
  }
  const complianceTrend = [...trend.values()].sort((a, b) => a.month.localeCompare(b.month));
  const byType = new Map<string, number>();
  for (const d of declarations) byType.set(d.type, (byType.get(d.type) || 0) + 1);
  const typeBreakdown = [...byType.entries()].map(([name, value]) => ({ name, value, color: TYPE_COLOR_FALLBACK[name] || "#6B7280" }));
  return { kpis, complianceTrend, typeBreakdown };
}

export function getAdminDashboard(): { users: number; workflows: number; declarations: number; threshold: number } {
  const config = getConfig();
  return {
    users: getUsers().length,
    workflows: listWorkflowRules().length,
    declarations: getDeclarations().length,
    threshold: config.highValueThreshold,
  };
}

export function getStatusBreakdown(params?: Record<string, string>): Record<string, number> {
  const declarations = applyReportFilters(getDeclarations(), params);
  const breakdown: Record<string, number> = {};
  for (const d of declarations) breakdown[d.status] = (breakdown[d.status] || 0) + 1;
  return breakdown;
}

function applyReportFilters(declarations: Declaration[], params?: Record<string, string>): Declaration[] {
  let result = declarations;
  if (params?.department) result = result.filter((d) => d.department === params.department);
  if (params?.status) result = result.filter((d) => d.status === params.status);
  if (params?.startDate) result = result.filter((d) => String(d.submitted).slice(0, 10) >= params.startDate);
  if (params?.endDate) result = result.filter((d) => String(d.submitted).slice(0, 10) <= params.endDate);
  return result;
}

export function getSLAData(params?: Record<string, string>): { role: string; avg: number; min: number; max: number; count: number }[] {
  const declarations = applyReportFilters(getDeclarations(), params);
  const workflows = getWorkflows();
  const byRole = new Map<string, number[]>();
  for (const d of declarations) {
    const instance = workflows.find((w) => w.declarationId === d.id);
    const submitted = new Date(d.submitted).getTime();
    for (const s of instance?.steps || []) {
      if (!s.decidedAt) continue;
      const days = Math.max(0, Math.round((new Date(s.decidedAt).getTime() - submitted) / 86400000));
      const list = byRole.get(s.role) || [];
      list.push(days);
      byRole.set(s.role, list);
    }
  }
  return [...byRole.entries()].map(([role, days]) => ({
    role,
    avg: days.reduce((a, b) => a + b, 0) / days.length,
    min: Math.min(...days),
    max: Math.max(...days),
    count: days.length,
  }));
}

export function getDestinationConcentration(params?: Record<string, string>): { counterparty: string; count: number; totalValue: number; avgValue: number }[] {
  const declarations = applyReportFilters(getDeclarations(), params);
  const groups = new Map<string, { counterparty: string; count: number; totalValue: number }>();
  for (const d of declarations) {
    const key = d.destination || d.counterparty || "Unknown";
    const current = groups.get(key) || { counterparty: key, count: 0, totalValue: 0 };
    current.count += 1;
    current.totalValue += d.value;
    groups.set(key, current);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, avgValue: g.totalValue / g.count }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

export function getHighValueRows(params?: Record<string, string>): { employee: string; lineManager: string; declarationCount: number; totalValue: number; averageValue: number; totalGift: number; totalHospitality: number; totalEntertainment: number; mostFrequentSupplier: string }[] {
  const threshold = getConfig().highValueThreshold;
  const declarations = applyReportFilters(
    getDeclarations().filter((d) => d.value >= threshold),
    params,
  );
  const groups = new Map<string, { employee: string; lineManager: string; declarationCount: number; totalValue: number; totalGift: number; totalHospitality: number; totalEntertainment: number; suppliers: Map<string, number> }>();
  for (const d of declarations) {
    const current = groups.get(d.employee) || { employee: d.employee, lineManager: d.lineManager || "", declarationCount: 0, totalValue: 0, totalGift: 0, totalHospitality: 0, totalEntertainment: 0, suppliers: new Map<string, number>() };
    current.declarationCount += 1;
    current.totalValue += d.value;
    if (d.type === "Domestic") current.totalGift += d.value;
    else if (d.type === "International") current.totalHospitality += d.value;
    else current.totalEntertainment += d.value;
    const supplier = d.destination || d.counterparty || "Unknown";
    current.suppliers.set(supplier, (current.suppliers.get(supplier) || 0) + 1);
    groups.set(d.employee, current);
  }
  return [...groups.values()]
    .map((row) => ({
      ...row,
      averageValue: row.totalValue / row.declarationCount,
      mostFrequentSupplier: [...row.suppliers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown",
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

export function getReportList(params?: Record<string, string>): Declaration[] {
  const filtered = applyReportFilters(getDeclarations(), params);
  if (!params?.search) return clone(filtered);
  const q = params.search.toLowerCase();
  return clone(
    filtered.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        (d.counterparty || "").toLowerCase().includes(q) ||
        (d.destination || "").toLowerCase().includes(q) ||
        d.employee.toLowerCase().includes(q) ||
        (d.approver || "").toLowerCase().includes(q),
    ),
  );
}
