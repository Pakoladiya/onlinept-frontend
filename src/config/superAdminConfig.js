/**
 * Super Admin Configuration
 * Contains the email address that grants full platform super admin privileges.
 * Stored as a constant here — do NOT spread across multiple files.
 */
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'pakoladiya@gmail.com';

export const isSuperAdminEmail = (email) => {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};
