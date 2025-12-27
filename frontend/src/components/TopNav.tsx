import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const links = [
  { to: '/inventory', label: 'Inventory' },
  { to: '/invoice', label: 'Invoice' },
  { to: '/memos', label: 'Memos' },
  { to: '/production', label: 'Production' },
  { to: '/cashbook', label: 'Cashbook' },
  { to: '/reports', label: 'Reports' }
];

const TopNav = () => {
  return (
    <nav className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      <div className="text-lg font-semibold text-slate-800">Gemstone ERP</div>
      <div className="ml-6 flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              clsx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default TopNav;
