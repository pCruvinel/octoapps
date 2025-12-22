import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ContactsList } from '@/components/contacts/ContactsList';

export const Route = createFileRoute('/_authenticated/crm/contatos')({
  component: ContatosPage,
});

function ContatosPage() {
  const navigate = useNavigate();

  return (
    <ContactsList
      onNavigate={(route: string, id?: string) => {
        if (route === 'contact-details' && id) {
          navigate({ to: '/contatos/$id', params: { id } });
        }
      }}
    />
  );
}
