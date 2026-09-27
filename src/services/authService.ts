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
