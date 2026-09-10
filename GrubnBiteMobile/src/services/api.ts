const API_URL = "https://localhost:5277";

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem("grubnbite_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

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