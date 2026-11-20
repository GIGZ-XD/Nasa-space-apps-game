export interface User {
  id: string;
  username: string;
  callsign?: string;
  createdAt: string;
  lastLoginAt?: string;
  progress?: any;
}

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}
