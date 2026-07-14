const ADMIN_PASSWORD_KEY = 'dsa_admin_password';

export const setAdminPassword = (password: string) => {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
};

export const getAdminPassword = () => localStorage.getItem(ADMIN_PASSWORD_KEY) || '';

export const isAdminLoggedIn = () => Boolean(getAdminPassword());

export const clearAdminPassword = () => {
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
};
