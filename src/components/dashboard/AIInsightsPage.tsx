import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

export function AIInsightsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground font-bold text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Inteligência de Negócios Octo
          </h1>
          <p className="text-muted-foreground text-sm">
            Insights gerados por IA baseados nos dados do seu escritório.
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-6 space-y-6 overflow-y-auto">
        {/* Section 1: Padrões Detectados */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Padrões de Sucesso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground">Melhor Dia de Fechamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Seu time fecha <span className="font-bold text-emerald-600">40% mais contratos</span> nas terças-feiras entre 14h e 16h.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground">Produto Estrela</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O produto "Revisional de Veículos" tem o menor ciclo de vendas (média de 12 dias).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Atenção Necessária */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Atenção Necessária
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground">Queda de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O volume de novos leads caiu <span className="font-bold text-amber-600">15%</span> nesta semana em comparação com a média mensal.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground">Gargalo no Funil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Há 12 oportunidades paradas na etapa "Negociação" há mais de 10 dias.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 3: Sugestões Preditivas */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" />
             Sugestões Preditivas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-700 dark:text-blue-300">Previsão de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                  Com base no pipeline atual e sua taxa histórica de conversão, a previsão de fechamento para este mês é de <strong>R$ 150.000,00</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
