import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface PasscodeContextValue {
  passcode: string | null;
  setPasscode: (value: string | null) => void;
}

const PasscodeContext = createContext<PasscodeContextValue | undefined>(undefined);

export const PasscodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [passcode, setPasscodeState] = useState<string | null>(() => {
    return sessionStorage.getItem('company_passcode');
  });

  const setPasscode = useCallback((value: string | null) => {
    if (value) {
      sessionStorage.setItem('company_passcode', value);
    } else {
      sessionStorage.removeItem('company_passcode');
    }
    setPasscodeState(value);
  }, []);

  const value = useMemo(() => ({ passcode, setPasscode }), [passcode, setPasscode]);

  return <PasscodeContext.Provider value={value}>{children}</PasscodeContext.Provider>;
};

export const usePasscode = () => {
  const context = useContext(PasscodeContext);
  if (!context) {
    throw new Error('usePasscode must be used within PasscodeProvider');
  }
  return context;
};
