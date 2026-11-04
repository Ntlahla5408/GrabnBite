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
  accountType: "Customer" | "Restaurant";
}

export interface RegisterResponse {
  message: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerificationRequired: boolean;
  emailSent: boolean;
  restaurantApplication?: {
    restaurantApplicationId: number;
    applicationReference: string;
    status: string;
  } | null;
}

export interface EmailVerificationResponse {
  message: string;
  emailVerified?: boolean;
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<EmailVerificationResponse> {
  return apiRequest("/api/Authentication/verify-email", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), code: code.trim() }),
  });
}

export async function resendEmailVerification(
  email: string,
): Promise<EmailVerificationResponse> {
  return apiRequest("/api/Authentication/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function register(
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  password: string,
  accountType: "Customer" | "Restaurant" = "Customer",
): Promise<RegisterResponse> {
  const body: RegisterRequest = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phoneNumber: phoneNumber.trim(),
    password,
    accountType,
  };

  return apiRequest("/api/Authentication/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
