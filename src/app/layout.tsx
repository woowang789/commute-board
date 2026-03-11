import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { UserIdInitializer } from "@/components/UserIdInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commute Board",
  description: "서울 출퇴근 교통 정보 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${dmSans.variable} antialiased`}
      >
        <UserIdInitializer>{children}</UserIdInitializer>
      </body>
    </html>
  );
}
