export interface Department {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
  active: boolean;
}

export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface Ticket {
  id: number;
  title: string;
  description: string;

  departmentId: number;
  departmentName: string;

  categoryId: number;
  categoryName: string;

  priority: TicketPriority;
  status: string;

  createdBy: string;
  assignedAgent?: string | null;

  createdAt: string;
  updatedAt: string;

  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  firstRespondedAt?: string | null;
  resolvedAt?: string | null;

  responseOverdue: boolean;
  resolutionOverdue: boolean;
}