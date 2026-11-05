import { router } from "expo-router";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { notifySessionExpired } from "./sessionInvalidation";

// Render is the default API URL.
// Set EXPO_PUBLIC_API_URL to use another deployment or a local development API.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://grubnbite.onrender.com";

const TOKEN_KEY = "grabnbite_token";

/** Build a multipart image body that works on both web and native platforms. */
export async function createImageFormData(
  asset: { uri: string; name: string; type: string },
): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // On web, FormData needs a real Blob/File; { uri, name, type } is only
    // the React Native native-platform file descriptor format.
    const fileResponse = await fetch(asset.uri);
    if (!fileResponse.ok) {
      throw new Error("Unable to read the selected image. Please choose it again.");
    }

    const imageBlob = await fileResponse.blob();
    if (imageBlob.size === 0) {
      throw new Error("The selected image is empty. Please choose another image.");
    }

    const imageFile = new Blob([imageBlob], { type: asset.type || imageBlob.type || "image/jpeg" });
    formData.append("image", imageFile, asset.name);
    return formData;
  }

  formData.append("image", {
    uri: asset.uri,
    name: asset.name,
    type: asset.type,
  } as any);

  return formData;
}

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const storedToken = token ?? (await getStoredToken());

  // Headers safely supports both existing headers and Authorization.
  const headers = new Headers(options.headers);

  const isMultipartBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  // Let fetch set the multipart boundary for FormData uploads.
  if (isMultipartBody) {
    headers.delete("Content-Type");
  } else {
    headers.set("Content-Type", "application/json");
  }

  if (storedToken) {
    headers.set("Authorization", `Bearer ${storedToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();

    // A protected API request with an expired or missing token should send
    // the customer to login instead of leaving them on a broken screen.
    const isAuthenticationRequest =
      endpoint.startsWith("/api/Authentication/login") ||
      endpoint.startsWith("/api/Authentication/register");

    if (response.status === 401 && !isAuthenticationRequest && storedToken) {
      // Clear the active in-memory and persisted session as well as navigating
      // away from protected screens. The provider ignores stale-token responses
      // if the user has already signed in again with a different token.
      notifySessionExpired(storedToken);
      router.replace("/login");
    }

    let errorData: any = null;
    if (errorText) {
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = null;
      }
    }

    const validationMessages = errorData?.errors && typeof errorData.errors === "object"
      ? Object.entries(errorData.errors).flatMap(([field, messages]) =>
          (Array.isArray(messages) ? messages : [messages])
            .filter((item) => typeof item === "string" && item.trim())
            .map((item) => `${field}: ${item}`),
        )
      : [];

    const message =
      (typeof errorData === "string" && errorData) ||
      (validationMessages.length ? validationMessages.join(" · ") : null) ||
      errorData?.message ||
      errorData?.title ||
      errorData?.detail ||
      errorText ||
      `API Error: ${response.status}`;

    const apiError = new Error(`${message} (HTTP ${response.status})`) as Error & {
      data?: any;
      status?: number;
    };
    apiError.data = errorData;
    apiError.status = response.status;
    throw apiError;
  }

  return response.json();
}
