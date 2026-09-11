export interface User {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string;
  roleId: number;
  roleName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  firstName: string;
  lastName: string | null;
  username: string;
  password: string;
  roleId: number;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}
