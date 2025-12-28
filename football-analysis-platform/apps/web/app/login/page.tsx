"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, LineChart, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api"; // Import our new API client

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Call Backend
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // 2. Store Token
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(response.data));

      // 3. Redirect to Dashboard
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Login failed", err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <LineChart className="w-5 h-5 text-slate-950" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold text-white">Ball-Insights</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log In"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}