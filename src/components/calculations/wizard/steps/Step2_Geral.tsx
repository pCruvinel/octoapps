'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PercentInput } from '@/components/ui/percent-input';
import { AlertTriangle, Info, Calculator, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { geralStep2Schema, type GeralStep2Data } from '@/schemas/moduloGeral.schema';
import { calculationAPI } from '@/services/calculationAPI.service';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Step2_GeralProps {
    defaultValues?: Partial<GeralStep2Data>;
    onDataChange?: (data: GeralStep2Data) => void;
    onValidationChange?: (isValid: boolean) => void;
    contractDate?: string;
}

const SISTEMAS_GERAL = [
    { value: 'PRICE', label: 'Tabela Price (Francês)' },
    { value: 'GAUSS', label: 'Método de Gauss (Juros Simples)' },
    { value: 'SAC', label: 'SAC (Menos Comum em Pessoais)' },
] as const;

export function Step2_Geral({
    defaultValues,
    onDataChange,
    onValidationChange,
    contractDate,
}: Step2_GeralProps) {
    const [capitalizacaoDiariaDetectada, setCapitalizacaoDiariaDetectada] = React.useState(false);
    const [isFetchingRate, setIsFetchingRate] = React.useState(false);
    const [fetchedRate, setFetchedRate] = React.useState<{ mensal: number, anual: number } | null>(null);

    const {
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<GeralStep2Data>({
        resolver: zodResolver(geralStep2Schema),
        mode: 'onChange',
        defaultValues: {
            capitalizacao: 'MENSAL',
            sistemaAmortizacao: 'PRICE',
            usarTaxaBacen: true,
            thresholdAbuso: 1.5,
            taxaMensalContrato: 0,
            taxaAnualContrato: 0,
            repetirEmDobro: false,
            multaPercentual: 2,
            jurosMoraPercentual: 1,
            ...defaultValues,
        },
    });

    const watchedValues = watch();

    React.useEffect(() => {
        onValidationChange?.(isValid);
        if (isValid) {
            onDataChange?.(watchedValues);
        }
    }, [isValid, watchedValues, onValidationChange, onDataChange]);

    // Detecção Automática de Capitalização Diária
    React.useEffect(() => {
        const { taxaMensalContrato, taxaAnualContrato } = watchedValues;

        if (taxaMensalContrato > 0 && taxaAnualContrato > 0) {
            const mensalDecimal = taxaMensalContrato / 100;
            const anualDecimal = taxaAnualContrato / 100;
            const taxaAnualEsperada = Math.pow(1 + mensalDecimal, 12) - 1;

            // Se a taxa anual real é > 2% da esperada, detecta diária
            if (anualDecimal > taxaAnualEsperada * 1.02) {
                setCapitalizacaoDiariaDetectada(true);
                // Sugere mudança (mas não força sem aviso se já estiver setado? 
                // A lógica antiga forçava, vamos manter o UX de avisar e mudar se for diferente)
                if (watchedValues.capitalizacao !== 'DIARIA') {
                    // Opcional: toast ou auto-change. Vamos fazer auto-change com o Alert visual
                    // setValue('capitalizacao', 'DIARIA'); // Comentado para deixar decisão do usuário, ou manter lógica antiga
                }
            } else {
                setCapitalizacaoDiariaDetectada(false);
            }
        }
    }, [watchedValues.taxaMensalContrato, watchedValues.taxaAnualContrato]);

    const handleFetchBacen = async () => {
        if (!contractDate) {
            toast.error('Data do contrato não informada no Passo 1');
            return;
        }

        setIsFetchingRate(true);
        try {
            const rateDecimal = await calculationAPI.getBacenRate('EMPRESTIMO', contractDate);

            if (rateDecimal) {
                const mensalPercent = rateDecimal.times(100).toNumber();
                const anualPercent = (Math.pow(1 + rateDecimal.toNumber(), 12) - 1) * 100;

                setFetchedRate({ mensal: mensalPercent, anual: anualPercent });
                setValue('taxaMediaBacen', mensalPercent); // Store internal for logic
                toast.success('Taxa média do Bacen encontrada!');
            } else {
                toast.warning('Não foi possível encontrar a taxa média para esta data/série.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar taxa do Bacen');
        } finally {
            setIsFetchingRate(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Alerta de Capitalização Diária */}
            {capitalizacaoDiariaDetectada && watchedValues.capitalizacao !== 'DIARIA' && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Capitalização Diária Sugerida</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                        <span>
                            A taxa anual informada ({watchedValues.taxaAnualContrato.toFixed(2)}%) é incompatível com a capitalização mensal simples da taxa mensal.
                        </span>
                        <button
                            className="w-fit text-sm font-semibold underline"
                            onClick={() => setValue('capitalizacao', 'DIARIA', { shouldValidate: true })}
                        >
                            Aplicar Capitalização Diária
                        </button>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Taxas Contratuais
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Taxa Mensal (%)</Label>
                        <PercentInput
                            value={watchedValues.taxaMensalContrato}
                            onChange={(val) => {
                                const mensal = val || 0;
                                const anual = (Math.pow(1 + mensal / 100, 12) - 1) * 100;
                                setValue('taxaMensalContrato', mensal, { shouldValidate: true });
                                setValue('taxaAnualContrato', anual, { shouldValidate: true });
                            }}
                            decimalPlaces={4}
                        />
                        {errors.taxaMensalContrato && <p className="text-sm text-red-500">{errors.taxaMensalContrato.message}</p>}
                        {watchedValues.taxaMensalContrato > 10 && (
                            <p className="text-sm text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Taxa mensal muito alta - verifique se está correto
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Taxa Anual (%)</Label>
                        <PercentInput
                            value={watchedValues.taxaAnualContrato}
                            onChange={(val) => {
                                const anual = val || 0;
                                const mensal = (Math.pow(1 + anual / 100, 1 / 12) - 1) * 100;
                                setValue('taxaAnualContrato', anual, { shouldValidate: true });
                                setValue('taxaMensalContrato', mensal, { shouldValidate: true });
                            }}
                            decimalPlaces={2}
                        />
                        {errors.taxaAnualContrato && <p className="text-sm text-red-500">{errors.taxaAnualContrato.message}</p>}
                        {watchedValues.taxaAnualContrato > 200 && (
                            <p className="text-sm text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Taxa anual muito alta - verifique se está correto
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configuração da Tese Revisional</CardTitle>
                    <CardDescription>Parâmetros para o recálculo da dívida</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Regime de Capitalização</Label>
                            <Select
                                value={watchedValues.capitalizacao}
                                onValueChange={(val) => setValue('capitalizacao', val as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MENSAL">Mensal (Padrão)</SelectItem>
                                    <SelectItem value="DIARIA">Diária (Comum em Bancos)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Sistema de Amortização (Recálculo)</Label>
                            <Select
                                value={watchedValues.sistemaAmortizacao}
                                onValueChange={(val) => setValue('sistemaAmortizacao', val as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SISTEMAS_GERAL.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label>Considerar Abusividade (Threshold)</Label>
                            <span className="text-sm font-medium">{watchedValues.thresholdAbuso}x a Média</span>
                        </div>
                        <Slider
                            value={[watchedValues.thresholdAbuso]}
                            onValueChange={([val]) => setValue('thresholdAbuso', val)}
                            min={1.1} max={3.0} step={0.1}
                        />
                        <p className="text-xs text-muted-foreground">
                            Taxas acima deste fator em relação ao Bacen serão reduzidas.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Usar Taxa Média Bacen</Label>
                                <p className="text-xs text-muted-foreground">Se detectado abuso, recalcular pela média de mercado.</p>
                                {contractDate && (
                                    <div className="mt-2 text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-700">Média em {contractDate.substring(0, 7)}:</span>
                                            {fetchedRate ? (
                                                <Badge variant="outline" className="text-green-600 bg-green-50">
                                                    {fetchedRate.mensal.toFixed(4)}% a.m.
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 italic">Não consultado</span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs w-full"
                                            onClick={handleFetchBacen}
                                            disabled={isFetchingRate}
                                            type="button"
                                        >
                                            {isFetchingRate ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                            {fetchedRate ? 'Consultar Novamente' : 'Buscar no Bacen'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <Switch
                                checked={watchedValues.usarTaxaBacen}
                                onCheckedChange={(val) => setValue('usarTaxaBacen', val)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Repetição em Dobro</Label>
                                <p className="text-xs text-muted-foreground">Art. 42 CDC - Devolver valores pagos a maior em dobro.</p>
                            </div>
                            <Switch
                                checked={watchedValues.repetirEmDobro}
                                onCheckedChange={(val) => setValue('repetirEmDobro', val)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {watchedValues.sistemaAmortizacao === 'GAUSS' && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <TrendingDown className="h-4 w-4" />
                    <AlertTitle>Método de Gauss</AlertTitle>
                    <AlertDescription>
                        Este método recalcula a dívida utilizando juros simples, removendo o anatocismo (juros sobre juros).
                        Geralmente resulta na maior redução do saldo devedor.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
