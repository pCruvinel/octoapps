import { createFileRoute } from '@tanstack/react-router';
import { ContactDetails } from '@/components/contacts/ContactDetails';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/contatos/$id')({
  component: ContactDetailPage,
});

function ContactDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <ContactDetails
      contactId={id}
      onNavigate={(route: string) => {
        if (route === 'contacts' || route === 'crm/contatos') {
          navigate({ to: '/crm/contatos' });
        }
      }}
    />
  );
}
