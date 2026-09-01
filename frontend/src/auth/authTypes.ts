export type UserRole =
  | "EMPLOYEE"
  | "SUPPORT_AGENT"
  | "ADMIN";

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
}

export interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}