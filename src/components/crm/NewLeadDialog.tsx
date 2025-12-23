
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { TipoOperacaoSelect } from '@/components/shared/TipoOperacaoSelect';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface NewLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    contacts: any[];
    profiles: any[];
}

const formSchema = z.object({
    contato_id: z.string().min(1, 'Selecione um contato'),
    responsavel_id: z.string().min(1, 'Selecione um responsável'),
    origem: z.string().optional(),
    etapa_funil_id: z.string().min(1, 'Selecione uma etapa'),
    tipo_operacao: z.string().min(1, 'Selecione o tipo de operação'),
    valor_estimado: z.number().optional().default(0),
    observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ORIGEM_OPTIONS = [
    { value: 'Indicação', label: 'Indicação' },
    { value: 'Ads', label: 'Ads' },
    { value: 'Meta', label: 'Meta' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Google', label: 'Google' },
    { value: 'Outro', label: 'Outro' },
];

export function NewLeadDialog({ open, onOpenChange, onSuccess, contacts, profiles }: NewLeadDialogProps) {
    const { user } = useAuth();
    const { etapas } = useEtapasFunil();
    const [loading, setLoading] = useState(false);
    const [showNewContactForm, setShowNewContactForm] = useState(false);

    // New contact form data (kept generic state for simplicity as it's a sub-form)
    const [newContact, setNewContact] = useState({
        nome_completo: '',
        telefone_principal: '',
        email: '',
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contato_id: '',
            responsavel_id: '',
            origem: '',
            etapa_funil_id: '',
            tipo_operacao: '',
            valor_estimado: 0,
            observacoes: '',
        },
    });

    // Set default values when dialog opens
    useEffect(() => {
        if (open && etapas.length > 0 && user) {
            form.reset({
                contato_id: '',
                responsavel_id: user.id,
                origem: '',
                etapa_funil_id: etapas[0].id,
                tipo_operacao: '',
                valor_estimado: 0,
                observacoes: '',
            });
        }
    }, [open, etapas, user, form]);

    const handleCreateContact = async () => {
        if (!newContact.nome_completo.trim()) {
            toast.error('Informe o nome do contato');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('contatos')
                .insert({
                    nome_completo: newContact.nome_completo.trim(),
                    telefone_principal: newContact.telefone_principal || null,
                    email: newContact.email || null,
                    criado_por: user?.id,
                    tipo: 'Pessoa Física',
                    status_contato: 'Ativo',
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Contato criado!');
            setShowNewContactForm(false);
            setNewContact({ nome_completo: '', telefone_principal: '', email: '' });

            return data.id;
        } catch (error: any) {
            console.error('Error creating contact:', error);
            toast.error('Erro ao criar contato');
            return null;
        }
    };

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            let contactId = values.contato_id;

            // If creating new contact, do it first
            if (showNewContactForm && newContact.nome_completo.trim()) {
                const newContactId = await handleCreateContact();
                if (newContactId) {
                    contactId = newContactId;
                } else {
                    return; // Error handled inside create
                }
            } else if (!contactId && !showNewContactForm) {
                toast.error('Selecione ou crie um contato');
                return;
            }

            // Get contact name for title generation
            const contactName = showNewContactForm
                ? newContact.nome_completo
                : contacts.find(c => c.id === contactId)?.nome_completo || 'Sem Nome';

            const currentTitle = `${contactName}`;

            const { data: createdOpp, error } = await supabase
                .from('oportunidades')
                .insert([{
                    titulo: currentTitle,
                    contato_id: contactId || null,
                    responsavel_id: values.responsavel_id || user?.id || null,
                    origem: values.origem || null,
                    tipo_acao: values.tipo_operacao || null,
                    etapa_funil_id: values.etapa_funil_id || etapas[0]?.id || null,
                    valor_estimado: values.valor_estimado || 0,
                    observacoes: values.observacoes || null,
                    criado_por: user?.id || null,
                }])
                .select('id')
                .single();

            if (error) throw error;

            // Log activity (non-blocking)
            const responsavelNome = profiles.find(p => p.id === values.responsavel_id)?.nome_completo || 'Não definido';
            const etapaNome = etapas.find(e => e.id === values.etapa_funil_id)?.nome || 'Primeira etapa';

            supabase.from('log_atividades').insert({
                user_id: user?.id,
                acao: 'CRIAR_OPORTUNIDADE',
                entidade: 'oportunidades',
                entidade_id: createdOpp.id,
                dados_anteriores: null,
                dados_novos: {
                    titulo: currentTitle,
                    contato: contactName,
                    tipo_acao: values.tipo_operacao || null,
                    valor_estimado: values.valor_estimado || 0,
                    etapa: etapaNome,
                    responsavel: responsavelNome,
                    origem: values.origem || null
                }
            }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

            toast.success('Oportunidade criada com sucesso!');
            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Error creating opportunity:', error);
            toast.error(error.message || 'Erro ao criar oportunidade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nova Oportunidade</DialogTitle>
                    <DialogDescription>
                        Cadastre uma nova oportunidade de negócio
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <div className="grid grid-cols-2 gap-4">
                            {/* Contato (Col-Span-2 for header, then internal structure) */}
                            <div className="col-span-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Contato</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-blue-600"
                                        onClick={() => {
                                            setShowNewContactForm(!showNewContactForm);
                                            if (!showNewContactForm) form.setValue('contato_id', '');
                                        }}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {showNewContactForm ? 'Selecionar existente' : 'Criar novo'}
                                    </Button>
                                </div>

                                {showNewContactForm ? (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Nome completo"
                                                value={newContact.nome_completo}
                                                onChange={(e) => setNewContact(prev => ({ ...prev, nome_completo: e.target.value }))}
                                                className="bg-white w-full"
                                            />
                                        </div>
                                        <Input
                                            placeholder="Telefone"
                                            value={newContact.telefone_principal}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, telefone_principal: e.target.value }))}
                                            className="bg-white w-full"
                                        />
                                        <Input
                                            placeholder="E-mail"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                            className="bg-white w-full"
                                        />
                                    </div>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="contato_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Selecione um contato" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {contacts.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            {/* Tipo de Operação */}
                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="tipo_operacao"
                                    render={({ field }) => (
                                        <TipoOperacaoSelect
                                            field={field}
                                            categorias={['EMPRESTIMO', 'VEICULO', 'IMOBILIARIO', 'CARTAO', 'OUTROS']}
                                            placeholder="Selecione o produto"
                                            label="Produto / Operação"
                                        />
                                    )}
                                />
                            </div>

                            {/* Valor Estimado */}
                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="valor_estimado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor Estimado</FormLabel>
                                            <FormControl>
                                                <CurrencyInput
                                                    className="w-full"
                                                    value={field.value}
                                                    onChange={(val) => field.onChange(val || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Responsável */}
                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="responsavel_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Responsável</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {profiles.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Origem */}
                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="origem"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Origem</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Como chegou?" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ORIGEM_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Observações */}
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="observacoes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detalhes adicionais sobre a oportunidade..."
                                                    className="resize-none h-24 w-full"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Criar Oportunidade
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
