"use client";


import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, Eye } from "lucide-react";
import { signIn } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      // Fetch session to get user role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "host") {
        router.push("/host/dashboard");
      } else {
        router.push("/guest/dashboard");
      }
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <div
        className="hidden md:flex w-1/2 relative bg-gradient-to-br from-teal-400 to-teal-600 items-center justify-center"
      >
        <div className="absolute inset-0 bg-teal-700/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full w-full">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                🏠
              </div>
              <span className="text-2xl font-bold tracking-tight">SmartStay</span>
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

      <div className="flex-1 flex items-center justify-center bg-white/80 px-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 border border-teal-100">
          <h2 className="text-3xl font-bold mb-2 text-teal-700">Welcome back</h2>
          <p className="text-teal-500 mb-10">Sign in to continue to SmartStay</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div>
              <label className="block mb-2 font-medium text-teal-700">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  className="w-full h-12 pl-11 pr-4 border rounded outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium text-teal-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={show ? "text" : "password"}
                  className="w-full h-12 pl-11 pr-10 border rounded outline-none"
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
                <input type="checkbox" className="accent-teal-500" />
                Remember me
              </label>
              <a className="text-teal-500 font-semibold hover:underline cursor-pointer">Forgot password?</a>
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-teal-500 text-white font-semibold text-md shadow-md hover:bg-teal-600 transition"
            >
              Sign in
            </button>
          </form>
          <p className="mt-8 text-center text-teal-700">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-teal-500 font-semibold hover:underline cursor-pointer">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
