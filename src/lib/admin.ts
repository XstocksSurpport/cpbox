export const ADMIN_SESSION_KEY = 'cpbox_admin_auth';

export function verifyAdminPassword(password: string): boolean {
  return password === '450521';
}

export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

export function setAdminLoggedIn(loggedIn: boolean): void {
  if (loggedIn) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}
