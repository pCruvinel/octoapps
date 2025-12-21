'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface PercentInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: number | string;
    onChange?: (value: number | undefined) => void;
    suffix?: string;
    decimalPlaces?: number;
    maxPercent?: number;
}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
    ({ className, value, onChange, suffix = '%', decimalPlaces = 2, maxPercent, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState('');

        const formatPercent = (num: number): string => {
            // Clamp decimalPlaces to valid range (0-20) for Intl.NumberFormat
            const safeDecimalPlaces = Math.min(20, Math.max(0, decimalPlaces ?? 2));
            const safeMinDigits = Math.min(2, safeDecimalPlaces);

            return new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: safeMinDigits,
                maximumFractionDigits: safeDecimalPlaces,
            }).format(num) + suffix;
        };

        const parsePercent = (str: string): number | undefined => {
            const cleanedValue = str.replace(/[^\d,.-]/g, '').replace(',', '.');
            const parsed = parseFloat(cleanedValue);
            if (isNaN(parsed)) return undefined;
            if (maxPercent !== undefined && parsed > maxPercent) return maxPercent;
            return parsed;
        };

        React.useEffect(() => {
            if (value !== undefined && value !== null) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                // Treat 0 as empty for display (shows placeholder)
                if (!isNaN(numValue) && numValue !== 0) {
                    setDisplayValue(formatPercent(numValue));
                } else {
                    setDisplayValue('');
                }
            } else {
                setDisplayValue('');
            }
        }, [value, decimalPlaces]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            setDisplayValue(inputValue);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const parsed = parsePercent(displayValue);
            if (parsed !== undefined) {
                setDisplayValue(formatPercent(parsed));
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

PercentInput.displayName = 'PercentInput';

export { PercentInput };
