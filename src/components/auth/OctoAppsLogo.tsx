interface OctoAppsLogoProps {
  className?: string;
}

export function OctoAppsLogo({ className = "" }: OctoAppsLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Ícone Octogonal */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Octógono azul */}
        <path
          d="M14.344 3.515a4 4 0 0 1 2.828-1.172h13.656a4 4 0 0 1 2.828 1.172l9.657 9.657a4 4 0 0 1 1.172 2.828v13.656a4 4 0 0 1-1.172 2.828l-9.657 9.657a4 4 0 0 1-2.828 1.172H17.172a4 4 0 0 1-2.828-1.172l-9.657-9.657a4 4 0 0 1-1.172-2.828V16.828a4 4 0 0 1 1.172-2.828l9.657-9.657z"
          fill="#3B82F6"
        />
        {/* Letra O branca */}
        <circle
          cx="24"
          cy="24"
          r="10"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
        />
      </svg>

      {/* Texto OctoApps */}
      <span className="text-4xl font-bold text-white tracking-tight">
        OctoApps
      </span>
    </div>
  );
}
