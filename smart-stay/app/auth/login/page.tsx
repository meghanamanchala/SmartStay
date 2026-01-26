"use client";

import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, Eye } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // You may want to keep next-auth credentials login or migrate to Clerk's email/password
    // For Clerk, you would use signIn.create({ identifier, password })
    // This is a placeholder for Clerk email/password login if needed
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* LEFT */}
      <div
        className="hidden md:flex w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url(/login-bg.jpg)" }}
      >
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-xl">
                🏠
              </div>
              <span className="text-2xl font-bold">SmartStay</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight mb-6">
              Find your perfect{" "}
              <span className="text-accent">getaway</span>
            </h1>

            <p className="text-lg text-white/80 max-w-md">
              Discover unique properties worldwide. Book with confidence, host
              with ease, and create unforgettable memories.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-white/70">Properties</div>
            </div>
            <div>
              <div className="text-2xl font-bold">120K+</div>
              <div className="text-white/70">Guests</div>
            </div>
            <div>
              <div className="text-2xl font-bold">98%</div>
              <div className="text-white/70">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-secondary-text">
            Welcome back
          </h2>
          <p className="text-secondary-text/70 mb-10">
            Sign in to continue to SmartStay
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block mb-2 font-medium text-secondary-text">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-secondary focus:ring-2 focus:ring-accent outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 font-medium text-secondary-text">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={show ? "text" : "password"}
                  className="w-full h-12 pl-11 pr-10 rounded-xl border border-secondary focus:ring-2 focus:ring-accent outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Eye
                  onClick={() => setShow(!show)}
                  className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-accent" />
                Remember me
              </label>
              <a className="text-accent font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Sign in */}
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-accent text-black font-semibold text-md shadow-md hover:opacity-90 transition"
            >
              Sign in
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-secondary" />
              <span className="text-secondary-text/60">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-secondary" />
            </div>

            {/* Clerk Google Auth */}
            <SignInButton
              mode="modal"
              forceRedirectUrl="/dashboard/profile"
            >
              <button
                type="button"
                className="w-full h-12 rounded-xl border border-secondary flex items-center justify-center gap-3 font-semibold hover:bg-gray-50 transition"
              >
                <img src="/google-icon.svg" className="w-5 h-5" />
                Continue with Google
              </button>
            </SignInButton>
          </form>

          <p className="mt-8 text-center text-secondary-text">
            Don't have an account?{" "}
            <span className="text-accent font-semibold hover:underline cursor-pointer">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
