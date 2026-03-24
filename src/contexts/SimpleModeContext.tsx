import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SimpleModeContextType {
  isSimpleMode: boolean;
  toggleSimpleMode: () => void;
  setSimpleMode: (value: boolean) => void;
}

const SimpleModeContext = createContext<SimpleModeContextType | undefined>(undefined);

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [isSimpleMode, setIsSimpleMode] = useLocalStorage<boolean>(
    'kredi-pusula-simple-mode',
    false
  );

  const toggleSimpleMode = useCallback(() => {
    setIsSimpleMode((prev) => !prev);
  }, [setIsSimpleMode]);

  const setSimpleMode = useCallback((value: boolean) => {
    setIsSimpleMode(value);
  }, [setIsSimpleMode]);

  return (
    <SimpleModeContext.Provider value={{ isSimpleMode, toggleSimpleMode, setSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  const context = useContext(SimpleModeContext);
  if (!context) {
    throw new Error('useSimpleMode must be used within a SimpleModeProvider');
  }
  return context;
}
