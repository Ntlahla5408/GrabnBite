export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface LoginResponse extends User {
  token: string;
}
