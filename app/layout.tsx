import type { Metadata, Viewport } from "next";
import { Cascadia_Code } from "next/font/google";
import { SettingsProvider } from "./contexts/SettingsContext";
import Titlebar from "./Titlebar";
import "./globals.css";

const cascadiaCode = Cascadia_Code({
  variable: "--font-cascadia-code",
  subsets: ["latin-ext"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

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
    <html lang="en" className="dark">
      <body
        className={`${cascadiaCode.variable} m-0 p-0 overflow-hidden bg-transparent text-neutral-900 dark:text-white`}
      >
        {/* Pre-hydration splash overlay */}
        <div id="initial-loader">
          <img
            src="/floxt_icon_1024x1024.png"
            alt="Floxt"
            className="pulse-icon w-20 h-20 object-contain select-none pointer-events-none"
          />
        </div>

        <SettingsProvider>
          <Titlebar />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}