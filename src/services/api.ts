import { Platform } from "react-native";

const API_URL = "https://localhost:7127";

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
