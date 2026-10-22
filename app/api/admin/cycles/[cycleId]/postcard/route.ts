// API-23 손글씨 엽서 사진 업로드 (관리자) — 비공개 버킷, 회차당 1장 (D-025)
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam } from '@/lib/api/schemas';
import { POSTCARD_MAX_BYTES, POSTCARD_TYPES } from '@/lib/domain/limits';

const EXTENSION: Record<(typeof POSTCARD_TYPES)[number], string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

function isPostcardType(type: string): type is (typeof POSTCARD_TYPES)[number] {
    return (POSTCARD_TYPES as readonly string[]).includes(type);
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ cycleId: string }> },
) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File))
        return fail('VALIDATION_FAILED', { file: '파일을 골라 주세요.' });
    if (!isPostcardType(file.type))
        return fail('VALIDATION_FAILED', {
            file: 'jpg, png, webp 사진만 올릴 수 있어요.',
        });
    if (file.size > POSTCARD_MAX_BYTES)
        return fail('VALIDATION_FAILED', {
            file: '5MB 이하 사진만 올릴 수 있어요.',
        });

    // 업로드 전에 회차 상태 확인 (reading이 아니면 파일이 고아로 남지 않게)
    const { data: cycle } = await auth.supabase
        .from('subscription_cycles')
        .select('status')
        .eq('id', cycleId)
        .maybeSingle();
    if (!cycle) return fail('NOT_FOUND');
    if (cycle.status !== 'reading') return fail('INVALID_STATE');

    const path = `cycles/${cycleId}/postcard.${EXTENSION[file.type]}`;
    const upload = await auth.supabase.storage
        .from('postcards')
        .upload(path, file, { upsert: true, contentType: file.type });
    if (upload.error) {
        logServerError('API-23 업로드', upload.error);
        return fail('INTERNAL');
    }

    const { error } = await auth.supabase.rpc('admin_save_cycle_content', {
        p_cycle_id: cycleId,
        p_postcard_path: path,
    });
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-23', error);
        return fail(code);
    }
    return ok({ postcardPath: path });
}
