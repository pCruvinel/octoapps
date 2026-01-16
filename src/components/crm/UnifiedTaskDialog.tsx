'use client';

import { useState, useEffect } from 'react';
import { format, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  Tag,
  Bell,
  Repeat,
  X,
  Check,
  ChevronDown,
  Briefcase,
  MapPin,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

import { useTasks } from '../../hooks/useTasks';
import { useEventCategories, CATEGORY_COLORS } from '../../hooks/useEventCategories';
import { supabase } from '../../lib/supabase';
import type { Task, TaskInsert, EventCategory, RecorrenciaTipo, PrioridadeTarefa } from '../../types/task';
import { cn } from '../../lib/utils';

// =====================================================
// TYPES
// =====================================================

interface UnifiedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Contexto pré-preenchido
  defaultContactId?: string;
  defaultContactName?: string;
  defaultOpportunityId?: string;
  defaultDate?: Date;
  
  // Callbacks
  onSuccess?: (task: Task) => void;
  onClose?: () => void;
  
  // Modo inicial
  initialMode?: 'quick' | 'detailed';
  
  // Lock de contexto
  lockContact?: boolean;
}

interface ContactOption {
  id: string;
  nome_completo: string;
}

interface OpportunityOption {
  id: string;
  titulo: string;
  contato_id: string | null;
  contato_nome?: string;
}

// =====================================================
// COMPONENT
// =====================================================

