import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobSearch",
  description: "AI-assisted international job search and application preparation",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
