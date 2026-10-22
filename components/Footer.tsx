import Link from 'next/link';
import {
    ABOUT,
    BUSINESS_INFO,
    PRIVACY_NOTICE,
    REFUND_POLICY,
} from '@/lib/content/policies';

// KANT-R4, C7: 모든 화면 공통 하단 (디자인 출처: project_ubuntu_books/shopping-mall Footer)
// 사업자 정보·환불·개인정보 문구는 임시 원고 (Q-013)
const COLUMNS = [
    { title: '책방', lines: [ABOUT.address, ABOUT.hours] },
    { title: '환불 안내', lines: [REFUND_POLICY] },
    { title: '개인정보', lines: [PRIVACY_NOTICE] },
];

export default function Footer() {
    return (
        <footer className="bg-ink text-line mt-16 w-full pt-14 pb-7 text-xs leading-relaxed">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="border-ink-2 flex flex-col justify-between gap-10 border-b pb-8 md:flex-row">
                    <div className="shrink-0">
                        <p className="text-card mb-4 text-lg font-medium">
                            우분투북스
                        </p>
                        <p>
                            대전 어은동 골목의 작은 책방.
                            <br />
                            편지를 받고, 책으로 답장합니다.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 md:max-w-2xl">
                        {COLUMNS.map((column) => (
                            <div key={column.title}>
                                <h3 className="text-card mb-3 font-sans text-xs font-bold">
                                    {column.title}
                                </h3>
                                {column.lines.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col justify-between gap-4 pt-5 md:flex-row">
                    <p>{BUSINESS_INFO}</p>
                    <p className="shrink-0">
                        <Link
                            href="/about"
                            className="hover:text-card transition-colors"
                        >
                            책방 소개
                        </Link>
                        {' · '}
                        <Link
                            href="/subscribe"
                            className="hover:text-card transition-colors"
                        >
                            손편지 구독
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
