import type { Metadata } from "next";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

import "./globals.css";


export const metadata: Metadata = {
  title: "My SmartStay App",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
