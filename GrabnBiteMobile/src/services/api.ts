import { Platform } from "react-native";

// Set EXPO_PUBLIC_API_URL for local development or another deployment.
// Render is the default for the deployed GrabnBite API.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://grubnbite.onrender.com";

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

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (storedToken) {
    headers.Authorization = `Bearer ${storedToken}`;
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
