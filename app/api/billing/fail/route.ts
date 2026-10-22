// API-09 카드 등록 실패·취소 리다이렉트
import { redirectTo } from '@/lib/api/http';

export async function GET(request: Request) {
    return redirectTo(request, '/subscribe/letter?error=PAYMENT_FAILED');
}
