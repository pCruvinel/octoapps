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
    AlignLeft,
    User,
    X,
    Filter,
    Trash2,
    Mail,
    Phone,
    Briefcase,
    DollarSign,
    Tag
} from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

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
import { useAuth } from '../../hooks/useAuth';
import { useFeriados } from '../../hooks/useFeriados';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types/task';
import { UnifiedTaskDialog } from './UnifiedTaskDialog';
import { useEventCategories } from '../../hooks/useEventCategories';

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
    type: 'tarefa';
    original: Task;
}

export function CRMCalendar({ onNavigate }: CRMCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Data Fetching
    const { loadTasksByRange, deleteTask } = useTasks();
    const { user } = useAuth();
    const { feriados, loadFeriadosPorAno, checkIsFeriado } = useFeriados();

    // Dialog State
    const [newEventOpen, setNewEventOpen] = useState(false);

    // Filter State
    const { categories, loadCategories } = useEventCategories();
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    // Load Events on Date/View Change
    useEffect(() => {
        loadCategories();
        fetchEvents();
        // Load feriados for viewing year(s)
        loadFeriadosPorAno(currentDate.getFullYear());
    }, [currentDate, viewMode]);

    // Toggle category filter
    const toggleCategory = (id: string) => {
        setSelectedCategoryIds(prev => 
            prev.includes(id) 
                ? prev.filter(c => c !== id)
                : [...prev, id]
        );
    };

    // Filter events based on selection
    const filteredEvents = selectedCategoryIds.length > 0 
        ? events.filter(e => e.original.category_id && selectedCategoryIds.includes(e.original.category_id))
        : events;

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

        // V2: Fetch all tasks using the new unified approach
        const { data: tasksData } = await loadTasksByRange(startStr, endStr);

        const mergedEvents: CalendarEvent[] = [];

        // Map Tasks (V2 - includes migrated agendamentos)
        if (tasksData) {
            tasksData.forEach((t: any) => {
                // Use data_inicio/data_fim if available, fallback to data_vencimento
                const startDate = t.data_inicio 
                    ? new Date(t.data_inicio) 
                    : (t.data_vencimento ? new Date(t.data_vencimento) : new Date());
                const endDate = t.data_fim 
                    ? new Date(t.data_fim) 
                    : (t.data_inicio ? new Date(new Date(t.data_inicio).getTime() + 60*60*1000) : startDate);
                
                // Color from category or task override
                const color = t.cor || (t.category as any)?.color || '#1e3a8a';
                
                mergedEvents.push({
                    id: t.id,
                    title: t.titulo,
                    start: startDate,
                    end: endDate,
                    allDay: t.is_all_day || false,
                    color,
                    type: 'tarefa',
                    original: t
                });
            });
        }

        setEvents(mergedEvents);
    };

    // V2: Create event is now handled by UnifiedTaskDialog
    // Success callback refreshes the events list
    const handleTaskCreated = async () => {
        // Pequeno delay para garantir propagação no banco
        await new Promise(resolve => setTimeout(resolve, 500));
        fetchEvents();
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        if (confirm('Tem certeza que deseja excluir este evento?')) {
            await deleteTask(selectedEvent.id);
            toast.success('Evento excluído');
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
    // RENDER HELPERS
    const renderMonthCell = (day: Date) => {
        // Use filteredEvents instead of events
        const dayEvents = filteredEvents.filter(e => isSameDay(e.start, day));
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, currentDate);
        const feriado = checkIsFeriado(day);
        const isSunday = day.getDay() === 0;

        return (
            <div
                key={day.toISOString()}
                className={`border-b border-r p-2 transition-colors flex flex-col
                  ${feriado || isSunday ? 'bg-red-50/60 dark:bg-red-950/30 cursor-not-allowed' : 'hover:bg-accent/50'}
                  ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''}
                  ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}
                `}
                onClick={() => {
                    if (feriado || isSunday) {
                        return;
                    }
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
                <div className="space-y-1 flex-1">
                    {dayEvents.slice(0, 5).map(event => (
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
                    {dayEvents.length > 5 && (
                        <div className="text-xs text-gray-500 pl-1">
                            + {dayEvents.length - 5} mais
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
        
        // Calculate number of weeks to distribute height evenly
        const weeks = days.length / 7;

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        return (
            <div className="flex flex-col h-full bg-white dark:bg-card">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {weekDays.map(d => (
                        <div key={d} className="py-3 text-center text-sm font-semibold text-muted-foreground tracking-wide">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
                    {days.map(day => renderMonthCell(day))}
                </div>
            </div>
        );
    };

    // Simplified Week/Day Views for MVP (can be expanded with true time grid later)
    const DayView = () => {
        // Filter events for the view range
        let start = startOfDay(currentDate);
        let end = endOfDay(currentDate);

        // Sort events
        const sortedEvents = filteredEvents
            .filter(e => e.start >= start && e.start <= end)
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        return (
            <div className="p-4 space-y-3">
                {sortedEvents.length === 0 && (
                    <div className="p-8 text-center text-gray-500 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
                        Nenhum evento para este dia.
                    </div>
                )}
                {sortedEvents.map(event => {
                    const task = event.original as Task;
                    const contato = (task as any).contato;
                    const oportunidade = (task as any).oportunidade;
                    
                    return (
                        <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                        >
                            {/* Header com cor */}
                            <div className="h-1.5 w-full" style={{ backgroundColor: event.color }} />
                            
                            <div className="p-4">
                                {/* Título e horário */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {format(event.start, "HH:mm", { locale: ptBR })} - {format(event.end, "HH:mm")}
                                        </div>
                                    </div>
                                    <Badge 
                                        variant="outline" 
                                        className="text-xs"
                                        style={{ borderColor: event.color, color: event.color }}
                                    >
                                        {(task as any).category?.name || 'Evento'}
                                    </Badge>
                                </div>

                                {/* Contato vinculado */}
                                {contato && (
                                    <div className="mb-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-gray-900 dark:text-white">{contato.nome_completo}</span>
                                            {contato.categoria && (
                                                <Badge variant="secondary" className="text-xs">{contato.categoria}</Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            {contato.email && (
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="truncate">{contato.email}</span>
                                                </div>
                                            )}
                                            {contato.telefone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span>{contato.telefone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Oportunidade vinculada */}
                                {oportunidade && (
                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="w-4 h-4 text-emerald-600" />
                                            <span className="font-medium text-gray-900 dark:text-white">{oportunidade.titulo}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            {oportunidade.contato?.nome_completo && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{oportunidade.contato.nome_completo}</span>
                                                </div>
                                            )}
                                            {oportunidade.produto?.nome && (
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    <span>{oportunidade.produto.nome}</span>
                                                </div>
                                            )}
                                            {oportunidade.valor && (
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    <span>R$ {Number(oportunidade.valor).toLocaleString('pt-BR')}</span>
                                                </div>
                                            )}
                                            {oportunidade.etapa?.nome && (
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className="text-xs">{oportunidade.etapa.nome}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border mb-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-foreground font-bold text-2xl whitespace-nowrap">Calendário</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Gerencie sua agenda e tarefas
                        </p>
                    </div>

                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                            {/* Month Selector */}
                            <Select
                                value={String(currentDate.getMonth())}
                                onValueChange={(v) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(v), 1))}
                            >
                                <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-gray-800 text-sm font-normal border-gray-200 shadow-sm">
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
                                <SelectTrigger className="w-[90px] h-9 bg-white dark:bg-gray-800 text-sm font-normal border-gray-200 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const year = new Date().getFullYear() - 2 + i;
                                        return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-input rounded-md bg-background shadow-sm h-9">
                                <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={today} className="h-8 px-2 text-xs font-normal">
                                    Hoje
                                </Button>
                                <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full sm:w-auto">
                                <TabsList className="h-9 bg-muted p-0.5">
                                    <TabsTrigger value="month" className="h-8 text-xs px-3">Mês</TabsTrigger>
                                    <TabsTrigger value="week" className="h-8 text-xs px-3">Semana</TabsTrigger>
                                    <TabsTrigger value="day" className="h-8 text-xs px-3">Dia</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button className="gap-2 h-9" onClick={() => setNewEventOpen(true)}>
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">Novo Evento</span>
                                        <span className="sm:hidden">Novo</span>
                                    </Button>
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* V2: UnifiedTaskDialog */}
                        <UnifiedTaskDialog
                            open={newEventOpen}
                            onOpenChange={setNewEventOpen}
                            defaultDate={currentDate}
                            onSuccess={handleTaskCreated}
                        />

            {/* Main Content with Sidebar */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 px-4 lg:px-6 pb-6 overflow-hidden min-h-0">
                
                {/* Sidebar Filters */}
                <div className="hidden lg:flex flex-col gap-6 bg-white dark:bg-card border border-border rounded-xl p-4 h-full overflow-hidden">
                    <div className="flex items-center gap-2 font-medium text-foreground pb-2 border-b border-border">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </div>
                    
                    <ScrollArea className="flex-1 -mx-4 px-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Categorias</h3>
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <div key={category.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`cat-${category.id}`} 
                                                checked={selectedCategoryIds.includes(category.id)}
                                                onCheckedChange={() => toggleCategory(category.id)}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                style={selectedCategoryIds.includes(category.id) ? { backgroundColor: category.color, borderColor: category.color } : {}}
                                            />
                                            <label
                                                htmlFor={`cat-${category.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer w-full"
                                            >
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                                                <span className="truncate">{category.name}</span>
                                            </label>
                                        </div>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">Nenhuma categoria encontrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Calendar Content */}
                <div className="flex-1 bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full min-h-0">
                    <div className="flex-1 flex flex-col h-full">
                        {viewMode === 'month' && <MonthView />}
                        {viewMode === 'week' && (
                            <div className="flex flex-col h-full min-h-0">
                                {/* Week Header */}
                                <div className="grid grid-cols-7 border-b bg-muted/30 flex-none">
                                    {eachDayOfInterval({
                                        start: startOfWeek(currentDate),
                                        end: endOfWeek(currentDate)
                                    }).map(day => (
                                        <div key={day.toISOString()} className={`py-2 text-center text-sm font-semibold border-r ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                            <div className="uppercase text-xs mb-1">{format(day, 'EEE', { locale: ptBR })}</div>
                                            <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white' : ''}`}>
                                                {format(day, 'd')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Week Body */}
                                <div className="grid grid-cols-7 flex-1 min-h-0 divide-x divide-gray-200 dark:divide-gray-800">
                                    {eachDayOfInterval({
                                        start: startOfWeek(currentDate),
                                        end: endOfWeek(currentDate)
                                    }).map(day => (
                                        <div 
                                            key={day.toISOString()} 
                                            className={`
                                                p-1 flex flex-col min-h-0 hover:bg-muted/20 transition-colors cursor-pointer
                                                ${isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''}
                                            `}
                                            onClick={() => {
                                                setCurrentDate(day);
                                                setNewEventOpen(true);
                                            }}
                                        >
                                            <div className="space-y-1 flex-1 overflow-y-auto mt-1 custom-scrollbar">
                                                {filteredEvents
                                                    .filter(e => isSameDay(e.start, day))
                                                    .map(event => (
                                                        <div 
                                                            key={event.id} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedEvent(event);
                                                            }}
                                                            className="text-xs px-2 py-1 rounded text-white font-medium truncate cursor-pointer hover:opacity-90 shadow-sm mb-1"
                                                            style={{ backgroundColor: event.color }}
                                                            title={`${format(event.start, 'HH:mm')} - ${event.title}`}
                                                        >
                                                            <span className="opacity-80 text-[10px] mr-1 inline-block">
                                                                {format(event.start, 'HH:mm')}
                                                            </span>
                                                            {event.title}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {viewMode === 'day' && <DayView />}
                    </div>
                </div>
            </div>

            {/* Event Details Dialog */}
            {selectedEvent && (() => {
                const task = selectedEvent.original as Task;
                const contato = (task as any).contato;
                const oportunidade = (task as any).oportunidade;
                
                return (
                    <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                        <DialogContent className="sm:max-w-[550px]">
                            {/* Header com cor */}
                            <div className="h-2 w-full rounded-t-lg -mt-6 -mx-6 mb-4" style={{ backgroundColor: selectedEvent.color }} />
                            
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-xl">
                                    {selectedEvent.title}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2">
                                    <Badge 
                                        variant="outline" 
                                        style={{ borderColor: selectedEvent.color, color: selectedEvent.color }}
                                    >
                                        {(task as any).category?.name || 'Evento'}
                                    </Badge>
                                    {task.prioridade && (
                                        <Badge variant={
                                            task.prioridade === 'Urgente' ? 'destructive' :
                                            task.prioridade === 'Alta' ? 'default' : 'secondary'
                                        }>
                                            {task.prioridade}
                                        </Badge>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                {/* Data e hora */}
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-muted/50 p-3 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: ptBR })}
                                        </div>
                                        <div>
                                            {selectedEvent.allDay 
                                                ? 'Dia inteiro'
                                                : `${format(selectedEvent.start, "HH:mm")} - ${format(selectedEvent.end, "HH:mm")}`
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Descrição */}
                                {(task.descricao || task.observacoes) && (
                                    <div className="text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <AlignLeft className="w-4 h-4" />
                                            <span className="font-medium">Descrição</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {task.descricao || task.observacoes}
                                        </p>
                                    </div>
                                )}

                                {/* Contato vinculado */}
                                {contato && (
                                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <User className="w-5 h-5 text-blue-600" />
                                            <span className="font-semibold text-gray-900 dark:text-white">Contato Vinculado</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white text-lg">
                                                    {contato.nome_completo}
                                                </span>
                                                {contato.categoria && (
                                                    <Badge variant="secondary">{contato.categoria}</Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                {contato.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-blue-500" />
                                                        <a href={`mailto:${contato.email}`} className="hover:underline truncate">
                                                            {contato.email}
                                                        </a>
                                                    </div>
                                                )}
                                                {contato.telefone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-blue-500" />
                                                        <a href={`tel:${contato.telefone}`} className="hover:underline">
                                                            {contato.telefone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Oportunidade vinculada */}
                                {oportunidade && (
                                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Briefcase className="w-5 h-5 text-emerald-600" />
                                            <span className="font-semibold text-gray-900 dark:text-white">Oportunidade Vinculada</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="font-medium text-gray-900 dark:text-white text-lg">
                                                {oportunidade.titulo}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {oportunidade.contato?.nome_completo && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <User className="w-4 h-4 text-emerald-500" />
                                                        <span>{oportunidade.contato.nome_completo}</span>
                                                    </div>
                                                )}
                                                {oportunidade.produto?.nome && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <Tag className="w-4 h-4 text-emerald-500" />
                                                        <span>{oportunidade.produto.nome}</span>
                                                    </div>
                                                )}
                                                {oportunidade.valor && (
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                            R$ {Number(oportunidade.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {oportunidade.etapa?.nome && (
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100">
                                                            {oportunidade.etapa.nome}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
                                {task.oportunidade_id && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedEvent(null);
                                            onNavigate('opportunity-details', task.oportunidade_id!);
                                        }}
                                        className="gap-2"
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        Ver Oportunidade
                                    </Button>
                                )}
                                <Button variant="destructive" onClick={handleDeleteEvent} className="gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Excluir
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedEvent(null)} className="gap-2">
                                    <X className="w-4 h-4" />
                                    Fechar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                );
            })()}
        </div>
    );
}
