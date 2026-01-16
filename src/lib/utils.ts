import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Tenta converter valores de OCR (que podem vir formatados como string) para number
 * Ex: "R$ 1.500,00" -> 1500
 * Ex: "1.500,00" -> 1500
 * Ex: 1500 -> 1500
 */
export function parseOcrNumber(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return undefined;

    // Remove caracteres de moeda e espaços
    let clean = value.replace(/[^\d.,-]/g, '').trim();

    // Se estiver vazio após limpeza
    if (!clean) return undefined;

    // Detecção heurística de formato:
    // Se tem vírgula como último separador, assume BR (1.000,00)
    // Se tem ponto como último separador, assume US (1,000.00)
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');

    if (lastComma > lastDot) {
        // Formato BR (Milhar.Decimal) -> Remove pontos, troca vírgula por ponto
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
        // Formato US (Milhar,Decimal) ou sem milhar -> Remove vírgulas
        clean = clean.replace(/,/g, '');
    }

    const num = Number(clean);
    return isNaN(num) ? undefined : num;
}
