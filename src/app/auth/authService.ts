import { User } from "@/types/declaration";
import { setToken, getAuthToken } from "@/services/httpClient";
import { authenticateUser, getUserByToken } from "@/services/localStore";

export async function authenticate(email: string, password: string): Promise<User | null> {
  if (typeof email !== "string" || typeof password !== "string") return null;
  const result = authenticateUser(email, password);
  if (!result) return null;
  setToken(result.token);
  return result.user;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return getUserByToken(getAuthToken());
  } catch {
    return null;
  }
}

export function canAccessScreen(user: User | null, screen: string): boolean {
  if (!user) return screen === "landing" || screen === "login";
  const role = user.role;
  if (screen === "travel-analysis") return role === "admin" || role === "approver";
  if (screen === "admin-reports") return role === "admin" || role === "approver";
  if (screen.startsWith("admin-")) return role === "admin";
  if (screen === "approver-dashboard" || screen === "approval-queue" || screen === "approval-detail") {
    return role === "approver" || role === "admin";
  }
  return role === "teamMember" || role === "approver" || role === "admin";
}
