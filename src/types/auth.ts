export type UserRole = 'superadmin' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  cafeId?: string;
  active: boolean;
  createdAt?: any;
}

