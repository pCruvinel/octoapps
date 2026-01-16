import { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Percent,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

// ================================================================
// TIPOS
// ================================================================

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  index: number;
}

interface FunnelStageData {
  etapa: string;
  valor: number;
  quantidade: number;
  fill: string;
}

interface ProductRevenueData {
  produto: string;
  receita: number;
  fill: string;
}

interface DelayedActivity {
  id: string;
  title: string;
  client: string;
  date: string;
  type: 'contract' | 'meeting' | 'followup';
}

interface RecentSale {
  id: string;
  client: string;
  value: number;
  product: string;
  date: string;
}

// ================================================================
// DADOS FICTÍCIOS (MOCK)
// ================================================================

const MOCK_KPI_DATA = {
  valorPipeline: 847500.0,
  vendasConfirmadas: 312000.0,
  ticketMedio: 15600.0,
  taxaConversao: 24.5,
};

const MOCK_FUNNEL_DATA: FunnelStageData[] = [
  { etapa: 'Lead', valor: 245000, quantidade: 28, fill: 'var(--chart-1)' },
  { etapa: 'Qualificação', valor: 187500, quantidade: 15, fill: 'var(--chart-2)' },
  { etapa: 'Proposta', valor: 325000, quantidade: 18, fill: 'var(--chart-3)' },
  { etapa: 'Negociação', valor: 142000, quantidade: 8, fill: 'var(--chart-4)' },
  { etapa: 'Fechamento', valor: 89000, quantidade: 5, fill: 'var(--chart-5)' },
];

const MOCK_PRODUCT_REVENUE: ProductRevenueData[] = [
  { produto: 'Rev. Veículos', receita: 145000, fill: 'var(--chart-1)' },
  { produto: 'Rev. Imobiliária', receita: 98000, fill: 'var(--chart-2)' },
  { produto: 'Liminar Bloqueio', receita: 42000, fill: 'var(--chart-3)' },
  { produto: 'Defesa Busca', receita: 27000, fill: 'var(--chart-4)' },
];

const MOCK_DELAYED_ACTIVITIES: DelayedActivity[] = [
  { id: '1', title: 'Enviar Minuta de Contrato', client: 'Transportadora Silva', date: 'Ontem', type: 'contract' },
  { id: '2', title: 'Reunião de Alinhamento', client: 'João Paulo', date: '2 dias atrás', type: 'meeting' },
  { id: '3', title: 'Follow-up Proposta', client: 'Maria Oliveira', date: '3 dias atrás', type: 'followup' },
];

const MOCK_RECENT_SALES: RecentSale[] = [
  { id: '1', client: 'Construtora ABC', value: 15000, product: 'Rev. Imobiliária', date: 'Hoje, 10:30' },
  { id: '2', client: 'Pedro Santos', value: 4500, product: 'Liminar', date: 'Hoje, 09:15' },
  { id: '3', client: 'Empresa XYZ', value: 22000, product: 'Rev. Veículos', date: 'Ontem, 16:45' },
  { id: '4', client: 'Ana Costa', value: 3800, product: 'Liminar', date: 'Ontem, 14:20' },
  { id: '5', client: 'Lucas Pereira', value: 12000, product: 'Rev. Veículos', date: 'Ontem, 11:00' },
];

// Configuração dos gráficos
const funnelConfig: ChartConfig = {
  valor: { label: 'Valor (R$)', color: 'hsl(var(--primary))' },
};

const productConfig: ChartConfig = {
  receita: { label: 'Receita (R$)', color: 'hsl(var(--primary))' },
};

// ================================================================
// COMPONENTES INTERNOS
// ================================================================

