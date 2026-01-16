import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Target, Briefcase, AlertCircle } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, PieChart, Pie } from 'recharts';

export function Dashboard() {
    const { stats, loading } = useDashboardMetrics();

    if (loading) {
        return <div className="p-8 flex items-center justify-center">Carregando dados...</div>;
    }

    const COLORS = ['#1657FF', '#0F766E', '#1E3A8A', '#F59E0B', '#F97316'];

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-foreground font-bold text-2xl">Visão Geral</h1>
                <p className="text-muted-foreground">Monitoramento financeiro e performance comercial.</p>
            </div>

            {/* 1. Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <DashboardCard
                    title="Receita Realizada"
                    value={formatCurrency(stats.financial.realized)}
                    subtitle={`${stats.financial.realizedChange}% vs mês anterior`}
                    icon={DollarSign}
                    color="text-emerald-600"
                />
                <DashboardCard
                    title="Pipeline Ponderado"
                    value={formatCurrency(stats.financial.forecast)}
                    subtitle="Previsão (30 dias)"
                    icon={TrendingUp}
                    color="text-blue-600"
                />
                <DashboardCard
                    title="Ticket Médio"
                    value={formatCurrency(stats.financial.ticket)}
                    subtitle="Contratos Fechados"
                    icon={Target}
                    color="text-purple-600"
                />
                <DashboardCard
                    title="Taxa de Conversão"
                    value={`${stats.financial.conversion.toFixed(1)}%`}
                    subtitle="Leads -> Fechamento"
                    icon={BarChart3}
                    color="text-orange-600"
                />
            </div>

            {/* 2. Team Performance Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Corrida de Vendas (Ranking de Honorários)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.team} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Bar dataKey="value" fill="#1657FF" radius={[0, 4, 4, 0]}>
                                    {stats.team.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1657FF' : '#94A3B8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                        <CardTitle>Receita por Produto</CardTitle>
                    </CardHeader> 
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                    data={stats.products}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.products.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend verticalAlign="bottom" height={36}/>
                             </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            {/* 3. Detailed Performance Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento de Performance da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3">Colaborador</th>
                                    <th className="px-6 py-3">Leads</th>
                                    <th className="px-6 py-3">Propostas</th>
                                    <th className="px-6 py-3">Fechamentos</th>
                                    <th className="px-6 py-3 text-right">Eficiência</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.funnel.map((member: any, i: number) => (
                                    <tr key={i} className="bg-white border-b hover:bg-muted/10">
                                        <td className="px-6 py-4 font-medium text-foreground">{member.name}</td>
                                        <td className="px-6 py-4">{member.leads}</td>
                                        <td className="px-6 py-4">{member.proposals}</td>
                                        <td className="px-6 py-4">{member.closed}</td>
                                        <td className="px-6 py-4 text-right">
                                            {member.leads > 0 
                                                ? ((member.closed / member.leads) * 100).toFixed(1)
                                                : 0}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

function DashboardCard({ title, value, subtitle, icon: Icon, color }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {subtitle}
                </p>
            </CardContent>
        </Card>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
