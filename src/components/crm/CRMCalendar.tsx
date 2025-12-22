import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    startOfDay,
    endOfDay,
    getHours,
    setHours,
    setMinutes
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Plus,
    MoreHorizontal,
    MapPin,
    AlignLeft
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { toast } from 'sonner';

import { useTasks } from '../../hooks/useTasks';
import { useAgendamentos } from '../../hooks/useAgendamentos';
import { useAuth } from '../../hooks/useAuth';
import { useFeriados } from '../../hooks/useFeriados';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types/task';
import type { Agendamento, AgendamentoInsert } from '../../types/agendamento';

interface CRMCalendarProps {
    onNavigate: (route: string, id?: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

// Unified Event Type for rendering
interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    color: string;
    type: 'tarefa' | 'agendamento';
    original: Task | Agendamento;
}

export function CRMCalendar({ onNavigate }: CRMCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Data Fetching
    const { loadTasksByOpportunity } = useTasks();
    const { loadAgendamentosByRange, createAgendamento, deleteAgendamento } = useAgendamentos();
    const { user } = useAuth();
    const { feriados, loadFeriadosPorAno, checkIsFeriado } = useFeriados();

    // Form State
    const [newEventOpen, setNewEventOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        data_inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        data_fim: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        cor: '#3D96FF',
        dia_inteiro: false,
        contato_id: '',
        oportunidade_id: '' // Not implementing select for now to save time/complexity in this iteration
    });

