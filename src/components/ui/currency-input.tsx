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

        React.useEffect(() => {
            if (value !== undefined && value !== null) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                // Treat 0 as empty for display (shows placeholder)
                if (!isNaN(numValue) && numValue !== 0) {
                    setDisplayValue(formatCurrency(numValue));
                } else {
                    setDisplayValue('');
                }
            } else {
                setDisplayValue('');
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            setDisplayValue(inputValue);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
            if (value !== undefined && value !== null) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                // Show empty on focus when value is 0, so user can type freely
                if (!isNaN(numValue) && numValue !== 0) {
                    setDisplayValue(numValue.toString().replace('.', ','));
                } else {
                    setDisplayValue('');
                }
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
