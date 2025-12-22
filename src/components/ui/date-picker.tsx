'use client';

import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: string; // ISO date string (YYYY-MM-DD) or empty
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [displayValue, setDisplayValue] = React.useState('');

  // Parse ISO string to display format
  React.useEffect(() => {
    if (value) {
      try {
        const date = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
          setDisplayValue(format(date, 'dd/MM/yyyy'));
        }
      } catch {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Format input as user types (auto-add slashes)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove non-numeric except slashes
    input = input.replace(/[^\d/]/g, '');

    // Auto-format: add slashes as user types
    const numbers = input.replace(/\//g, '');
    if (numbers.length <= 2) {
      input = numbers;
    } else if (numbers.length <= 4) {
      input = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      input = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }

    setDisplayValue(input);
  };

  // Parse and validate on blur
  const handleBlur = () => {
    if (!displayValue) {
      onChange?.(undefined);
      return;
    }

    // Try to parse DD/MM/YYYY
    try {
      const date = parse(displayValue, 'dd/MM/yyyy', new Date());
      if (isValid(date)) {
        const year = date.getFullYear();
        // Validate year is reasonable (1900-2100)
        if (year < 1900 || year > 2100) {
          console.warn(`[DatePicker] Invalid year ${year}, resetting`);
          setDisplayValue('');
          onChange?.(undefined);
          return;
        }
        // Return ISO format for internal storage
        onChange?.(format(date, 'yyyy-MM-dd'));
        // Update display with formatted date
        setDisplayValue(format(date, 'dd/MM/yyyy'));
      } else {
        // Invalid date - clear
        setDisplayValue('');
        onChange?.(undefined);
      }
    } catch {
      setDisplayValue('');
      onChange?.(undefined);
    }
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={10}
      className={cn('font-mono', className)}
    />
  );
}

DatePicker.displayName = 'DatePicker';
