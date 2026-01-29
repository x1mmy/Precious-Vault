export interface AuthState {
  user: { id: string; email?: string | null } | null;
  loading: boolean;
}
