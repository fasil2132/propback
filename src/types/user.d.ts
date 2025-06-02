// type UserRole = 'admin' | 'owner' | 'tenant';

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'owner' | 'tenant';
  createdAt: Date;
}
