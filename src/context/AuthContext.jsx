import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    // Store access token in memory (not localStorage)
    window.__cosmos_access_token__ = userData.accessToken;
    // Store everything except the token in state (for UI use)
    const { accessToken, ...safeUser } = userData;
    setUser(safeUser);
  };

  const logout = () => {
    window.__cosmos_access_token__ = null;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};