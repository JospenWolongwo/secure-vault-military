/**
 * Role model representing user permissions and access levels
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enum of standard role types in the system
 */
export enum RoleType {
  ADMIN = 'admin',
  OFFICER = 'officer',
  NCO = 'nco',
  SOLDIER = 'soldier'
}

/**
 * User role association
 */
export interface UserRole {
  userId: string;
  roleId: string;
  role?: Role;
}
