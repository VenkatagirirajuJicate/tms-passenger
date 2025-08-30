import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import AutoLoginWrapper from "@/components/auto-login-wrapper";
import StudentRouteGuard from "@/components/student-route-guard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MYJKKN TMS - JKKN College Transport Portal",
  description: "Student transport booking and management portal",
  keywords: ["transport", "student", "booking", "management", "bus"],
  authors: [{ name: "JKKN College" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased h-full bg-gray-50 overflow-x-hidden`}
      >
        <AuthProvider
          autoValidate={true}
          autoRefresh={true}
          refreshInterval={10 * 60 * 1000} // 10 minutes
        >
          <ThemeProvider defaultTheme="system" storageKey="tms-passenger-theme">
            <AutoLoginWrapper>
              <StudentRouteGuard>
                <div id="root" className="h-full overflow-x-hidden">
                  {children}
                </div>
              </StudentRouteGuard>
            </AutoLoginWrapper>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  maxWidth: '90vw',
                  wordBreak: 'break-word',
                  zIndex: 9999,
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