export function UnifiedTaskDialog({
  open,
  onOpenChange,
  defaultContactId,
  defaultContactName,
  defaultOpportunityId,
  defaultDate,
  onSuccess,
  onClose,
  initialMode = 'quick',
  lockContact = false,
}: UnifiedTaskDialogProps) {
  // Hooks
  const { createTask } = useTasks();
  const { categories, loadCategories } = useEventCategories();
  
  // Estados
  const [mode, setMode] = useState<'quick' | 'detailed'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [contactSearchOpen, setContactSearchOpen] = useState(false);
  const [opportunitySearchOpen, setOpportunitySearchOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    category_id: '',
    cor: '#1e3a8a',
    contato_id: defaultContactId || '',
    contato_nome: defaultContactName || '',
    oportunidade_id: defaultOpportunityId || '',
    oportunidade_nome: '',
    data_inicio: format(defaultDate || new Date(), "yyyy-MM-dd'T'HH:mm"),
    data_fim: format(addHours(defaultDate || new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    is_all_day: false,
    local: '',
    prioridade: 'Média' as PrioridadeTarefa,
    lembrete_antecedencia: 0,
    recorrente: false,
    recorrencia_tipo: '' as RecorrenciaTipo | '',
    recorrencia_fim: '',
  });

  // Categoria padrão (Tarefa)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      loadCategories();
      loadContacts();
      loadOpportunities();
    }
  }, [open, loadCategories]);

  // Definir categoria padrão quando categorias carregarem
  useEffect(() => {
    if (categories.length > 0 && !defaultCategoryId) {
      const tarefaCategory = categories.find(c => c.name === 'Tarefa');
      if (tarefaCategory) {
        setDefaultCategoryId(tarefaCategory.id);
      } else if (categories[0]) {
        setDefaultCategoryId(categories[0].id);
      }
    }
  }, [categories, defaultCategoryId]);

  // Reset form quando modal abre
  useEffect(() => {
    if (open) {
      setFormData({
        titulo: '',
        descricao: '',
        category_id: '',
        cor: '#1e3a8a',
        contato_id: defaultContactId || '',
        contato_nome: defaultContactName || '',
        oportunidade_id: defaultOpportunityId || '',
        oportunidade_nome: '',
        data_inicio: format(defaultDate || new Date(), "yyyy-MM-dd'T'HH:mm"),
        data_fim: format(addHours(defaultDate || new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        is_all_day: false,
        local: '',
        prioridade: 'Média',
        lembrete_antecedencia: 0,
        recorrente: false,
        recorrencia_tipo: '',
        recorrencia_fim: '',
      });
      setMode(initialMode);
    }
  }, [open, defaultContactId, defaultContactName, defaultOpportunityId, defaultDate, initialMode]);

  // Carregar contatos
  const loadContacts = async () => {
    const { data } = await supabase
      .from('contatos')
      .select('id, nome_completo')
      .eq('ativo', true)
      .order('nome_completo')
      .limit(100);
    if (data) setContacts(data);
  };

  // Carregar oportunidades
  const loadOpportunities = async () => {
    const { data } = await supabase
      .from('oportunidades')
      .select('id, titulo, contato_id, contato:contato_id(nome_completo)')
      .eq('ativo', true)
      .order('titulo', { ascending: true })
      .limit(100);
    if (data) {
      setOpportunities(data.map((o: any) => ({
        id: o.id,
        titulo: o.titulo,
        contato_id: o.contato_id,
        contato_nome: o.contato?.nome_completo,
      })));
    }
  };

  // Categoria selecionada
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  
  // Cor visual baseada no modo
  const accentColor = mode === 'quick' 
    ? '#1e3a8a' 
    : (selectedCategory?.color || '#1e3a8a');

  // Handler para mudança de categoria
  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      cor: category?.color || '#1e3a8a',
    }));
  };

  // Handler para seleção de oportunidade (auto-preenche contato)
  const handleOpportunitySelect = (opportunity: OpportunityOption) => {
    setFormData(prev => ({
      ...prev,
      oportunidade_id: opportunity.id,
      oportunidade_nome: opportunity.titulo,
      // Auto-preencher contato se a oportunidade tiver um
      contato_id: opportunity.contato_id || prev.contato_id,
      contato_nome: opportunity.contato_nome || prev.contato_nome,
    }));
    setOpportunitySearchOpen(false);
  };

  // Handler para submit
  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData: TaskInsert = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        category_id: mode === 'quick' ? defaultCategoryId : (formData.category_id || defaultCategoryId),
        cor: accentColor,
        contato_id: formData.contato_id || null,
        oportunidade_id: formData.oportunidade_id || null,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        data_fim: formData.is_all_day 
          ? new Date(formData.data_inicio).toISOString() 
          : new Date(formData.data_fim).toISOString(),
        is_all_day: formData.is_all_day,
        local: formData.local || null,
        prioridade: formData.prioridade,
        lembrete_antecedencia: formData.lembrete_antecedencia || null,
        recorrente: formData.recorrente,
        recorrencia_tipo: formData.recorrente ? (formData.recorrencia_tipo as RecorrenciaTipo) : null,
        recorrencia_fim: formData.recorrente && formData.recorrencia_fim 
          ? formData.recorrencia_fim 
          : null,
        tipo: mode === 'quick' ? 'Tarefa' : (selectedCategory?.name as any || 'Tarefa'),
      };

      const { data, error } = await createTask(taskData);
      
      if (error) {
        toast.error(error);
        return;
      }

      toast.success(mode === 'quick' ? 'Tarefa criada!' : 'Evento criado!');
      if (data) onSuccess?.(data as unknown as Task);
      onOpenChange(false);
      onClose?.();
    } catch (err) {
      toast.error('Erro ao criar tarefa');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "transition-all duration-200",
        mode === 'detailed' ? "sm:max-w-[800px]" : "sm:max-w-[500px]"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            {mode === 'quick' ? 'Nova Tarefa' : 'Novo Evento'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'quick' 
              ? 'Crie uma tarefa rápida' 
              : 'Crie um evento detalhado com categoria e horários'}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs de Modo */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'detailed')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="gap-2">
              <Check className="w-4 h-4" />
              Tarefa Rápida
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <Calendar className="w-4 h-4" />
              Evento Detalhado
            </TabsTrigger>
          </TabsList>

          {/* Modo Quick - Layout Simples */}
          {mode === 'quick' && (
            <div className="mt-4 space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="O que precisa fazer?"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data/Hora</Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <div className="flex gap-2">
                  {(['Baixa', 'Média', 'Alta', 'Urgente'] as PrioridadeTarefa[]).map((p) => (
                    <Badge
                      key={p}
                      variant={formData.prioridade === p ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-colors',
                        formData.prioridade === p && {
                          'Baixa': 'bg-green-500 hover:bg-green-600',
                          'Média': 'bg-blue-500 hover:bg-blue-600',
                          'Alta': 'bg-orange-500 hover:bg-orange-600',
                          'Urgente': 'bg-red-500 hover:bg-red-600',
                        }[p]
                      )}
                      onClick={() => setFormData({ ...formData, prioridade: p })}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Observações</Label>
                <Textarea
                  id="descricao"
                  placeholder="Adicione detalhes..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Modo Detailed - Layout 2 Colunas */}
          {mode === 'detailed' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* COLUNA ESQUERDA */}
              <div className="space-y-4">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Título do evento"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    autoFocus
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria">
                        {selectedCategory && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: selectedCategory.color }}
                            />
                            {selectedCategory.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Detalhes do evento..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(['Baixa', 'Média', 'Alta', 'Urgente'] as PrioridadeTarefa[]).map((p) => (
                      <Badge
                        key={p}
                        variant={formData.prioridade === p ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-colors',
                          formData.prioridade === p && {
                            'Baixa': 'bg-green-500 hover:bg-green-600',
                            'Média': 'bg-blue-500 hover:bg-blue-600',
                            'Alta': 'bg-orange-500 hover:bg-orange-600',
                            'Urgente': 'bg-red-500 hover:bg-red-600',
                          }[p]
                        )}
                        onClick={() => setFormData({ ...formData, prioridade: p })}
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Local */}
                <div className="space-y-2">
                  <Label htmlFor="local" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Local
                  </Label>
                  <Input
                    id="local"
                    placeholder="Onde será o evento?"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  />
                </div>
              </div>

              {/* COLUNA DIREITA */}
              <div className="space-y-4">
                {/* Data Início */}
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Início</Label>
                  <Input
                    id="data_inicio"
                    type={formData.is_all_day ? 'date' : 'datetime-local'}
                    value={formData.is_all_day 
                      ? formData.data_inicio.split('T')[0] 
                      : formData.data_inicio}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      data_inicio: formData.is_all_day 
                        ? `${e.target.value}T09:00` 
                        : e.target.value 
                    })}
                  />
                </div>

                {/* Data Fim */}
                {!formData.is_all_day && (
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Fim</Label>
                    <Input
                      id="data_fim"
                      type="datetime-local"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    />
                  </div>
                )}

                {/* Dia inteiro */}
                <div className="flex items-center gap-2 py-2">
                  <Switch
                    id="is_all_day"
                    checked={formData.is_all_day}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked })}
                  />
                  <Label htmlFor="is_all_day" className="text-sm">Dia inteiro</Label>
                </div>

                {/* Contato */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contato
                  </Label>
                  {lockContact && formData.contato_nome ? (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{formData.contato_nome}</span>
                      <Badge variant="secondary" className="ml-auto">Bloqueado</Badge>
                    </div>
                  ) : (
                    <Popover open={contactSearchOpen} onOpenChange={setContactSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {formData.contato_nome || 'Selecionar contato...'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Pesquisar contato..." />
                          <CommandList>
                            <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                            <CommandGroup>
                              {contacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={contact.nome_completo}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      contato_id: contact.id,
                                      contato_nome: contact.nome_completo,
                                    });
                                    setContactSearchOpen(false);
                                  }}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  {contact.nome_completo}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Oportunidade */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Oportunidade
                  </Label>
                  <Popover open={opportunitySearchOpen} onOpenChange={setOpportunitySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {formData.oportunidade_nome || 'Selecionar oportunidade...'}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0">
                      <Command>
                        <CommandInput placeholder="Pesquisar oportunidade..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma oportunidade encontrada.</CommandEmpty>
                          <CommandGroup>
                            {opportunities.map((opp) => (
                              <CommandItem
                                key={opp.id}
                                value={opp.titulo}
                                onSelect={() => handleOpportunitySelect(opp)}
                              >
                                <Briefcase className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{opp.titulo}</span>
                                  {opp.contato_nome && (
                                    <span className="text-xs text-muted-foreground">
                                      {opp.contato_nome}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Lembrete */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Lembrete
                  </Label>
                  <Select 
                    value={String(formData.lembrete_antecedencia)} 
                    onValueChange={(v) => setFormData({ ...formData, lembrete_antecedencia: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem lembrete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem lembrete</SelectItem>
                      <SelectItem value="5">5 minutos antes</SelectItem>
                      <SelectItem value="15">15 minutos antes</SelectItem>
                      <SelectItem value="30">30 minutos antes</SelectItem>
                      <SelectItem value="60">1 hora antes</SelectItem>
                      <SelectItem value="1440">1 dia antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recorrência */}
                <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="recorrente"
                      checked={formData.recorrente}
                      onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked })}
                    />
                    <Label htmlFor="recorrente" className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      Evento recorrente
                    </Label>
                  </div>
                  
                  {formData.recorrente && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-2">
                        <Label>Repetir</Label>
                        <Select 
                          value={formData.recorrencia_tipo} 
                          onValueChange={(v) => setFormData({ ...formData, recorrencia_tipo: v as RecorrenciaTipo })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diaria">Diariamente</SelectItem>
                            <SelectItem value="semanal">Semanalmente</SelectItem>
                            <SelectItem value="quinzenal">Quinzenalmente</SelectItem>
                            <SelectItem value="mensal">Mensalmente</SelectItem>
                            <SelectItem value="anual">Anualmente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Até quando</Label>
                        <Input
                          type="date"
                          value={formData.recorrencia_fim}
                          onChange={(e) => setFormData({ ...formData, recorrencia_fim: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            {isSubmitting ? 'Criando...' : (mode === 'quick' ? 'Criar Tarefa' : 'Criar Evento')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
