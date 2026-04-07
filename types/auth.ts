export type Role = "user" | "producer" | "consumer" | "ami";

export interface RegistrationRequest {
  username: string;
  email: string;
  password: string;
  role?: Role; // Optional - assigned by backend
  first_name: string;
  last_name: string;
}

export interface RegistrationUser {
  username: string;
  email: string;
  role: Role;
}

export interface RegistrationResponse {
  message: string;
  user: RegistrationUser;
  email_verification_sent: boolean;
  verification_required: boolean;
}
/**
 * Authentication Types for GridTokenX Platform
 */

export interface LoginRequest {
  username: string; // min: 3, max: 50 chars
  password: string; // min: 8, max: 128 chars
}

export interface RegisterRequest {
  username: string; // min: 3, max: 50 chars
  email: string; // valid email format
  password: string; // min: 8, max: 128 chars
  role?: Role;
  first_name: string; // min: 1, max: 100 chars
  last_name: string; // min: 1, max: 100 chars
}

export interface VerifyWalletRequest {
  wallet_address: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number; // seconds (86400 = 24 hours)
  user: {
    username: string;
    email: string;
    role: string;
    blockchain_registered: boolean;
  };
}

export interface RegisterResponse {
  message: string;
  email_verification_sent: boolean;
}

export interface AuthError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface ApiError {
  status: number;
  error: string;
  retry_after?: number;
}

export interface VerifyEmailResponse {
  message: string;
  email_verified: boolean;
  verified_at: string;
  wallet_address?: string; // Wallet address generated during verification
  username?: string;
  email?: string;
  auth?: LoginResponse; // Optional auto-login after verification
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  email: string;
  sent_at: string;
  expires_in_hours: number;
  status: "already_verified" | "expired_resent" | "sent";
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "user" | "producer" | "consumer" | "ami";
  wallet_address?: string;
  first_name?: string;
  last_name?: string;
  blockchain_registered?: boolean;
  // Financial fields — backend Decimal serializes as string
  balance?: number | string;
  locked_amount?: number | string;
  locked_energy?: number | string;
}

export interface ProfileUpdateRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  wallet_address?: string;
}

export interface ProfileResponse {
  user: UserProfile;
}

export interface TokenBalance {
  wallet_address: string;
  token_balance: string;
  token_balance_raw: number;
  balance_sol: number;
  decimals: number;
  token_mint: string;
  token_account: string;
}
