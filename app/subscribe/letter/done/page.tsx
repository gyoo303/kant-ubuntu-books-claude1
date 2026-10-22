import { ClearLetterDraft } from './ClearLetterDraft';
import { EnvelopePost } from '@/components/EnvelopePost';

// 구독 신청 완료: 카드 등록·첫 결제 성공 후 봉투 전환 (AC-12-3)
export default function LetterDonePage() {
    return (
        <>
            <ClearLetterDraft />
            <EnvelopePost message="편지가 우체통에 들어갔어요. 구독이 시작되었습니다." />
        </>
    );
}
