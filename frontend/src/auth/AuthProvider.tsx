import {
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import api from "../api/api";
import AuthContext from "./AuthContext";
import type {
  CurrentUser,
} from "./authTypes";

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({
  children,
}: AuthProviderProps) {
  const hasStoredToken =
    Boolean(
      localStorage.getItem("token")
    );

  const [user, setUser] =
    useState<CurrentUser | null>(
      null
    );

  const [loading, setLoading] =
    useState(hasStoredToken);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    api
      .get<CurrentUser>("/users/me")
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem(
          "token"
        );

        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (
    email: string,
    password: string
  ) => {
    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

    localStorage.setItem(
      "token",
      response.data.token
    );

    const userResponse =
      await api.get<CurrentUser>(
        "/users/me"
      );

    setUser(userResponse.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;