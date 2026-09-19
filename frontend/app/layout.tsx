import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";

import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quorum GRC",
  description: "Enterprise governance, policy lifecycle, decision, and accountability management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body>
        <I18nProvider>
          <AuthProvider>
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
