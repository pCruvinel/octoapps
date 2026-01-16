import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, Save, Building2, Upload } from 'lucide-react';
import { Separator } from '../../../components/ui/separator';

export const Route = createFileRoute('/_authenticated/settings/company')({
  component: CompanySettingsPage,
});

function CompanySettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    logo_url: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      loadOrganization(profile.organization_id);
    } else if (profile && !profile.organization_id) {
      // User has no organization? This shouldn't happen for Gestor/Member
      // But if it does, maybe allow creating one?
      setFetching(false);
    }
  }, [profile]);

  const loadOrganization = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || '',
          cnpj: data.cnpj || '',
          email: data.contact_email || '',
          phone: data.contact_phone || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) {
      toast.error('Você não está vinculado a uma organização');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          cnpj: formData.cnpj,
          contact_email: formData.email,
          contact_phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          logo_url: formData.logo_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.organization_id);

      if (error) throw error;

      toast.success('Configurações da empresa salvas com sucesso');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Only Gestor or Admin Master can edit
  const canEdit = profile?.role === 'Gestor' || profile?.role === 'Admin Master' || profile?.roles?.includes('Administrador');

  if (!canEdit) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <Building2 className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        </div>
        <p className="text-muted-foreground">Apenas o Gestor pode editar as configurações da empresa.</p>
      </div>
    );
  }

  // If no org, create UI (simplified for now)
  if (!profile?.organization_id && canEdit) {
     // TODO: Implement Create Org flow if needed, for new users
     return <div className="p-6">Você precisa criar uma organização.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha Empresa</h1>
          <p className="text-muted-foreground">
            Gerencie as informações cadastrais e visuais da sua organização.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
            <CardDescription>
              Informações que aparecerão nos documentos e relatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social / Nome Fantasia *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Silva & Souza Advogados"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail de Contato</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-2">
               <Label>Endereço</Label>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input name="zip_code" placeholder="CEP" value={formData.zip_code} onChange={handleChange} />
                 <div className="hidden md:block"></div>
                 <Input name="address_line1" placeholder="Endereço (Rua, Av)" className="md:col-span-2" value={formData.address_line1} onChange={handleChange} />
                 <Input name="address_line2" placeholder="Número / Complemento" value={formData.address_line2} onChange={handleChange} />
                 <Input name="address_bairro" placeholder="Bairro" disabled value="" /> {/* Todo: add field if needed */}
                 <Input name="city" placeholder="Cidade" value={formData.city} onChange={handleChange} />
                 <Input name="state" placeholder="Estado (UF)" value={formData.state} onChange={handleChange} />
               </div>
            </div>
            
            <Separator className="my-4" />

            <div className="space-y-2">
                <Label>Identidade Visual</Label>
                <div className="flex items-center gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-32 h-32 flex flex-col items-center justify-center text-gray-400">
                        {formData.logo_url ? (
                           <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                           <Upload className="w-8 h-8 mb-2" />
                        )}
                        <span className="text-xs">{formData.logo_url ? 'Alterar' : 'Upload Logo'}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="logo_url">URL do Logo (temporário)</Label>
                        <Input
                             id="logo_url"
                             name="logo_url"
                             value={formData.logo_url}
                             onChange={handleChange}
                             placeholder="https://..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Futuramente implementaremos upload direto. Por enquanto insira uma URL pública.
                        </p>
                    </div>
                </div>
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
