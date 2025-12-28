"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, LineChart, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api"; // เรียกใช้ตัวช่วยยิง API

export default function RegisterPage() {
  const router = useRouter();
  
  // 1. ตัวแปรเก็บข้อมูลที่กรอก (State)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // 2. ตัวแปรเช็คสถานะ (กำลังโหลด / มี Error)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ฟังก์ชันคอยจับว่าพิมพ์อะไรลงไป
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. ฟังก์ชัน "สมอง" เมื่อกดปุ่ม Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // ห้ามรีเฟรชหน้า
    setError("");
    setLoading(true);

    // เช็คว่ารหัสตรงกันไหม
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      // ส่งข้อมูลไปหา Python Backend
      await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // ถ้าผ่านฉลุย
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push("/login"); // เด้งไปหน้า Login

    } catch (err: any) {
      // ถ้ามีปัญหา (เช่น ชื่อซ้ำ)
      console.error("Register Error:", err.response?.data);
      // แสดงข้อความ Error ที่ Python ส่งกลับมา
      setError(err.response?.data?.detail || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-emerald-500 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <LineChart className="w-5 h-5 text-slate-950" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Ball-Insights
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">
            Join thousands of smart bettors today.
          </p>
        </div>

        {/* แสดง Error สีแดง ถ้ามี */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form เริ่มตรงนี้ */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                name="username" // ต้องมี name เพื่อให้ handleChange รู้จัก
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="BetMaster99"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* ปุ่ม Submit (เปลี่ยน type="button" เป็น "submit" แล้ว) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" /> Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}