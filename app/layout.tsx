import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { PetProfileBanner } from "@/components/PetProfileBanner";
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
  title: "PawCheck — 반려동물 출입 규정 체크",
  description:
    "반려동물 동반 시설의 출입 규정을 표준화하고, 내 반려동물 조건에 맞춰 입장 가능 여부를 사전에 예측합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              🐾 PawCheck
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link href="/facilities" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                시설 목록
              </Link>
              <Link href="/pet-profile" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                내 반려동물 설정
              </Link>
            </nav>
          </div>
        </header>
        <PetProfileBanner />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-black/10 py-6 text-center text-xs text-black/50 dark:border-white/10 dark:text-white/50">
          데이터 출처: 한국관광공사 반려동물 동반여행 서비스(KorPetTourService2) — 정보는 현재까지 확인된 내용 기준이며, 방문 전 시설에 재확인을 권장합니다.
        </footer>
      </body>
    </html>
  );
}
