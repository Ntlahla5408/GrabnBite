import { Platform } from "react-native";
import { getToken } from "./sessionService";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = (
  configuredApiUrl ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5277"
    : "http://localhost:5277")
).replace(/\/$/, "");

export const getApiUrl = (): string => API_URL;

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Could not connect to GrubnBite at ${API_URL}. ` +
        "Start the API or set EXPO_PUBLIC_API_URL to its reachable address.",
    );
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  // Some endpoints may return no content.
  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
};