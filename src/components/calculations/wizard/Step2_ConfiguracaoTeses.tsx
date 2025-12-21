'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PercentInput } from '@/components/ui/percent-input';
import { AlertTriangle, Info, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Schema de validação
const step2Schema = z.object({
    capitalizacao: z.enum(['MENSAL', 'DIARIA']),
    sistemaAmortizacao: z.enum(['PRICE', 'SAC', 'SACRE', 'GAUSS']),
    usarTaxaBacen: z.boolean(),
    thresholdAbuso: z.number().min(1).max(5),
    taxaMensalContrato: z.number().min(0).max(100),
    taxaAnualContrato: z.number().min(0).max(1000),
    repetirEmDobro: z.boolean(),
});

export type Step2Data = z.infer<typeof step2Schema>;

interface Step2_ConfiguracaoTesesProps {
    defaultValues?: Partial<Step2Data>;
    onDataChange?: (data: Step2Data) => void;
    onValidationChange?: (isValid: boolean) => void;
}

const SISTEMAS_AMORTIZACAO = [
    { value: 'PRICE', label: 'Tabela Price (Francês)', description: 'Parcelas fixas, juros decrescentes' },
    { value: 'SAC', label: 'SAC', description: 'Amortização constante, parcelas decrescentes' },
    { value: 'SACRE', label: 'SACRE', description: 'Variação do SAC com ajuste' },
    { value: 'GAUSS', label: 'Método de Gauss (Juros Simples)', description: 'Sem capitalização composta' },
];

export function Step2_ConfiguracaoTeses({
    defaultValues,
    onDataChange,
    onValidationChange,
}: Step2_ConfiguracaoTesesProps) {
    const [capitalizacaoDiariaDetectada, setCapitalizacaoDiariaDetectada] = React.useState(false);

    const {
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<Step2Data>({
        resolver: zodResolver(step2Schema),
        mode: 'onChange',
        defaultValues: {
            capitalizacao: 'MENSAL',
            sistemaAmortizacao: 'PRICE',
            usarTaxaBacen: true,
            thresholdAbuso: 1.5,
            taxaMensalContrato: 0,
            taxaAnualContrato: 0,
            repetirEmDobro: false,
            ...defaultValues,
        },
    });

    const watchedValues = watch();

    // Notifica mudança de validação
    React.useEffect(() => {
        onValidationChange?.(isValid);
    }, [isValid, onValidationChange]);

    // Notifica mudança de dados
    React.useEffect(() => {
        if (isValid) {
            onDataChange?.(watchedValues as Step2Data);
        }
    }, [watchedValues, isValid, onDataChange]);

    // Detecta capitalização diária automaticamente
    // Se (1 + taxaMensal)^12 < taxaAnual, há capitalização diária
    React.useEffect(() => {
        const { taxaMensalContrato, taxaAnualContrato } = watchedValues;

        if (taxaMensalContrato > 0 && taxaAnualContrato > 0) {
            const mensalDecimal = taxaMensalContrato / 100;
            const anualDecimal = taxaAnualContrato / 100;

            // Calcula a taxa anual esperada com capitalização mensal
            const taxaAnualEsperada = Math.pow(1 + mensalDecimal, 12) - 1;

            // Se a taxa anual informada é maior que a esperada, há capitalização diária
            if (anualDecimal > taxaAnualEsperada * 1.02) { // 2% de tolerância
                setCapitalizacaoDiariaDetectada(true);
                // Ativa automaticamente
                if (watchedValues.capitalizacao !== 'DIARIA') {
                    setValue('capitalizacao', 'DIARIA', { shouldValidate: true });
                }
            } else {
                setCapitalizacaoDiariaDetectada(false);
            }
        }
    }, [watchedValues.taxaMensalContrato, watchedValues.taxaAnualContrato, setValue, watchedValues.capitalizacao]);

    return (
        <div className="space-y-6">
            {/* Alerta de Capitalização Diária Detectada */}
            {capitalizacaoDiariaDetectada && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                        Capitalização Diária Detectada
                        <Badge variant="outline" className="text-amber-600 border-amber-400">
                            Automático
                        </Badge>
                    </AlertTitle>
                    <AlertDescription>
                        A taxa anual informada ({watchedValues.taxaAnualContrato.toFixed(2)}%) é maior que o esperado
                        pela capitalização mensal ({((Math.pow(1 + watchedValues.taxaMensalContrato / 100, 12) - 1) * 100).toFixed(2)}%).
                        Isso indica provável <strong>capitalização diária</strong>. A tese foi ativada automaticamente.
                    </AlertDescription>
                </Alert>
            )}

            {/* Taxas do Contrato */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Taxas do Contrato
                    </CardTitle>
                    <CardDescription>
                        Informe as taxas exatamente como constam no contrato
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="taxaMensalContrato">Taxa Mensal (%)</Label>
                        <PercentInput
                            id="taxaMensalContrato"
                            value={watchedValues.taxaMensalContrato}
                            onChange={(value) => setValue('taxaMensalContrato', value || 0, { shouldValidate: true })}
                            decimalPlaces={4}
                            maxPercent={50}
                            placeholder="0,0000%"
                        />
                        {errors.taxaMensalContrato && (
                            <p className="text-sm text-red-500">{errors.taxaMensalContrato.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="taxaAnualContrato">Taxa Anual (%)</Label>
                        <PercentInput
                            id="taxaAnualContrato"
                            value={watchedValues.taxaAnualContrato}
                            onChange={(value) => setValue('taxaAnualContrato', value || 0, { shouldValidate: true })}
                            decimalPlaces={2}
                            maxPercent={500}
                            placeholder="0,00%"
                        />
                        {errors.taxaAnualContrato && (
                            <p className="text-sm text-red-500">{errors.taxaAnualContrato.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Configuração de Teses */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuração de Teses</CardTitle>
                    <CardDescription>
                        Defina os parâmetros para o recálculo revisional
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Capitalização */}
                    <div className="space-y-3">
                        <Label>Tipo de Capitalização</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('capitalizacao', 'MENSAL', { shouldValidate: true })}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${watchedValues.capitalizacao === 'MENSAL'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                                    }`}
                            >
                                <div className="font-medium">Mensal</div>
                                <div className="text-sm text-slate-500">Padrão bancário</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue('capitalizacao', 'DIARIA', { shouldValidate: true })}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${watchedValues.capitalizacao === 'DIARIA'
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                                    }`}
                            >
                                <div className="font-medium flex items-center gap-2">
                                    Diária
                                    {capitalizacaoDiariaDetectada && (
                                        <Badge variant="secondary" className="text-xs">Detectada</Badge>
                                    )}
                                </div>
                                <div className="text-sm text-slate-500">Tese de expurgo</div>
                            </button>
                        </div>
                    </div>

                    {/* Sistema de Amortização */}
                    <div className="space-y-2">
                        <Label htmlFor="sistemaAmortizacao">Sistema de Amortização</Label>
                        <Select
                            value={watchedValues.sistemaAmortizacao}
                            onValueChange={(value) => setValue('sistemaAmortizacao', value as Step2Data['sistemaAmortizacao'], { shouldValidate: true })}
                        >
                            <SelectTrigger id="sistemaAmortizacao">
                                <SelectValue placeholder="Selecione o sistema" />
                            </SelectTrigger>
                            <SelectContent>
                                {SISTEMAS_AMORTIZACAO.map((sistema) => (
                                    <SelectItem key={sistema.value} value={sistema.value}>
                                        <div className="flex flex-col">
                                            <span>{sistema.label}</span>
                                            <span className="text-xs text-slate-400">{sistema.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Threshold de Abuso */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Threshold de Abusividade</Label>
                            <Badge variant="outline">
                                {watchedValues.thresholdAbuso.toFixed(1)}x da média
                            </Badge>
                        </div>
                        <Slider
                            value={[watchedValues.thresholdAbuso]}
                            onValueChange={([value]) => setValue('thresholdAbuso', value, { shouldValidate: true })}
                            min={1}
                            max={3}
                            step={0.1}
                            className="w-full"
                        />
                        <p className="text-sm text-slate-500">
                            Taxa será considerada abusiva se for {watchedValues.thresholdAbuso.toFixed(1)}x maior que a média Bacen.
                        </p>
                    </div>

                    {/* Switches */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Usar Taxa Média Bacen</Label>
                                <p className="text-sm text-slate-500">
                                    Substituir taxa abusiva pela média de mercado
                                </p>
                            </div>
                            <Switch
                                checked={watchedValues.usarTaxaBacen}
                                onCheckedChange={(checked) => setValue('usarTaxaBacen', checked, { shouldValidate: true })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Repetição de Indébito em Dobro</Label>
                                <p className="text-sm text-slate-500">
                                    Art. 42 CDC - Valores cobrados indevidamente
                                </p>
                            </div>
                            <Switch
                                checked={watchedValues.repetirEmDobro}
                                onCheckedChange={(checked) => setValue('repetirEmDobro', checked, { shouldValidate: true })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Info sobre Método Gauss */}
            {watchedValues.sistemaAmortizacao === 'GAUSS' && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700 dark:text-blue-300">Método de Gauss Selecionado</AlertTitle>
                    <AlertDescription className="text-blue-600 dark:text-blue-400">
                        O Método de Gauss (ou MAGIS) recalcula o contrato utilizando juros simples,
                        onde os juros não capitalizam (não incidem sobre juros). Esta é uma tese
                        alternativa que pode resultar em diferenças significativas.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

// Exporta o schema para uso no wizard pai
export { step2Schema };
