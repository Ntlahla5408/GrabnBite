import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface CurrentUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

let memoryToken: string | null = null;
let memoryUser: CurrentUser | null = null;

export async function saveSession(
  token: string,
  user: CurrentUser,
): Promise<void> {
  memoryToken = token;
  memoryUser = user;

  if (Platform.OS === "web") {
    localStorage.setItem("grubnbite_token", token);
    localStorage.setItem("grubnbite_user", JSON.stringify(user));
    return;
  }

  await SecureStore.setItemAsync("grubnbite_token", token);
  await SecureStore.setItemAsync("grubnbite_user", JSON.stringify(user));
}

export async function restoreSession(): Promise<void> {
  if (Platform.OS === "web") {
    memoryToken = localStorage.getItem("grubnbite_token");
    memoryUser = getCurrentUser();
    return;
  }

  memoryToken = await SecureStore.getItemAsync("grubnbite_token");
  const storedUser = await SecureStore.getItemAsync("grubnbite_user");

  if (storedUser) {
    try {
      memoryUser = JSON.parse(storedUser) as CurrentUser;
    } catch {
      memoryUser = null;
    }
  }
}

export const getCurrentUser = (): CurrentUser | null => {
  if (memoryUser) {
    return memoryUser;
  }

  if (typeof localStorage === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem("grubnbite_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as CurrentUser;
  } catch {
    return null;
  }
};

export const getToken = (): string | null => {
  if (memoryToken) {
    return memoryToken;
  }

  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem("grubnbite_token");
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const logout = (): void => {
  memoryToken = null;
  memoryUser = null;

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("grubnbite_token");
    localStorage.removeItem("grubnbite_user");
  }

  if (Platform.OS !== "web") {
    void SecureStore.deleteItemAsync("grubnbite_token");
    void SecureStore.deleteItemAsync("grubnbite_user");
  }
};

export const getUserRole = (): string | null => {
  return getCurrentUser()?.role ?? null;
};

export const normalizeRole = (role?: string | null): string => {
  return (role ?? "").trim().toLowerCase();
};

export const isCustomer = (role?: string | null): boolean => {
  const normalized = normalizeRole(role);

  return (
    normalized === "customer" ||
    normalized === "user" ||
    normalized === "eventorganiser"
  );
};

export const isDriver = (role?: string | null): boolean => {
  return normalizeRole(role) === "driver";
};

export const isRestaurant = (role?: string | null): boolean => {
  const normalized = normalizeRole(role);

  return (
    normalized === "restaurant" ||
    normalized === "restaurantstaff" ||
    normalized === "staff"
  );
};

export const isAdmin = (role?: string | null): boolean => {
  return normalizeRole(role) === "admin";
};

export const getRoleHome = (role?: string | null): string => {
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
};