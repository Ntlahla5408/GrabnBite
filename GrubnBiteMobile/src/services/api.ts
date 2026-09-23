import { Platform } from "react-native";

import { getToken, logout } from "./sessionService";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const API_URL = (
  configuredApiUrl ||
  (Platform.OS === "android"
    ? "https://localhost:7127"
    : "https://localhost:7127")
).replace(/\/$/, "");

export const getApiUrl = (): string => API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends RequestInit {
  token?: string | null;
}

export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { token, ...requestOptions } = options;

  const headers = new Headers(requestOptions.headers);

  headers.set("Content-Type", "application/json");

  const authToken = token ?? getToken();

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,
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

    if (response.status === 401) {
      await logout();
    }

    throw new ApiError(
      errorText || `Request failed with status ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
};
