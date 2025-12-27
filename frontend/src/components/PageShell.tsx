import React from 'react';

const PageShell: React.FC<{ title: string; actions?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  actions,
  children
}) => {
  return (
    <section className="px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
};

export default PageShell;
