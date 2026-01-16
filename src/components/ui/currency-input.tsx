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

        // Helper to format a number as currency string
        const formatCurrency = React.useCallback((val: number) => {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(val);
        }, [currency, locale]);

        // Effect to sync external value changes to internal display state
        React.useEffect(() => {
            if (value !== undefined && value !== null) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                if (!isNaN(numValue)) {
                    setDisplayValue(formatCurrency(numValue));
                } else {
                    setDisplayValue('');
                }
            } else {
                setDisplayValue('');
            }
        }, [value, formatCurrency]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // 1. Get only numbers from input
            let numericValue = e.target.value.replace(/\D/g, '');

            // 2. Handle backspace on empty or small numbers
            if (numericValue.length === 0) {
                setDisplayValue('');
                onChange?.(undefined);
                return;
            }

            // 3. Convert to float (treat as cents)
            const floatValue = parseInt(numericValue, 10) / 100;

            // 4. Update display and parent
            setDisplayValue(formatCurrency(floatValue));
            onChange?.(floatValue);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            // Clear field if value is 0 to make typing easier
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (numValue === 0 || numValue === undefined || numValue === null) {
                setDisplayValue('');
            }
            props.onFocus?.(e);
        };

        return (
            <Input
                ref={ref}
                className={cn('text-right font-mono', className)} // font-mono helps alignment
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                inputMode="numeric"
                placeholder={props.placeholder || formatCurrency(0)}
                {...props}
            />
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
