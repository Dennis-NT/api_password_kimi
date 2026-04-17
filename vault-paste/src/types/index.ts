export interface Account {
  id: string;
  site_name: string;
  username: string;
  password: string;
  totp_secret?: string;
  api_key?: string;
  phone?: string;
  access_token?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface AccountWithTotp extends Account {
  totp_code?: string;
  totp_remaining?: number;
}

export interface NewAccount {
  site_name: string;
  username: string;
  password: string;
  totp_secret?: string;
  api_key?: string;
  phone?: string;
  access_token?: string;
  notes?: string;
}

export interface UpdateAccount {
  site_name?: string;
  username?: string;
  password?: string;
  totp_secret?: string;
  api_key?: string;
  phone?: string;
  access_token?: string;
  notes?: string;
}

export interface TotpResult {
  code: string;
  remaining: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
