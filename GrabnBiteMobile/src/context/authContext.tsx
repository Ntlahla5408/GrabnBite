import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { Platform } from "react-native";

import { login as loginApi } from "../services/authService";
import { LoginResponse, User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "grabnbite_token";
const USER_KEY = "grabnbite_user";

async function saveToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

async function saveUser(user: User) {
  if (Platform.OS === "web") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

async function getToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }

  return null;
}

async function getUser() {
  if (Platform.OS === "web") {
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }
  }

  return null;
}

async function removeSession() {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const storedToken = await getToken();
      const storedUser = await getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const cleanEmail = String(email).trim();
    const cleanPassword = String(password);

    console.log("AUTH CONTEXT:", {
      email: cleanEmail,
      passwordProvided: cleanPassword.length > 0,
    });

    const result = await loginApi(cleanEmail, cleanPassword);

    console.log("LOGIN RESULT:", {
  userId: result.userId,
  email: result.email,
  role: result.role,
  hasToken: !!result.token,
});

    const userData: User = {
      userId: result.userId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      role: result.role,
    };

    await saveToken(result.token);
    await saveUser(userData);

    setToken(result.token);
    setUser(userData);

    return result;
  }
  async function logout() {
    await removeSession();

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
