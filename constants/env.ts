/**
 * Centralized environment variables for dynamic deployment.
 * Use these instead of process.env directly for consistent fallbacks.
 * See DYNAMIC_DEPLOYMENT_VARIABLES.md for full documentation.
 */

// Client-safe (NEXT_PUBLIC_*) - available in browser
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'ViniSuite';
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
  'Comprehensive dashboard for your organization';
export const ORGANIZATION_NAME =
  process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? 'Vinicius International';
export const ORGANIZATION_NAME_UPPERCASE =
  process.env.NEXT_PUBLIC_ORGANIZATION_NAME_UPPERCASE ?? 'VINICIUS INTERNATIONAL';
export const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'https://auth.viniciusint.com';
export const MEETING_URL =
  process.env.NEXT_PUBLIC_MEETING_URL ?? 'https://meet.viniciusint.com';
export const PLACEHOLDER_EMAIL =
  process.env.NEXT_PUBLIC_PLACEHOLDER_EMAIL ?? 'user@vinisuite.com';

// Server-only (Auth API for Zitadel user fetch)
// Falls back to NEXT_PUBLIC_AUTH_URL if not set
export const AUTH_API_URL =
  process.env.AUTH_API_URL ??
  process.env.NEXT_PUBLIC_AUTH_URL ??
  'https://auth.viniciusint.com';
