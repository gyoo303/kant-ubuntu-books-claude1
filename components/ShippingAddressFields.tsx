'use client';

import { useState } from 'react';
import type { ShippingAddress } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { PRIVACY_NOTICE } from '@/lib/content/policies';

const FIELDS = [
    {
        name: 'recipientName',
        label: '받는 분',
        autoComplete: 'name',
        placeholder: '김책방',
    },
    {
        name: 'phone',
        label: '연락처',
        autoComplete: 'tel',
        placeholder: '010-1234-5678',
    },
    {
        name: 'postalCode',
        label: '우편번호',
        autoComplete: 'postal-code',
        placeholder: '34141',
    },
    {
        name: 'address1',
        label: '주소',
        autoComplete: 'address-line1',
        placeholder: '대전 유성구 어은로 00',
    },
    {
        name: 'address2',
        label: '상세주소',
        autoComplete: 'address-line2',
        placeholder: '1층',
    },
] as const;

type FieldName = (typeof FIELDS)[number]['name'];

// 배송지 입력 묶음 (US-06). 저장하면 onSaved로 알린다. 오류는 칸 아래에 (AC-06-3)
export function ShippingAddressFields({
    initial,
    onSaved,
    submitLabel = '배송지 저장',
}: {
    initial: ShippingAddress | null;
    onSaved?: (address: ShippingAddress) => void;
    submitLabel?: string;
}) {
    const [values, setValues] = useState<Record<FieldName, string>>({
        recipientName: initial?.recipientName ?? '',
        phone: initial?.phone ?? '',
        postalCode: initial?.postalCode ?? '',
        address1: initial?.address1 ?? '',
        address2: initial?.address2 ?? '',
    });
    const [consent, setConsent] = useState(Boolean(initial));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function save(event: React.FormEvent) {
        event.preventDefault();
        setPending(true);
        setErrors({});
        setMessage(null);
        const result = await apiFetch<ShippingAddress>(
            '/api/me/shipping-address',
            {
                method: 'PUT',
                body: jsonBody({ ...values, consent }),
            },
        );
        setPending(false);
        if (!result.ok) {
            setErrors(
                Object.fromEntries(
                    Object.entries(result.error.details ?? {}).map(
                        ([key, value]) => [key, String(value)],
                    ),
                ),
            );
            setMessage(result.error.message);
            return;
        }
        setMessage('배송지를 저장했어요.');
        onSaved?.(result.data);
    }

    return (
        <form onSubmit={save} className="flex flex-col gap-3" noValidate>
            {FIELDS.map((field) => (
                <label key={field.name} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">{field.label}</span>
                    <Input
                        name={field.name}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        value={values[field.name]}
                        aria-invalid={Boolean(errors[field.name])}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                [field.name]: event.target.value,
                            }))
                        }
                    />
                    {errors[field.name] ? (
                        <span className="text-destructive">
                            {errors[field.name]}
                        </span>
                    ) : null}
                </label>
            ))}
            <label className="flex items-start gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-1"
                />
                <span className="break-keep">
                    배송을 위한 개인정보 수집에 동의합니다.{' '}
                    <span className="text-muted-foreground">
                        {PRIVACY_NOTICE}
                    </span>
                </span>
            </label>
            {errors.consent ? (
                <span className="text-destructive text-sm">
                    {errors.consent}
                </span>
            ) : null}
            <Button type="submit" disabled={pending}>
                {pending ? '저장하는 중…' : submitLabel}
            </Button>
            {message ? (
                <p role="status" className="text-muted-foreground text-sm">
                    {message}
                </p>
            ) : null}
        </form>
    );
}
