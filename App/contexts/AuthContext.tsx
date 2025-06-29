import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  username: string | null;
  isAdmin: boolean;
  login: (token: string, username: string, isAdmin: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập khi app khởi động
    const checkLoginStatus = () => {
      const savedToken = global.token;
      const savedUsername = global.username;
      const savedIsAdmin = global.isAdmin;

      if (savedToken && savedUsername) {
        setToken(savedToken);
        setUsername(savedUsername);
        setIsAdmin(savedIsAdmin || false);
        setIsLoggedIn(true);
      }
    };

    checkLoginStatus();
  }, []);

  const login = (
    newToken: string,
    newUsername: string,
    newIsAdmin: boolean
  ) => {
    // Lưu vào global variables
    global.token = newToken;
    global.username = newUsername;
    global.isAdmin = newIsAdmin;

    // Cập nhật state
    setToken(newToken);
    setUsername(newUsername);
    setIsAdmin(newIsAdmin);
    setIsLoggedIn(true);
  };

  const logout = () => {
    // Xóa global variables
    global.token = undefined as any;
    global.username = undefined as any;
    global.isAdmin = undefined as any;

    // Reset state
    setToken(null);
    setUsername(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
  };

  const value: AuthContextType = {
    isLoggedIn,
    token,
    username,
    isAdmin,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
