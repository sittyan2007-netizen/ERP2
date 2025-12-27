import React from 'react';
import clsx from 'clsx';

const FilterChip: React.FC<{ label: string; active?: boolean; onClick?: () => void }> = ({
  label,
  active,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1 text-xs font-medium',
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'
      )}
    >
      {label}
    </button>
  );
};

export default FilterChip;
