export interface TicketHistory {
  id: number;
  action: string;
  details: string;
  performedBy?: string | null;
  createdAt: string;
}