import { BarChart3, Users, FileText, TrendingUp, Calculator, Kanban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function Dashboard() {
  const stats = [
    {
      title: 'Oportunidades Ativas',
      value: '42',
      change: '+12%',
      icon: Kanban,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Contatos',
      value: '186',
      change: '+8%',
      icon: Users,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Cálculos este mês',
      value: '23',
      change: '+15%',
      icon: Calculator,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Petições Geradas',
      value: '18',
      change: '+5%',
      icon: FileText,
      color: 'text-orange-600 dark:text-orange-400'
    },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Dashboard Geral</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral das atividades do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {stat.change} vs. mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Oportunidades por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Lead', count: 12, color: 'bg-gray-400' },
                { stage: 'Qualificação', count: 8, color: 'bg-blue-500' },
                { stage: 'Proposta', count: 15, color: 'bg-yellow-500' },
                { stage: 'Negociação', count: 5, color: 'bg-orange-500' },
                { stage: 'Fechamento', count: 2, color: 'bg-green-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{item.stage}</div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                    <div 
                      className={`${item.color} h-full flex items-center justify-end pr-2`}
                      style={{ width: `${(item.count / 15) * 100}%` }}
                    >
                      <span className="text-xs text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: 'Nova oportunidade criada - Cliente ABC', time: 'há 5 min', icon: Kanban },
                { text: 'Cálculo de financiamento finalizado', time: 'há 15 min', icon: Calculator },
                { text: 'Petição exportada com sucesso', time: 'há 1 hora', icon: FileText },
                { text: 'Novo contato adicionado - João Silva', time: 'há 2 horas', icon: Users },
                { text: 'Reunião agendada para amanhã', time: 'há 3 horas', icon: TrendingUp },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