    // Contacts for select (simple load)
    const [contacts, setContacts] = useState<any[]>([]);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const { data } = await supabase.from('contatos').select('id, nome_completo').limit(50);
        if (data) setContacts(data);
    }

    // Load Events on Date/View Change
    useEffect(() => {
        fetchEvents();
        // Load feriados for viewing year(s)
        loadFeriadosPorAno(currentDate.getFullYear());
    }, [currentDate, viewMode]);

    const fetchEvents = async () => {
        let start, end;

        if (viewMode === 'month') {
            start = startOfMonth(currentDate);
            end = endOfMonth(currentDate);
            // Add padding for full weeks
            start = startOfWeek(start);
            end = endOfWeek(end);
        } else if (viewMode === 'week') {
            start = startOfWeek(currentDate);
            end = endOfWeek(currentDate);
        } else {
            start = startOfDay(currentDate);
            end = endOfDay(currentDate);
        }

        const startStr = start.toISOString();
        const endStr = end.toISOString();

        // 1. Fetch Agendamentos
        const { data: agendamentosData } = await loadAgendamentosByRange(startStr, endStr);

        // 2. Fetch Tarefas (We need a way to fetch ALL tasks in range, defaulting to direct supabase query here as the hook is limited)
        const { data: tasksData, error } = await supabase
            .from('tarefas')
            .select('*')
            .gte('data_vencimento', startStr)
            .lte('data_vencimento', endStr)
            .eq('ativo', true);

        const mergedEvents: CalendarEvent[] = [];

        // Map Agendamentos
        if (agendamentosData) {
            agendamentosData.forEach(a => {
                mergedEvents.push({
                    id: a.id,
                    title: a.titulo,
                    start: new Date(a.data_inicio),
                    end: new Date(a.data_fim),
                    allDay: a.dia_inteiro,
                    color: a.cor || '#3D96FF',
                    type: 'agendamento',
                    original: a
                });
            });
        }

        // Map Tarefas
        if (tasksData) {
            tasksData.forEach((t: Task) => {
                const date = t.data_vencimento ? new Date(t.data_vencimento) : new Date();
                mergedEvents.push({
                    id: t.id,
                    title: t.titulo,
                    start: date,
                    end: addDays(date, 0), // Tasks are points in time usually, assume 1 hour or just point
                    allDay: false,
                    color: '#10B981', // Green for tasks
                    type: 'tarefa',
                    original: t
                });
            });
        }

        setEvents(mergedEvents);
    };

    const handleCreateEvent = async () => {
        if (!formData.titulo) {
            toast.error('Título é obrigatório');
            return;
        }

        setIsSubmitting(true);
        try {
            await createAgendamento({
                titulo: formData.titulo,
                descricao: formData.descricao,
                cor: formData.cor,
                data_inicio: new Date(formData.data_inicio).toISOString(),
                data_fim: new Date(formData.data_fim).toISOString(),
                dia_inteiro: formData.dia_inteiro,
                contato_id: formData.contato_id || null,
                user_id: user?.id
            });
            toast.success('Agendamento criado!');
            setNewEventOpen(false);
            fetchEvents();
            // Reset form
            setFormData({
                titulo: '',
                descricao: '',
                data_inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                data_fim: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
                cor: '#3D96FF',
                dia_inteiro: false,
                contato_id: '',
                oportunidade_id: ''
            });
        } catch (e) {
            toast.error('Erro ao criar agendamento');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent || selectedEvent.type === 'tarefa') return;

        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            await deleteAgendamento(selectedEvent.id);
            toast.success('Agendamento excluído');
            setSelectedEvent(null);
            fetchEvents();
        }
    }

    // Navigation handlers
    const next = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prev = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const today = () => setCurrentDate(new Date());

    // RENDER HELPERS
    const renderMonthCell = (day: Date) => {
        const dayEvents = events.filter(e => isSameDay(e.start, day));
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, currentDate);
        const feriado = checkIsFeriado(day);
        const isSunday = day.getDay() === 0;

        return (
            <div
                key={day.toISOString()}
                className={`min-h-[100px] border-b border-r p-2 transition-colors
                  ${feriado || isSunday ? 'bg-red-50/60 dark:bg-red-950/30 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                  ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400' : ''}
                  ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}
                `}
                onClick={() => {
                    if (feriado || isSunday) {
                        // Don't open create dialog on holidays/sundays
                        return;
                    }
                    setFormData(prev => ({
                        ...prev,
                        data_inicio: format(setHours(day, 9), "yyyy-MM-dd'T'HH:mm"),
                        data_fim: format(setHours(day, 10), "yyyy-MM-dd'T'HH:mm")
                    }));
                    setNewEventOpen(true);
                }}
            >
                <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-blue-600 text-white' : feriado || isSunday ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
                    `}>
                        {format(day, 'd')}
                    </span>
                    {feriado && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 truncate max-w-[80px]" title={feriado.nome}>
                            {feriado.nome}
                        </span>
                    )}
                </div>
                <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                        <div
                            key={event.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                            }}
                            className="px-2 py-0.5 rounded text-xs truncate cursor-pointer hover:opacity-80 text-white font-medium"
                            style={{ backgroundColor: event.color }}
                        >
                            {event.title}
                        </div>
                    ))}
                    {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                            + {dayEvents.length - 3} mais
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // VIEWS
    const MonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        return (
            <div className="border rounded-lg bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b bg-gray-50 dark:bg-gray-900">
                    {weekDays.map(d => (
                        <div key={d} className="py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Days Grid */}
                <div className="grid grid-cols-7">
                    {days.map(day => renderMonthCell(day))}
                </div>
            </div>
        );
    };

    // Simplified Week/Day Views for MVP (can be expanded with true time grid later)
    const ListView = () => {
        // Filter events for the view range
        let start = viewMode === 'week' ? startOfWeek(currentDate) : startOfDay(currentDate);
        let end = viewMode === 'week' ? endOfWeek(currentDate) : endOfDay(currentDate);

        // Sort events
        const sortedEvents = events
            .filter(e => e.start >= start && e.start <= end)
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        return (
            <div className="space-y-2">
                {sortedEvents.length === 0 && (
                    <div className="p-8 text-center text-gray-500 border rounded-lg bg-white">
                        Nenhum evento para este período.
                    </div>
                )}
                {sortedEvents.map(event => (
                    <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center p-3 bg-white dark:bg-gray-900 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                        <div className="w-1.5 self-stretch rounded-full mr-4" style={{ backgroundColor: event.color }}></div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {format(event.start, "dd/MM HH:mm", { locale: ptBR })} - {format(event.end, "HH:mm")}
                            </div>
                        </div>
                        <Badge variant="outline">{event.type === 'tarefa' ? 'Tarefa' : 'Evento'}</Badge>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-8 h-screen-minus-header flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Month Selector */}
                    <Select
                        value={String(currentDate.getMonth())}
                        onValueChange={(v) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(v), 1))}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>

                    {/* Year Selector */}
                    <Select
                        value={String(currentDate.getFullYear())}
                        onValueChange={(v) => setCurrentDate(new Date(parseInt(v), currentDate.getMonth(), 1))}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center border rounded-md ml-2 bg-white dark:bg-gray-900">
                        <Button variant="ghost" size="icon" onClick={prev}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={today}>
                            Hoje
                        </Button>
                        <Button variant="ghost" size="icon" onClick={next}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger value="month">Mês</TabsTrigger>
                            <TabsTrigger value="week">Semana</TabsTrigger>
                            <TabsTrigger value="day">Dia</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Novo Agendamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Agendamento</DialogTitle>
                                <DialogDescription>Crie um novo evento no calendário.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input
                                        id="title"
                                        value={formData.titulo}
                                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Reunião com cliente..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start">Início</Label>
                                        <Input
                                            id="start"
                                            type="datetime-local"
                                            value={formData.data_inicio}
                                            onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="end">Fim</Label>
                                        <Input
                                            id="end"
                                            type="datetime-local"
                                            value={formData.data_fim}
                                            onChange={e => setFormData({ ...formData, data_fim: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Contato (Opcional)</Label>
                                    <Select
                                        value={formData.contato_id}
                                        onValueChange={v => setFormData({ ...formData, contato_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um contato" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contacts.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cor</Label>
                                    <div className="flex gap-2">
                                        {['#3D96FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(c => (
                                            <div
                                                key={c}
                                                className={`w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ${formData.cor === c ? 'ring-gray-400' : 'ring-transparent'}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setFormData({ ...formData, cor: c })}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="desc">Descrição</Label>
                                    <Textarea
                                        id="desc"
                                        value={formData.descricao}
                                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setNewEventOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateEvent} disabled={isSubmitting}>Criar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-y-auto">
                {viewMode === 'month' ? <MonthView /> : <ListView />}
            </div>

            {/* Event Details Dialog */}
            {selectedEvent && (
                <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.color }}></div>
                                {selectedEvent.title}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedEvent.type === 'tarefa' ? 'Tarefa do CRM' : 'Agendamento'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {format(selectedEvent.start, "PPP HH:mm", { locale: ptBR })}
                                {!selectedEvent.allDay && ` - ${format(selectedEvent.end, "HH:mm")}`}
                            </div>
                            {selectedEvent.type === 'agendamento' && (selectedEvent.original as Agendamento).descricao && (
                                <div className="text-sm bg-gray-50 p-3 rounded-md">
                                    {(selectedEvent.original as Agendamento).descricao}
                                </div>
                            )}
                            {selectedEvent.type === 'tarefa' && (selectedEvent.original as Task).observacoes && (
                                <div className="text-sm bg-gray-50 p-3 rounded-md">
                                    {(selectedEvent.original as Task).observacoes}
                                </div>
                            )}
                            {/* Links */}
                            {selectedEvent.type === 'agendamento' && (selectedEvent.original as Agendamento).contato_id && (
                                <div className="flex items-center gap-2 text-sm">
                                    <AlignLeft className="w-4 h-4" />
                                    <span className="font-semibold">Contato Vinculado</span>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            {selectedEvent.type === 'tarefa' ? (
                                <Button onClick={() => {
                                    setSelectedEvent(null);
                                    if ((selectedEvent.original as Task).oportunidade_id) {
                                        onNavigate('opportunity-details', (selectedEvent.original as Task).oportunidade_id!);
                                    }
                                }}>
                                    Ver Oportunidade
                                </Button>
                            ) : (
                                <>
                                    <Button variant="destructive" onClick={handleDeleteEvent}>Excluir</Button>
                                    <Button onClick={() => setSelectedEvent(null)}>Fechar</Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
