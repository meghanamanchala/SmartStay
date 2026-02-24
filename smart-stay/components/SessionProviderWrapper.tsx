"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { NotificationProvider } from "@/context/NotificationContext";

import { NotificationBell, NotificationToast } from "@/components/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { usePathname } from "next/navigation";


function NotificationSetup({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  const pathname = usePathname();
  // Hide bell on main, login, and signup pages
  const hideBell = pathname === "/" || pathname === "/auth/login" || pathname === "/auth/signup";

  return (
    <>
      {children}
      {!hideBell && <NotificationBell />}
      <NotificationToast />
    </>
  );
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        <NotificationSetup>{children}</NotificationSetup>
      </NotificationProvider>
    </SessionProvider>
  );
}
