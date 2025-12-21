
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';

interface NewLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    contacts: any[];
    profiles: any[];
}

const CATEGORIA_OPTIONS = [
    { value: 'Veículos/Empréstimos', label: 'Veículos/Empréstimos' },
    { value: 'Imobiliário', label: 'Imobiliário' },
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
];

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

    const [formData, setFormData] = useState({
        titulo: '',
        contato_id: '',
        responsavel_id: '',
        origem: '',
        etapa_funil_id: '',
        tipo_acao: '',
    });

    // New contact form data
    const [newContact, setNewContact] = useState({
        nome_completo: '',
        telefone_principal: '',
        email: '',
    });

    // Set default values when dialog opens
    useEffect(() => {
        if (open && etapas.length > 0 && !formData.etapa_funil_id) {
            setFormData(prev => ({
                ...prev,
                etapa_funil_id: etapas[0].id, // First stage as default
                responsavel_id: user?.id || '',
            }));
        }
    }, [open, etapas, user]);

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
                    tipo: 'PF',
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

    const handleSubmit = async () => {
        if (!formData.titulo.trim()) {
            toast.error('Preencha o título da oportunidade');
            return;
        }

        setLoading(true);
        try {
            // If creating new contact, do it first
            let contactId = formData.contato_id;
            if (showNewContactForm && newContact.nome_completo.trim()) {
                const newContactId = await handleCreateContact();
                if (newContactId) {
                    contactId = newContactId;
                }
            }

            const { error } = await supabase
                .from('oportunidades')
                .insert([{
                    titulo: formData.titulo.trim(),
                    contato_id: contactId || null,
                    responsavel_id: formData.responsavel_id || user?.id || null,
                    origem: formData.origem || null,
                    tipo_acao: formData.tipo_acao || null,
                    etapa_funil_id: formData.etapa_funil_id || etapas[0]?.id || null,
                    criado_por: user?.id || null,
                }]);

            if (error) throw error;

            toast.success('Oportunidade criada com sucesso!');
            onSuccess();
            onOpenChange(false);

            // Reset form
            setFormData({
                titulo: '',
                contato_id: '',
                responsavel_id: user?.id || '',
                origem: '',
                etapa_funil_id: etapas[0]?.id || '',
            });
            setShowNewContactForm(false);

        } catch (error: any) {
            console.error('Error creating opportunity:', error);
            toast.error(error.message || 'Erro ao criar oportunidade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Nova Oportunidade</DialogTitle>
                    <DialogDescription>
                        Cadastre uma nova oportunidade de negócio
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título *</Label>
                        <Input
                            id="titulo"
                            value={formData.titulo}
                            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                            placeholder="Ex: Revisão de Financiamento - João"
                        />
                    </div>

                    {/* Contato */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Contato</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600"
                                onClick={() => setShowNewContactForm(!showNewContactForm)}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                {showNewContactForm ? 'Selecionar existente' : 'Criar novo'}
                            </Button>
                        </div>

                        {showNewContactForm ? (
                            <div className="space-y-2 p-3 bg-slate-50 rounded-lg border">
                                <Input
                                    placeholder="Nome completo"
                                    value={newContact.nome_completo}
                                    onChange={(e) => setNewContact(prev => ({ ...prev, nome_completo: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Telefone"
                                        value={newContact.telefone_principal}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, telefone_principal: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="E-mail"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <Select
                                value={formData.contato_id}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, contato_id: value }))}
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
                        )}
                    </div>

                    {/* Responsável */}
                    <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Select
                            value={formData.responsavel_id}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, responsavel_id: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Categoria */}
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select
                            value={formData.tipo_acao}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_acao: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo de serviço" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIA_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Origem */}
                    <div className="space-y-2">
                        <Label>Origem</Label>
                        <Select
                            value={formData.origem}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, origem: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Como chegou até você?" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORIGEM_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Criar Oportunidade
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
