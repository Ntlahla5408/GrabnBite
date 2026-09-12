import { apiRequest as request } from "../../services/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  return request<T>(`/api${endpoint}`, {
    ...options,
    headers: token
      ? {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      : options.headers,
  });
}