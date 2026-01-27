"use client";


import { useState } from "react";
import { Mail, Lock, User, Eye, Briefcase, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [role, setRole] = useState("guest");
  const [agree, setAgree] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };
  
  return (
    <div className="min-h-screen flex font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      {/* Left: Image, logo, stats */}
      <div className="hidden md:flex w-1/2 relative bg-cover bg-center" style={{ backgroundImage: 'url(/property1.jpg)' }}>
        <div className="absolute inset-0 bg-teal-900/60" />
        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                <Home className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold">SmartStay</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-6">
              Find your perfect <span className="text-teal-200">getaway</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              Discover unique properties worldwide. Book with confidence, host with ease, and create unforgettable memories.
            </p>
          </div>
          <div className="flex gap-12 mt-16">
            <div>
              <div className="text-2xl font-bold text-teal-100">50K+</div>
              <div className="text-white/80">Properties</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-100">120K+</div>
              <div className="text-white/80">Guests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-100">98%</div>
              <div className="text-white/80">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Signup form */}
      <div className="flex-1 flex items-center justify-center bg-white/80 px-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 border border-teal-100">
          <h2 className="text-3xl font-bold mb-2 text-teal-700">Create an account</h2>
          <p className="text-teal-500 mb-8">Start your journey with SmartStay</p>
          {/* Role selection */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              className={`flex-1 border rounded-xl py-4 px-2 flex flex-col items-center font-medium transition ${role === "guest" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-teal-100 bg-white text-gray-700"}`}
              onClick={() => setRole("guest")}
            >
              <Briefcase className="w-7 h-7 mb-1" />
              Book stays
              <span className="block text-xs font-normal text-gray-400">Find perfect places</span>
            </button>
            <button
              type="button"
              className={`flex-1 border rounded-xl py-4 px-2 flex flex-col items-center font-medium transition ${role === "host" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-teal-100 bg-white text-gray-700"}`}
              onClick={() => setRole("host")}
            >
              <Home className="w-7 h-7 mb-1" />
              Host properties
              <span className="block text-xs font-normal text-gray-400">Earn from hosting</span>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block mb-2 font-medium text-teal-700">Full name</label>
              <div className="relative">
                <User className="w-4 h-4 text-teal-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full h-12 pl-11 pr-4 border rounded outline-none"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="block mb-2 font-medium text-teal-700">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-teal-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  className="w-full h-12 pl-11 pr-4 border rounded outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className="block mb-2 font-medium text-teal-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-teal-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={show ? "text" : "password"}
                  className="w-full h-12 pl-11 pr-10 border rounded outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Eye
                  onClick={() => setShow(!show)}
                  className="w-4 h-4 text-teal-400 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                />
              </div>
              <div className="text-xs text-teal-400 mt-1">Must be at least 8 characters</div>
            </div>
            {/* Terms and Policy */}
            <div className="flex items-center gap-2 text-sm">
              <input type="checkbox" id="agree" checked={agree} onChange={e => setAgree(e.target.checked)} className="accent-teal-500" />
              <label htmlFor="agree">
                I agree to the <a href="#" className="text-teal-500 font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-teal-500 font-medium hover:underline">Privacy Policy</a>
              </label>
            </div>
            {/* Sign up */}
            <button
              type="submit"
              disabled={!agree}
              className="w-full h-12 rounded-xl bg-teal-500 text-white font-semibold text-md shadow-md hover:bg-teal-600 transition disabled:opacity-60"
            >
              Create account
            </button>
            {/* Divider */}
            {/* <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-teal-100" />
              <span className="text-teal-400">Or continue with</span>
              <div className="flex-1 h-px bg-teal-100" />
            </div> */}
            {/* Google Auth */}
            {/* <button
              type="button"
              className="w-full h-12 rounded-xl border border-teal-200 flex items-center justify-center gap-3 font-semibold hover:bg-teal-50 transition"
            >
              <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button> */}
          </form>
          <div className="mt-8 text-center text-teal-700 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-teal-500 font-semibold hover:underline cursor-pointer">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
