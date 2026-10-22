'use client';

import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

// 결제 수단 고르기 (출처: project_ubuntu_books/shopping-mall CheckoutSections의 결제 수단 버튼)
// 열 수는 화면이 아니라 놓인 칸의 폭으로 정한다 (컨테이너 쿼리)
export interface PaymentOption<T extends string> {
    value: T;
    label: string;
    hint: string;
}

export function PaymentMethodPicker<T extends string>({
    legend,
    options,
    value,
    onChange,
    disabled = false,
}: {
    legend: string;
    options: readonly PaymentOption<T>[];
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}) {
    return (
        <fieldset
            className="@container flex flex-col gap-2"
            disabled={disabled}
        >
            <legend className="mb-2 font-medium">{legend}</legend>
            <div
                className={cn(
                    'grid gap-2',
                    options.length === 2
                        ? '@xs:grid-cols-2'
                        : '@lg:grid-cols-3',
                )}
            >
                {options.map((option) => {
                    const selected = option.value === value;
                    return (
                        <label
                            key={option.value}
                            className={cn(
                                'bg-card flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors has-focus-visible:ring-4',
                                selected
                                    ? 'border-olive ring-olive-soft ring-2'
                                    : 'hover:border-ink-2',
                            )}
                        >
                            <input
                                type="radio"
                                name={legend}
                                value={option.value}
                                checked={selected}
                                onChange={() => onChange(option.value)}
                                className="sr-only"
                            />
                            <span className="flex items-center gap-2 text-sm font-bold">
                                {option.value === 'card' ? (
                                    <CreditCard
                                        className="size-4"
                                        aria-hidden
                                    />
                                ) : null}
                                {option.label}
                            </span>
                            <span className="text-ink-2 text-xs">
                                {option.hint}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
