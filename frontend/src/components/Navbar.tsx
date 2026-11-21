"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sprout,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  User,
  LogOut,
  Cpu,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { useFarmerAuth } from "@/lib/auth-context";
import { getHealthStatus, HealthResponse } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const { farmer, logout } = useFarmerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      const data = await getHealthStatus();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll every 30 seconds for live health status
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isBackendOnline = !!health && health.status === "ok";
  const isDiseaseLoaded = health?.disease_model?.loaded;
  const isPestLoaded = health?.pest_model?.loaded;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  AgroVision <span className="text-emerald-600">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Computer Vision
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Plant Disease & Pest Diagnostic Engine
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/analyze"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/analyze"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              Analyze Crop
            </Link>
          </nav>

          {/* Right Status & Farmer Profile */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Model Status Indicator with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isBackendOnline
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
                title="Click to inspect model loading details"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>
                  {isBackendOnline ? "AI Engine Online" : "Backend Offline"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {statusDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-xs"
                  onMouseLeave={() => setStatusDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-emerald-600" /> Model Pipeline
                    </span>
                    <button
                      onClick={fetchHealth}
                      disabled={healthLoading}
                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                      title="Refresh status"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          healthLoading ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-medium text-slate-800">
                          ResNet18 Disease
                        </div>
                        <div className="text-[11px] text-slate-500">
                          3-Class Classifier (84% Base)
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isDiseaseLoaded
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isDiseaseLoaded ? "Ready" : "Pending Weights"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-medium text-slate-800">
                          Pest Detection Model
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {health?.pest_model?.classes ? `${health.pest_model.classes.length}-Class Detector` : "Bounding Box & Classifier"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isPestLoaded
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isPestLoaded ? "Ready" : "Not Configured"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Farmer Auth Pill */}
            {farmer ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">{farmer.user_id}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">{farmer.mobile_number}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Log out farmer session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Farmer Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-emerald-700 rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-slate-700 hover:text-emerald-700"
          >
            Dashboard
          </Link>
          <Link
            href="/analyze"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-slate-700 hover:text-emerald-700"
          >
            Analyze Crop
          </Link>

          <div className="pt-3 border-t border-slate-100">
            {farmer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {farmer.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ID: {farmer.user_id} • {farmer.mobile_number}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-medium px-2 py-1 rounded bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm"
              >
                Farmer Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
