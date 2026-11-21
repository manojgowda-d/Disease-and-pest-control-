"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFarmerAuth } from "@/lib/auth-context";
import { loginFarmer } from "@/lib/api";
import {
  Sprout,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Lock
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useFarmerAuth();

  const [userId, setUserId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = userId.trim();
    const cleanMobile = mobileNumber.trim();

    if (!cleanId) {
      setErrorMsg("Please enter your Farmer / User ID.");
      return;
    }

    if (!cleanMobile) {
      setErrorMsg("Please enter your registered mobile number.");
      return;
    }

    try {
      setIsLoading(true);
      const profile = await loginFarmer(cleanId, cleanMobile);
      login(profile);
      router.push("/analyze");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in. Please check your credentials.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUserId("FARM-8821");
    setMobileNumber("9876543210");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-grid-pattern">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Farmer Access Portal
            </h2>
            <p className="text-xs text-slate-500">
              Sign in with your registered Farmer User ID & Mobile Number to access the diagnostic station.
            </p>
          </div>

          {/* Quick Demo Credentials Pill */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-900 block">
                College Evaluation / Demo Mode:
              </span>
              <span className="text-emerald-700 text-[11px]">
                ID: <strong>FARM-8821</strong> | Mobile: <strong>9876543210</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 shadow-2xs"
            >
              Auto-fill
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Farmer User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Farmer / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. FARM-8821 or your name"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating Grower Session...</span>
              ) : (
                <>
                  <span>Sign In to Diagnostic Station</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Link */}
          <div className="text-center pt-2">
            <Link
              href="/analyze"
              className="text-xs text-slate-500 hover:text-emerald-700 transition-colors"
            >
              Continue without signing in as Guest Grower →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
