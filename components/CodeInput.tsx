'use client';

/**
 * 6자리 코드 입력칸 (출처: project_ubuntu_books/shopping-mall CodeInput)
 * 실제 입력은 보이지 않는 input 하나가 받고, 화면에는 6칸으로 나눠 보여준다.
 * 칸마다 input을 두면 포커스가 되돌아가거나 한글 입력기가 숫자를 한 번 더 넣는 문제가 생긴다.
 * input 하나로 받으면 붙여넣기·인증번호 자동 입력·Backspace가 브라우저 기본 동작으로 처리된다.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';

const CODE_LENGTH = 6;

export function CodeInput({
    value,
    onChange,
    disabled = false,
    invalid = false,
    describedBy,
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    invalid?: boolean;
    describedBy?: string;
}) {
    const [focused, setFocused] = useState(false);
    const activeIndex = Math.min(value.length, CODE_LENGTH - 1);

    return (
        <div className="relative w-full max-w-xs">
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2" aria-hidden>
                {Array.from({ length: CODE_LENGTH }, (_, index) => (
                    <div
                        key={index}
                        className={cn(
                            'border-line bg-card flex h-12 min-w-0 items-center justify-center rounded-lg border text-2xl font-medium transition-colors sm:h-14',
                            focused &&
                                index === activeIndex &&
                                'border-olive ring-olive-soft ring-4',
                            invalid && 'border-post',
                            disabled && 'bg-paper-2 text-muted-foreground',
                        )}
                    >
                        {value[index] ?? ''}
                    </div>
                ))}
            </div>
            <input
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                            .replace(/\D/g, '')
                            .slice(0, CODE_LENGTH),
                    )
                }
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="상자 속 손글씨 카드의 6자리 코드"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className="absolute inset-0 h-full w-full cursor-pointer text-transparent caret-transparent opacity-0 disabled:cursor-not-allowed"
            />
        </div>
    );
}
