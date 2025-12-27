import { usePasscode } from '../contexts/PasscodeContext';

const functionBase = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;

export const getFunctionsBase = () => {
  return functionBase || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
};

export const buildHeaders = (passcode: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (passcode) {
    headers['X-COMPANY-PASSCODE'] = passcode;
  }
  return headers;
};

export const useWriteApi = () => {
  const { passcode } = usePasscode();

  const post = async <T>(path: string, payload: unknown): Promise<T> => {
    const response = await fetch(`${getFunctionsBase()}/${path}`, {
      method: 'POST',
      headers: buildHeaders(passcode),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  };

  return { post };
};
