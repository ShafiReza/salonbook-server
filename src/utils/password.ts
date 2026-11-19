export const PASSWORD_RULE_MESSAGE =
  "Password must be at least 6 characters and include an uppercase and a lowercase letter";

export function isStrongPassword(pw: string): boolean {
  return pw.length >= 6 && pw.length <= 128 && /[A-Z]/.test(pw) && /[a-z]/.test(pw);
}
