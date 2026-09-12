import { apiRequest } from "./api";

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

interface LoginApiResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
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
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiRequest<LoginApiResponse>(
    "/api/Authentication/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
  );

  const token =
    response.token ??
    response.accessToken ??
    response.jwt;

  if (!token) {
    throw new Error(
      "Login succeeded but the API did not return an authentication token.",
    );
  }

  return {
    token,
    userId: response.userId,
    firstName: response.firstName,
    lastName: response.lastName,
    email: response.email,
    role: response.role,
  };
}

export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>(
    "/api/Authentication/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}