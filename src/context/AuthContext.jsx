import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../api/services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const setSession = (authData) => {
    window.__cosmos_access_token__ = authData.accessToken;
    const safeUser = {
      username: authData.username,
      name: authData.fullName || authData.username,
      email: authData.email,
      role: authData.role,
    };
    setUser(safeUser);
    return safeUser;
  };

  useEffect(() => {
    let active = true;
    authService.getCurrentUser()
      .then(({ data }) => {
        if (active) setSession(data);
      })
      .catch(() => {
        window.__cosmos_access_token__ = null;
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => { active = false; };
  }, []);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    return setSession(data);
  };

  const updateProfile = async (profile) => {
    await authService.updateProfile(profile);
    const updatedUser = {
      ...user,
      name: profile.fullName.trim(),
      email: profile.email.trim().toLowerCase(),
    };
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      window.__cosmos_access_token__ = null;
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, updateProfile, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

// The provider and its context hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};