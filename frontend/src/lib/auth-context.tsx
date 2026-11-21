"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { FarmerProfile } from "./api";

interface AuthContextType {
  farmer: FarmerProfile | null;
  login: (profile: FarmerProfile) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  farmer: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

const STORAGE_KEY = "plant_ai_farmer_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFarmer(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to restore farmer session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (profile: FarmerProfile) => {
    setFarmer(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save farmer session", e);
    }
  };

  const logout = () => {
    setFarmer(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear farmer session", e);
    }
  };

  return (
    <AuthContext.Provider value={{ farmer, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFarmerAuth() {
  return useContext(AuthContext);
}
