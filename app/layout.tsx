import type { Metadata, Viewport } from "next";
import { Cascadia_Code } from "next/font/google";
import { SettingsProvider } from "./contexts/SettingsContext";
import Titlebar from "./components/layout/Titlebar";
import "./globals.css";

// Configure monospace font with CSS variable support and Latin Extended characters
const cascadiaCode = Cascadia_Code({
  variable: "--font-cascadia-code",
  subsets: ["latin-ext"],
});

// Set viewport configurations including browser/OS theme color for dark backgrounds
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

// Application metadata for SEO and progressive web app capabilities
export const metadata: Metadata = {
  title: "Floxt",
  description: "Fast and capable note-taking",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Default to dark mode class on html root
    <html lang="en" className="dark">
      <body
        className={`${cascadiaCode.variable} m-0 p-0 overflow-hidden bg-transparent text-neutral-900 dark:text-white`}
      >
        {/* Pre-hydration splash overlay displayed before Next.js/React finishes loading */}
        <div id="initial-loader">
          <img
            src="/floxt_icon_1024x1024.png"
            alt="Floxt"
            className="pulse-icon w-20 h-20 object-contain select-none pointer-events-none"
          />
        </div>

        {/* Global application settings context, custom desktop titlebar, and main view */}
        <SettingsProvider>
          <Titlebar />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}