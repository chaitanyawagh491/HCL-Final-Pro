/**
 * Offline SVG Avatars for HCL ERP Master System
 * High-definition vector circular avatars.
 * Completely offline, 0 network requests, 0 external image dependencies.
 */

export function createInitialsSvg(initials: string, startColor: string, endColor: string): string {
  const cleanInitials = (initials || 'CW').substring(0, 2).toUpperCase();
  const encodedStart = encodeURIComponent(startColor);
  const encodedEnd = encodeURIComponent(endColor);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' width='120' height='120'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${encodedStart}'/%3E%3Cstop offset='100%25' stop-color='${encodedEnd}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='60' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' dominant-baseline='middle' fill='%23FFFFFF' font-family='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' font-size='44' font-weight='700' letter-spacing='-0.5px'%3E${cleanInitials}%3C/text%3E%3C/svg%3E`;
}

// Chaitanya Santosh Wagh - Professional circular avatar with "CW" and blue gradient
export const CW_AVATAR = createInitialsSvg('CW', '#2563EB', '#1D4ED8');

// Other Demo Accounts - Offline SVGs
export const SARAH_AVATAR = createInitialsSvg('SJ', '#7C3AED', '#6D28D9');
export const RAJESH_AVATAR = createInitialsSvg('RP', '#059669', '#047857');
export const ELENA_AVATAR = createInitialsSvg('ER', '#EA580C', '#C2410C');
export const MARCUS_AVATAR = createInitialsSvg('MC', '#0284C7', '#0369A1');
export const VIKRAM_AVATAR = createInitialsSvg('VS', '#4F46E5', '#4338CA');

export const DEFAULT_AVATAR = CW_AVATAR;

