import { FarewellLetterEditor } from './FarewellLetterEditor';
import { DEFAULT_FAREWELL_LETTER } from '@/lib/content/defaultFarewellLetter';
import { getActiveSubscribersWithLetters } from '@/lib/data/admin';

// SCR-18 손님별 인사 편지 (Should)
export default async function FarewellLettersPage() {
    const subscribers = await getActiveSubscribersWithLetters();
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">마지막 인사 편지</h1>
            <p className="text-muted-foreground text-sm break-keep">
                손님이 구독을 마무리할 때 가장 먼저 보이는 편지예요. 미리 써
                두지 않으면 아래 기본 편지가 보여요.
            </p>
            <details className="rounded-xl border p-4">
                <summary className="cursor-pointer text-sm font-medium">
                    기본 편지 보기
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-relaxed whitespace-pre-line">
                    {DEFAULT_FAREWELL_LETTER}
                </p>
            </details>
            {subscribers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    구독 중인 손님이 없어요.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {subscribers.map((subscriber) => (
                        <FarewellLetterEditor
                            key={subscriber.userId}
                            userId={subscriber.userId}
                            name={subscriber.name}
                            initial={subscriber.farewellLetter}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
