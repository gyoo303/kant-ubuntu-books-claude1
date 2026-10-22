'use client';

import { useState, useSyncExternalStore } from 'react';
import type { BillingMethodChoice, ShippingAddress } from '@/types/domain';
import { API_ERRORS, isApiErrorCode } from '@/types/api';
import { EnvelopePost } from '@/components/EnvelopePost';
import { LetterPaper } from '@/components/LetterPaper';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { ShippingAddressFields } from '@/components/ShippingAddressFields';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { SUBSCRIPTION_NOTE } from '@/lib/content/policies';
import { openBillingAuth } from '@/lib/payments/tossClient';

const DRAFT_KEY = 'ubb-letter-draft-v1';

// 편지 쓰기 도움말 (설문이 아니라 쓸거리 제안, REQ-019)
const LETTER_TIPS = [
    '요즘 마음 날씨 — 맑음, 흐림, 가끔 비',
    '최근에 오래 남은 책이나 문장',
    '읽고 싶은 책의 결 — 조용한, 따뜻한, 단단한',
    '이번 달에는 피하고 싶은 이야기',
];

function readDraft(): string {
    try {
        return window.sessionStorage.getItem(DRAFT_KEY) ?? '';
    } catch {
        return '';
    }
}

const noSubscribe = () => () => undefined;

const BILLING_OPTIONS = [
    {
        value: 'card',
        label: '신용·체크카드',
        hint: '카드를 자동결제에 등록해요',
    },
    {
        value: 'naverpay',
        label: '네이버페이',
        hint: '네이버페이로 매달 결제해요',
    },
] as const;

// 구독 신청(첫 편지 + 카드 등록) 또는 다음 회차 편지
export function LetterForm({
    mode,
    storedLetter,
    address,
    errorCode,
}: {
    mode: 'signup' | 'next';
    storedLetter: { id: string; body: string } | null;
    address: ShippingAddress | null;
    errorCode: string | null;
}) {
    const [currentAddress, setCurrentAddress] = useState(address);
    const [pending, setPending] = useState(false);
    const [sent, setSent] = useState(false);
    const [billingMethod, setBillingMethod] =
        useState<BillingMethodChoice>('card');
    const [error, setError] = useState<string | null>(
        errorCode && isApiErrorCode(errorCode)
            ? API_ERRORS[errorCode].message
            : null,
    );
    // 카드 등록에서 돌아오면(실패) 쓴 편지를 되살린다 (AC-12-7). 서버 렌더에서는 빈 값.
    const draft = useSyncExternalStore(noSubscribe, readDraft, () => '');
    const initialBody = storedLetter?.body ?? draft;

    async function submitSignup(body: string) {
        setPending(true);
        setError(null);
        window.sessionStorage.setItem(DRAFT_KEY, body);
        const draft = await apiFetch<{ customerKey: string }>(
            '/api/subscriptions/draft',
            {
                method: 'PUT',
                body: jsonBody({ letterBody: body }),
            },
        );
        if (!draft.ok) {
            setError(draft.error.message);
            setPending(false);
            return;
        }
        try {
            await openBillingAuth(draft.data.customerKey, billingMethod);
        } catch (billingError) {
            setError(
                billingError instanceof Error
                    ? billingError.message
                    : '카드 등록창을 열지 못했어요.',
            );
            setPending(false);
        }
    }

    async function submitNext(body: string) {
        setPending(true);
        setError(null);
        const result = storedLetter
            ? await apiFetch(`/api/letters/${storedLetter.id}`, {
                  method: 'PATCH',
                  body: jsonBody({ body }),
              })
            : await apiFetch('/api/letters', {
                  method: 'POST',
                  body: jsonBody({ body }),
              });
        setPending(false);
        if (!result.ok) {
            setError(result.error.message);
            return;
        }
        setSent(true);
    }

    if (sent) return <EnvelopePost message="편지가 우체통에 들어갔어요" />;

    return (
        // 데스크톱: 왼쪽 편지지(줄 길이 40em 이하) + 오른쪽 안내, 모바일: 위아래
        <div className="grid gap-8 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
                <LetterPaper
                    key={initialBody}
                    initialBody={initialBody}
                    label={
                        mode === 'signup'
                            ? '책방지기에게 보내는 첫 편지'
                            : storedLetter
                              ? '보관한 다음 회차 편지'
                              : '이번 달 편지'
                    }
                    submitLabel="우체통에 편지 넣기"
                    pending={pending}
                    disabled={mode === 'signup' && !currentAddress}
                    onSubmit={mode === 'signup' ? submitSignup : submitNext}
                />
                {error ? (
                    <p
                        role="alert"
                        className="text-destructive rounded-lg border p-3 text-sm"
                    >
                        {error}
                    </p>
                ) : null}
            </div>

            <aside className="flex flex-col gap-4 lg:col-span-2">
                {mode === 'signup' ? (
                    <section className="bg-card flex flex-col gap-3 rounded-xl border p-5">
                        <h2 className="typo-h3">책을 받을 곳</h2>
                        {currentAddress ? (
                            <p className="text-ink-2 text-sm">
                                {currentAddress.recipientName} · (
                                {currentAddress.postalCode}){' '}
                                {currentAddress.address1}{' '}
                                {currentAddress.address2}
                            </p>
                        ) : (
                            <ShippingAddressFields
                                initial={null}
                                onSaved={setCurrentAddress}
                                submitLabel="이 주소로 받기"
                            />
                        )}
                        <PaymentMethodPicker
                            legend="매달 결제할 수단"
                            options={BILLING_OPTIONS}
                            value={billingMethod}
                            onChange={setBillingMethod}
                            disabled={pending}
                        />
                        <p className="text-muted-foreground text-xs">
                            우체통에 넣으면 고른 수단의 등록창이 열리고 첫 달이
                            결제돼요(테스트 모드). 카카오페이는 자동결제를
                            지원하지 않아요.
                        </p>
                    </section>
                ) : (
                    <section className="bg-card flex flex-col gap-2 rounded-xl border p-5">
                        <h2 className="typo-h3">이번 편지는</h2>
                        <p className="text-ink-2 text-sm">
                            책방지기가 아직 읽기 시작하지 않은 회차에 붙어요.
                            이미 읽는 중이면 다음 회차 편지로 보관돼요.
                        </p>
                    </section>
                )}
                <section className="bg-paper-2 flex flex-col gap-3 rounded-xl p-5">
                    <h2 className="typo-h3">이런 이야기를 적어 주세요</h2>
                    <ul className="text-ink-2 flex flex-col gap-2 text-sm">
                        {LETTER_TIPS.map((tip) => (
                            <li key={tip} className="flex gap-2">
                                <span className="text-olive" aria-hidden>
                                    ·
                                </span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted-foreground text-xs">
                        {SUBSCRIPTION_NOTE}
                    </p>
                </section>
            </aside>
        </div>
    );
}
