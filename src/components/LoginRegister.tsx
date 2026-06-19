import React, { useState } from "react";
import { UserRole } from "../types";
import { Mail, Lock, User, Shield, ArrowRight, Loader2, Landmark } from "lucide-react";

interface LoginRegisterProps {
  onLoginSuccess: (token: string, user: { _id: string; name: string; email: string; role: UserRole }) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>("Student");
  
  // Input fields
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  // Status states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  // Direct quick entry logins helper
  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic client input validation
    if (!email || !password) {
      setErrorMessage("Please fill down all credentials.");
      return;
    }
    if (!isLogin && !name) {
      setErrorMessage("Please supply a valid display name.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin 
        ? { email, password } 
        : { name, email, password, role };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unexpected system transition occurred.");
      }

      setSuccessMessage(isLogin ? "Welcome back! Directing to workspace..." : "Account created successfully! Directing...");
      
      // Delay slightly for visual effect then transition
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 700);

    } catch (err: any) {
      setErrorMessage(err.message || "Failed connecting to MERN gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div>
          {/* Logo / Header */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white mx-auto shadow-sm">
            <Landmark className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            {isLogin ? "Sign in to CCMS" : "Register CCMS Account"}
          </h2>
          <p className="mt-2 text-center text-xs text-slate-500">
            Campus Complaint Management System
          </p>
        </div>

        {/* Normal Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-600 border border-emerald-100">
              {successMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Show selection of Role only for registration */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Register Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("Student")}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                      role === "Student"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <User className="h-4 w-4 mr-1.5" />
                    Student Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("Admin")}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                      role === "Admin"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-1.5" />
                    College Admin
                  </button>
                </div>
              </div>
            )}

            {/* Name Input on Register */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="email-address">
                College Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email-address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu or admin@college.edu"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="password-phrase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password-phrase"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-1" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Register"}
                <ArrowRight className="ml-2 h-4.5 w-4.5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isLogin ? "No account? Register one now" : "Already have an account? Sign In"}
          </button>
        </div>

        {/* Quick Demo Accounts Helpers */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-3 text-center">
            Deploy Developer Quick-Login Credits
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin("student@college.edu", "student123")}
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-left hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors cursor-pointer group"
            >
              <p className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700">Student Account</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">student@college.edu</p>
              <p className="text-[10px] font-mono text-slate-400">Pass: student123</p>
            </button>
            <button
              onClick={() => handleQuickLogin("admin@college.edu", "admin123")}
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-left hover:bg-emerald-50/50 hover:border-emerald-100 transition-colors cursor-pointer group"
            >
              <p className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700">Admin Account</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">admin@college.edu</p>
              <p className="text-[10px] font-mono text-slate-400">Pass: admin123</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
