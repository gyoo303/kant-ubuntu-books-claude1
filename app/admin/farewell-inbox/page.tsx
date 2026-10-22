import { getFarewellInbox } from '@/lib/data/admin';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
});

// SCR-19 작별 편지함 (Should, US-24)
export default async function FarewellInboxPage() {
    const notes = await getFarewellInbox();
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">작별 편지함</h1>
            {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    아직 받은 작별 편지가 없어요.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {notes.map((note) => (
                        <li
                            key={`${note.createdAt}-${note.name}`}
                            className="flex flex-col gap-2 rounded-xl border p-4"
                        >
                            <span className="text-muted-foreground text-sm">
                                {dateFormat.format(new Date(note.createdAt))} ·{' '}
                                {note.name}
                            </span>
                            <p className="max-w-xl leading-relaxed break-keep whitespace-pre-line">
                                {note.body || '남긴 글 없음'}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
