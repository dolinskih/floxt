import type { Metadata } from "next";
import { Cascadia_Code } from "next/font/google";
import "./globals.css";

const cascadiaCode = Cascadia_Code({
  variable: "--font-cascadia-code",
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: "Floxt",
  description: "Fast and capable note-taking",
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
