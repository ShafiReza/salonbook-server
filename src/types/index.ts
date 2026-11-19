export type Role = "admin" | "customer";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  name: string;
}
