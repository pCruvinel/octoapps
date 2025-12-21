
export interface BacenSeriePoint {
    data: string;
    valor: string;
}

export async function fetchBacenSeries(
    serieCode: number,
    startDate: string, // DD/MM/YYYY
    endDate: string    // DD/MM/YYYY
): Promise<BacenSeriePoint[]> {
    try {
        const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieCode}/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;

        console.log(`[BacenFetcher] Fetching series ${serieCode} from ${startDate} to ${endDate}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OctoApps-BacenSync/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`SGS API response not ok: ${response.status} ${response.statusText}`);
        }

        const data: BacenSeriePoint[] = await response.json();
        return data;

    } catch (error) {
        console.error(`[BacenFetcher] Error fetching series ${serieCode}:`, error);
        throw error;
    }
}

export function formatDateToBacen(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export function parseBacenValue(val: string): number {
    return parseFloat(val);
}
