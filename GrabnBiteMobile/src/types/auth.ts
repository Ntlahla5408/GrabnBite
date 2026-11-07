export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profileImageUrl?: string | null;
  isEmailVerified?: boolean;
  isActive?: boolean;
}

export interface LoginResponse extends User {
  token: string;
}
