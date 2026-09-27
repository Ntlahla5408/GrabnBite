import { LoginResponse } from "../types/auth";
import { apiRequest } from "./api";

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const body = {
    email: email,
    password: password,
  };

  console.log("AUTH BODY:", JSON.stringify(body));

  return apiRequest("/api/Authentication/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

export async function register(
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  password: string,
): Promise<RegisterResponse> {
  const body: RegisterRequest = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phoneNumber: phoneNumber.trim(),
    password,
  };

  console.log("REGISTER BODY:", JSON.stringify(body));

  return apiRequest("/api/Authentication/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
