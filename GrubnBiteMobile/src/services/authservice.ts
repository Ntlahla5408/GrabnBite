const API_URL = "https://localhost:7127";

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

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/api/Authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Login failed. Please check your email and password.",
    );
  }

  return await response.json();
};

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export const register = async (user: RegisterRequest): Promise<void> => {
  const response = await fetch(`${API_URL}/api/Authentication/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(errorText || "Registration failed. Please try again.");
  }
};
