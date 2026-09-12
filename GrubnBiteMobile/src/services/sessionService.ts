import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface CurrentUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const TOKEN_KEY = "grubnbite_token";
const USER_KEY = "grubnbite_user";

let memoryToken: string | null = null;
let memoryUser: CurrentUser | null = null;

export async function saveSession(
  token: string,
  user: CurrentUser,
): Promise<void> {
  console.log("SESSION: Saving session");

  memoryToken = token;
  memoryUser = user;

  if (Platform.OS === "web") {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function restoreSession(): Promise<void> {
  console.log("SESSION: Restoring session");

  try {
    if (Platform.OS === "web") {
      memoryToken = window.localStorage.getItem(TOKEN_KEY);

      const storedUser =
        window.localStorage.getItem(USER_KEY);

      if (storedUser) {
        memoryUser = JSON.parse(storedUser) as CurrentUser;
      }

      console.log(
        "SESSION: Restored:",
        !!memoryToken,
        memoryUser,
      );

      return;
    }

    memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);

    const storedUser =
      await SecureStore.getItemAsync(USER_KEY);

    if (storedUser) {
      memoryUser = JSON.parse(storedUser) as CurrentUser;
    }

    console.log(
      "SESSION: Restored:",
      !!memoryToken,
      memoryUser,
    );
  } catch (error) {
    console.error("SESSION: Restore failed:", error);

    memoryToken = null;
    memoryUser = null;
  }
}

export function getToken(): string | null {
  return memoryToken;
}

export function getCurrentUser(): CurrentUser | null {
  return memoryUser;
}

export function isLoggedIn(): boolean {
  return !!memoryToken;
}

export async function logout(): Promise<void> {
  console.log("SESSION: Logging out");

  // Clear memory first.
  memoryToken = null;
  memoryUser = null;

  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }

    console.log("SESSION: Session completely cleared");
  } catch (error) {
    console.error("SESSION: Failed to clear storage:", error);

    // Memory is already cleared, so the user is still logged out
    // for the current app session.
    throw error;
  }
}

export function getUserRole(): string | null {
  return memoryUser?.role ?? null;
}

export function normalizeRole(
  role?: string | null,
): string {
  return (role ?? "").trim().toLowerCase();
}

export function isCustomer(
  role?: string | null,
): boolean {
  const normalized = normalizeRole(role);

  return (
    normalized === "customer" ||
    normalized === "user"
  );
}

export function isDriver(
  role?: string | null,
): boolean {
  return normalizeRole(role) === "driver";
}

export function isRestaurant(
  role?: string | null,
): boolean {
  const normalized = normalizeRole(role);

  return (
    normalized === "restaurant" ||
    normalized === "restaurantstaff" ||
    normalized === "staff"
  );
}

export function isAdmin(
  role?: string | null,
): boolean {
  return normalizeRole(role) === "admin";
}

export function getRoleHome(
  role?: string | null,
): string {
  if (isAdmin(role)) {
    return "/admin";
  }

  if (isDriver(role)) {
    return "/driver";
  }

  if (isRestaurant(role)) {
    return "/restaurant-dashboard";
  }

  return "/";
}