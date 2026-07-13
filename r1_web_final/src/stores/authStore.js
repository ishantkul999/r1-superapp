import { create } from 'zustand';

// Restore session on page load
const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
})();
const storedToken = localStorage.getItem('accessToken');

const useAuthStore = create((set, get) => ({
  user: storedUser,
  role: storedUser?.role || null,
  accessToken: storedToken || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!(storedToken && storedUser),

  // Called after successful OTP verify — backend returns flat object:
  // { userId, phone, name, role, accessToken, refreshToken, isNewUser }
  setAuth: (user, accessToken, refreshToken) => {
    if (!user || !accessToken) return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken || '');
    localStorage.setItem('user', JSON.stringify(user));
    set({
      user,
      role: user.role,
      accessToken,
      refreshToken: refreshToken || null,
      isAuthenticated: true,
    });
  },

  // Update access token after refresh (keep same user)
  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    set({ accessToken });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, role: user.role });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
