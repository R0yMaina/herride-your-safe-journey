/** Trim and strip control chars. Not a substitute for server-side validation. */
export function sanitizeText(input: string): string {
  // eslint-disable-next-line no-control-regex -- stripping control chars is the point
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function sanitizeEmail(input: string): string {
  return sanitizeText(input).toLowerCase();
}

export function sanitizePhone(input: string): string {
  return sanitizeText(input).replace(/[^\d+]/g, "");
}
