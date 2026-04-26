const isProduction = import.meta.env.PROD;
const isSubdomain = typeof window !== 'undefined' && 
  window.location.hostname.includes('.onlinept.in') && 
  window.location.hostname !== 'onlinept.in';

/**
 * Centralized API configuration for OnlinePT.
 * In development, it defaults to proxying through Vite (empty string).
 * In production, it uses VITE_BACKEND_URL or falls back to:
 * - https://onlinept.in (when on a subdomain)
 * - empty string (when on main domain, to use relative paths)
 */
export const API_BASE = import.meta.env.VITE_BACKEND_URL || 
  (isProduction && isSubdomain ? 'https://onlinept.in' : '');

// If we need a versioned API path
export const API_ROOT = `${API_BASE}/api`;
