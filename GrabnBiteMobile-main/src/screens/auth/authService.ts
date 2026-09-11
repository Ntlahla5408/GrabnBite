import { apiRequest } from '../api/apiClient';

export interface LoginResponse {
  token: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
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

export const authService = {
  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    return apiRequest<LoginResponse>(
      '/Authentication/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );
  },

  async register(
    data: RegisterRequest
  ): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>(
      '/Authentication/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};