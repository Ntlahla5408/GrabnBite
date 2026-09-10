export interface CurrentUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export const getCurrentUser = (): CurrentUser | null => {
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
  return localStorage.getItem("grubnbite_token");
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const logout = (): void => {
  localStorage.removeItem("grubnbite_token");
  localStorage.removeItem("grubnbite_user");
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