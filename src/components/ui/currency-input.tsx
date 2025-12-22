'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: number | string;
    onChange?: (value: number | undefined) => void;
    currency?: string;
    locale?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    (
        { className, value, onChange, currency = 'BRL', locale = 'pt-BR', ...props },
        ref
    ) => {
        const [displayValue, setDisplayValue] = React.useState('');
        const [isFocused, setIsFocused] = React.useState(false);

        const formatCurrency = (num: number): string => {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(num);
        };

        const parseCurrency = (str: string): number | undefined => {
            const cleanedValue = str.replace(/[^\d,.-]/g, '').replace(',', '.');
            const parsed = parseFloat(cleanedValue);
            return isNaN(parsed) ? undefined : parsed;
        };

        // Only update displayValue when not focused (to avoid overriding user input)
        React.useEffect(() => {
            if (isFocused) return; // Don't update while user is editing

            if (value !== undefined && value !== null) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                if (!isNaN(numValue)) {
                    // Always format the value, including zero
                    setDisplayValue(formatCurrency(numValue));
                } else {
                    setDisplayValue('');
                }
            } else {
                setDisplayValue('');
            }
        }, [value, isFocused]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            setDisplayValue(inputValue);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            const parsed = parseCurrency(displayValue);
            if (parsed !== undefined) {
                setDisplayValue(formatCurrency(parsed));
                onChange?.(parsed);
            } else if (displayValue === '') {
                onChange?.(undefined);
            }
            props.onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            if (value !== undefined && value !== null) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                if (!isNaN(numValue) && numValue !== 0) {
                    // Show numeric value for editing (use comma as decimal separator)
                    setDisplayValue(numValue.toFixed(2).replace('.', ','));
                } else {
                    // If value is 0 or invalid, show empty for better UX
                    setDisplayValue('');
                }
            } else {
                setDisplayValue('');
            }
            props.onFocus?.(e);
        };

        return (
            <Input
                ref={ref}
                className={cn('text-right', className)}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                inputMode="decimal"
                {...props}
            />
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
