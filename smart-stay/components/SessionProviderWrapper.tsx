"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationBell, NotificationToast } from "@/components/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

function NotificationSetup({ children }: { children: React.ReactNode }) {
  // Initialize real-time notifications
  useRealtimeNotifications();

  return (
    <>
      {children}
      <NotificationBell />
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
