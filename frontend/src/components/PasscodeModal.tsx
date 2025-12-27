import { useState } from 'react';
import { usePasscode } from '../contexts/PasscodeContext';

const PasscodeModal = () => {
  const { passcode, setPasscode } = usePasscode();
  const [value, setValue] = useState(passcode ?? '');
  const [open, setOpen] = useState(!passcode);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Enter Company Passcode</h2>
        <p className="mt-2 text-sm text-slate-600">
          Writes are protected. Enter the shared passcode to enable create/update/delete.
        </p>
        <input
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            Skip
          </button>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={() => {
              setPasscode(value || null);
              setOpen(false);
            }}
          >
            Save Passcode
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasscodeModal;
