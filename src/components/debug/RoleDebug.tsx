import { useAuth } from '../../hooks/useAuth';

export function RoleDebug() {
  const { user, profile, hasRole, isAdmin } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🔍 Role Debug Info</h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>User ID:</strong>
          <div className="font-mono text-xs break-all">{user.id}</div>
        </div>

        <div>
          <strong>Email:</strong>
          <div className="font-mono text-xs">{user.email}</div>
        </div>

        <div>
          <strong>Profile Nome:</strong>
          <div className="font-mono text-xs">{profile?.nome_completo || 'N/A'}</div>
        </div>

        <div>
          <strong>Roles:</strong>
          <div className="font-mono text-xs">
            {profile?.roles && profile.roles.length > 0 ? (
              <ul className="list-disc list-inside">
                {profile.roles.map((role, index) => (
                  <li key={index} className="text-green-400">{role}</li>
                ))}
              </ul>
            ) : (
              <span className="text-red-400">Nenhuma role encontrada</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <strong>Verificações:</strong>
          <div className="space-y-1 mt-1">
            <div className="flex items-center gap-2">
              <span className={isAdmin() ? 'text-green-400' : 'text-red-400'}>
                {isAdmin() ? '✅' : '❌'}
              </span>
              <span>isAdmin(): {isAdmin().toString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasRole('Administrador') ? 'text-green-400' : 'text-red-400'}>
                {hasRole('Administrador') ? '✅' : '❌'}
              </span>
              <span>hasRole('Administrador'): {hasRole('Administrador').toString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasRole('Advogado') ? 'text-green-400' : 'text-red-400'}>
                {hasRole('Advogado') ? '✅' : '❌'}
              </span>
              <span>hasRole('Advogado'): {hasRole('Advogado').toString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Abra o console do navegador para ver os logs detalhados
      </div>
    </div>
  );
}
