const API_URL = "https://localhost:7127";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
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

    throw new Error(errorText || `API Error: ${response.status}`);
  }

  return response.json();
}
