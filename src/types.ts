export type UserRole = "Student" | "Admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";

export interface StatusHistoryEntry {
  status: ComplaintStatus;
  comment: string;
  date: string;
}

export interface Complaint {
  _id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: ComplaintStatus;
  createdBy: string;
  createdById: string;
  createdDate: string;
  resolutionDetails?: string;
  resolvedDate?: string;
  statusHistory: StatusHistoryEntry[];
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  categoryCounts: Record<string, number>;
}
