import { Platform } from "react-native";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const API_URL = (
  configuredApiUrl ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5277"
    : "http://localhost:5277")
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

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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