import type { Metadata, Viewport } from "next";
import { Cascadia_Code } from "next/font/google";
import { SettingsProvider } from "./contexts/SettingsContext";
import "./globals.css";

// Configures the Cascadia Code font specifically for application use.
const cascadiaCode = Cascadia_Code({
  variable: "--font-cascadia-code",
  subsets: ["latin-ext"],
});

// Establishes the static viewport settings.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

// Provides generic site metadata and application manifest mappings.
export const metadata: Metadata = {
  title: "Floxt",
  description: "Fast and capable note-taking",
  manifest: "/manifest.json",
};

// Base layout structure wrapping the entire Next.js application.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cascadiaCode.variable} bg-transparent text-neutral-900 dark:text-white`}
      >
        {/* Wraps all routes with the custom Context Provider to distribute settings globally. */}
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}