import type { Metadata } from 'next';
import { Nanum_Pen_Script, Noto_Sans_KR } from 'next/font/google';
import localFont from 'next/font/local';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeaderUser } from '@/components/HeaderUser';
import { getCurrentUser } from '@/lib/data/session';
import './globals.css';

// 인터페이스·본문 (font-sans)
const notoSansKr = Noto_Sans_KR({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap',
    variable: '--font-noto-sans-kr',
});

// 제목·편지 본문 (font-serif)
const ridiBatang = localFont({
    src: './fonts/RIDIBatang.woff2',
    weight: '400',
    display: 'swap',
    variable: '--font-ridi-batang',
});

// 손글씨 (font-hand) — 일부 화면에서만 쓰므로 preload하지 않음
const nanumPenScript = Nanum_Pen_Script({
    subsets: ['latin'],
    weight: '400',
    display: 'swap',
    preload: false,
    variable: '--font-nanum-pen-script',
});

export const metadata: Metadata = {
    title: '우분투북스',
    description: '대전 어은동 동네서점 우분투북스의 느린 온라인 책방',
};

// 세션 의존 부분만 Header 안의 <Suspense>에서 스트리밍된다 (CONV-03)
async function UserArea() {
    const user = await getCurrentUser();
    return <HeaderUser user={user} />;
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html
            lang="ko"
            className={`${notoSansKr.variable} ${ridiBatang.variable} ${nanumPenScript.variable} h-full antialiased`}
        >
            <body className="flex min-h-full flex-col break-keep">
                <Header userSlot={<UserArea />} />
                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
