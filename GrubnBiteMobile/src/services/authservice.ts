import { apiRequest } from "../app/restaurant/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    "/Authentication/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    }
  );
}

export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>(
    "/Authentication/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}