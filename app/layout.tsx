import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotificationsProvider } from "./components/notifications-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global AI",
  description: "Portal para auditoria de agente AI",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen flex flex-col overflow-hidden">
        <NotificationsProvider>{children}</NotificationsProvider>
      </body>
    </html>
  );
}
