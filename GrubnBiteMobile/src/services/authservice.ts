import * as SecureStore from "expo-secure-store";

// IMPORTANT:
// We will replace this with your PC's actual LAN IP.
// Do NOT use localhost when testing on a physical phone.
export const API_URL = "https://localhost:7127";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

const TOKEN_KEY = "grubnbite_token";
const USER_KEY = "grubnbite_user";

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await fetch(
    `${API_URL}/api/Authentication/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Login failed. Please check your email and password.",
    );
  }

  const data: LoginResponse = await response.json();

  // Save JWT
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);

  // Save basic user information
  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
    }),
  );

  return data;
};

export const register = async (
  user: RegisterRequest,
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/Authentication/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Registration failed. Please try again.",
    );
  }
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const getStoredUser = async () => {
  const user = await SecureStore.getItemAsync(USER_KEY);

  if (!user) {
    return null;
  }

  return JSON.parse(user);
};

export const logout = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};