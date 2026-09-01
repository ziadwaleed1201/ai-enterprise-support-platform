export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  ticketId?: number | null;
  createdAt: string;
}