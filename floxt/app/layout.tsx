import type { Metadata, Viewport } from "next";
import { Cascadia_Code } from "next/font/google";
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
    <html lang="en">
      <body
        className={`${cascadiaCode.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