function KPICard({ title, value, description, icon: Icon, trend, className, index }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              {value}
            </motion.span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${
                  trend.isPositive ? 'text-emerald-500' : 'text-red-500 rotate-180'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {trend.isPositive ? '+' : '-'}
                {Math.abs(trend.value)}% vs. mês anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export function SalesDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
  };

  // KPIs calculados
  const kpiCards = useMemo(
    () => [
      {
        title: 'Valor em Pipeline',
        value: formatCurrency(MOCK_KPI_DATA.valorPipeline),
        description: 'Propostas em aberto',
        icon: DollarSign,
        trend: { value: 12.5, isPositive: true },
      },
      {
        title: 'Vendas Confirmadas',
        value: formatCurrency(MOCK_KPI_DATA.vendasConfirmadas),
        description: 'Receita fechada',
        icon: Target,
        trend: { value: 8.2, isPositive: true },
      },
      {
        title: 'Ticket Médio',
        value: formatCurrency(MOCK_KPI_DATA.ticketMedio),
        description: 'Por contrato',
        icon: TrendingUp,
        trend: { value: 3.1, isPositive: false },
      },
      {
        title: 'Taxa de Conversão',
        value: `${MOCK_KPI_DATA.taxaConversao}%`,
        description: 'Lead -> Venda',
        icon: Percent,
        trend: { value: 5.7, isPositive: true },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header com Filtro de Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Comercial
          </h2>
          <p className="text-muted-foreground">
            Visão geral de desempenho e métricas de vendas
          </p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <KPICard
            key={index}
            index={index}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Produto (Receita) */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Receita por Produto</CardTitle>
              <CardDescription>
                Distribuição de receita por tipo de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={productConfig} className="h-[300px] w-full">
                <BarChart data={MOCK_PRODUCT_REVENUE} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis 
                    dataKey="produto" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatCurrencyShort}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => formatCurrency(Number(value))} 
                      />
                    }
                  />
                  <Bar
                    dataKey="receita"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráfico de Funil */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Volume por Etapa</CardTitle>
              <CardDescription>
                Distribuição financeira do pipeline atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={funnelConfig} className="h-[300px] w-full">
                <BarChart data={MOCK_FUNNEL_DATA} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="etapa" 
                    type="category" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    width={80}
                  />
                  <ChartTooltip 
                     cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                     content={
                        <ChartTooltipContent
                          labelKey="etapa"
                          formatter={(value, name, item) => (
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">{formatCurrency(Number(value))}</span>
                              <span className="text-xs text-muted-foreground">{item.payload.quantidade} oportunidades</span>
                            </div>
                          )}
                        />
                     }
                  />
                  <Bar 
                    dataKey="valor" 
                    radius={[0, 4, 4, 0]}
                    layout="vertical"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Atrasadas */}
        <motion.div
           className="lg:col-span-1"
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="h-full border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Atividades Atrasadas</CardTitle>
              </div>
              <CardDescription>Ações que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-4">
                  {MOCK_DELAYED_ACTIVITIES.map((activity) => (
                    <div key={activity.id} className="flex flex-col gap-1 pb-3 border-b border-border last:border-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-foreground">{activity.title}</span>
                        <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                          {activity.date}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {activity.client}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Últimas Vendas (Ticker) */}
        <motion.div
           className="lg:col-span-2"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="h-full border-l-4 border-l-emerald-500 bg-gradient-to-br from-background to-emerald-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-lg">Últimas Vendas</CardTitle>
              </div>
              <CardDescription>Negócios fechados recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden h-[250px]">
                <div className="absolute inset-0 flex flex-col gap-3">
                  {/* Ticker Animation Loop */}
                  <motion.div
                     animate={{ y: ["0%", "-50%"] }}
                     transition={{
                       repeat: Infinity,
                       duration: 20,
                       ease: "linear",
                       repeatType: "loop"
                     }}
                     className="space-y-3"
                  >
                    {[...MOCK_RECENT_SALES, ...MOCK_RECENT_SALES].map((sale, i) => (
                       <div key={`${sale.id}-${i}`} className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-lg shadow-sm backdrop-blur-sm">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                             {sale.client.substring(0, 2).toUpperCase()}
                           </div>
                           <div>
                             <p className="text-sm font-medium text-foreground">{sale.client}</p>
                             <p className="text-xs text-muted-foreground">{sale.product}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-bold text-emerald-600">
                             {formatCurrency(sale.value)}
                           </p>
                           <p className="text-xs text-muted-foreground">{sale.date}</p>
                         </div>
                       </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default SalesDashboard;
