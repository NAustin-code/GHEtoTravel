export type Screen =
  | "landing"
  | "login"
  | "new-declaration"
  | "my-declarations"
  | "approver-dashboard"
  | "approval-queue"
  | "approval-detail"
  | "admin-dashboard"
  | "admin-users"
  | "admin-workflows"
  | "admin-dropdowns"
  | "admin-config"
  | "admin-reports"
  | "admin-approval-options"
  | "travel-analysis"
  | "travel-request";

export type Role = "teamMember" | "approver" | "admin";

export type StatusType =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Declined"
  | "Escalated"
  | "Returned";

export type TravelPurpose = "Business" | "Leisure" | "Visiting" | "Other";

export type TripType = "One Way" | "Return";

export type TransportMode =
  | "None"
  | "Flight"
  | "Bus"
  | "Train"
  | "Car"
  | "Other";

export type ApprovalDecision =
  | "return"
  | "accept"
  | "org"
  | "foundation"
  | "decline"
  | null;

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  teamMemberNumber: string;
  department: string;
  position: string;
  lineManager: string | null;
  organizationId?: string;
}

export interface Traveler {
  id: string;
  name: string;
  employeeId?: string;
  teamMemberNumber: string;
  department: string;
  position: string;
  idDocument: string;
  idDocumentType: "ID" | "Passport";
  email: string;
  cellPhone: string;
  cellNumber?: string;
  jobTitle: string;
  jobPosition?: string;
  company: string;
  gender?: string;
  companyToBeBilled?: string;
  internalExternal?: "Internal" | "External";
}

export interface Declaration {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  type: string;
  counterparty: string;
  value: number;
  submitted: string;
  approver: string;
  approverId?: string;
  status: StatusType;
  priority: "High" | "Medium" | "Low";
  description: string;
  relationship: string;
  teamMemberNumber: string;
  lineManager: string;
  position: string;
  receivedGiven: string;
  from: string;
  contactPerson: string;
  biddingProcess: string;
  contractNegotiation?: string;
  occasion: string;
  date: string;
  instances: string;
  publicOfficial: string;
  company?: string;
  companyToBeBilled?: string;
  orderNumber?: string;
  team?: string;
  substantiation?: string;
  files?: UploadedFile[];
  organizationId?: string;
  workflowSteps?: WorkflowStep[];
  // Travel-request extensions (optional so legacy screens keep working)
  travelers?: Traveler[];
  numberOfPeople?: number;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  travelType?: "Domestic" | "International";
  reason?: string;
  to?: string;
  tripType?: TripType;
  travelReference?: string;
  transportMode?: TransportMode;
  transportDetails?: string;
  flightCost?: number;
  seatPreference?: "Aisle" | "Window" | "Other";
  firstTimeFlying?: "Yes" | "No";
  accommodationRequired?: boolean;
  accommodationDetails?: string;
  accommodationCost?: number;
  enterTravellerDetails?: boolean;
  purpose?: TravelPurpose;
}

export interface WorkflowStep {
  order: number;
  role: "lineManager" | "hr";
  assignee: string;
  assigneeName: string;
  label: string;
  status: "pending" | "approved" | "declined" | "returned" | "skipped";
  decision: ApprovalDecision;
  notes: string;
  decidedAt: string | null;
  decidedById: string | null;
  decidedByName: string | null;
}

export interface WorkflowInstance {
  declarationId: string;
  steps: WorkflowStep[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  condition: string;
  priority: number;
  steps: { order: number; role: "lineManager" | "hr"; label: string }[];
}

export interface NotificationTemplates {
  managerApproval: { subject: string; body: string };
  hrApproval: { subject: string; body: string };
  declarationReturned: { subject: string; body: string };
  declarationDeclined: { subject: string; body: string };
  declarationApproved: { subject: string; body: string };
}

export interface SystemConfig {
  highValueThreshold: number;
  mediumValueThreshold: number;
  slaEscalationDays: number;
  maxDeclarationsPerCounterparty: number;
  maximumValue: number;
  emailTemplate: string;
  notificationTemplates: string;
}

export interface Dropdowns {
  departments: string[];
  categories: string[];
  occasions: string[];
  receivedGiven: string[];
  biddingProcess: string[];
  publicOfficial: string[];
  relationships: string[];
  partyTypes: string[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  data?: string;
}

export interface ComplianceTrendPoint {
  month: string;
  approved: number;
  declined: number;
}

export interface TypeBreakdownItem {
  name: string;
  value: number;
  color: string;
}
