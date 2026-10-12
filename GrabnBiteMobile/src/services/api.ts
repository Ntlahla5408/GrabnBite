import { Platform } from "react-native";

// Render is the default API URL.
// Set EXPO_PUBLIC_API_URL to use another deployment or a local development API.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://grubnbite.onrender.com";

const TOKEN_KEY = "grabnbite_token";

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }

  return null;
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const storedToken = token ?? (await getStoredToken());

  // Headers safely supports both existing headers and Authorization.
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (storedToken) {
    headers.set("Authorization", `Bearer ${storedToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  return response.json();
}
