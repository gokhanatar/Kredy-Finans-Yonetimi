import { useTranslation } from 'react-i18next';

export type Scope = 'personal' | 'family';

interface ScopeToggleProps {
  scope: Scope;
  onChange: (scope: Scope) => void;
}

export function ScopeToggle({ scope, onChange }: ScopeToggleProps) {
  const { t } = useTranslation(['family']);

  return (
    <div className="flex gap-1 rounded-lg bg-secondary p-1 mx-4 mb-2">
      <button
        onClick={() => onChange('personal')}
        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
          scope === 'personal' ? 'bg-background shadow-sm' : 'text-muted-foreground'
        }`}
      >
        {t('scopeToggle.personal')}
      </button>
      <button
        onClick={() => onChange('family')}
        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
          scope === 'family' ? 'bg-background shadow-sm' : 'text-muted-foreground'
        }`}
      >
        {t('scopeToggle.family')}
      </button>
    </div>
  );
}
