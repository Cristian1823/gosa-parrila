import { NavLink } from 'react-router-dom';

const Icon = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
export const IconPlus = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
export const IconMinus = () => <Icon><path d="M5 12h14" /></Icon>;

export const Title = ({ children }) => (
  <header className="title-block">
    <h1 className="display">{children}</h1>
  </header>
);

export function Sidebar() {
  return (
    <aside className="sidebar">
      <img className="logo" src="/logo.jpg" alt="GOSA Parrilla" />
      <nav aria-label="Principal">
        <NavLink to="/pos/pedidos">
          <Icon><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></Icon>
          Toma de pedidos
        </NavLink>
        <NavLink to="/pos/cocina">
          <Icon><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z" /></Icon>
          Cocina
        </NavLink>
        <NavLink to="/pos/pagos">
          <Icon><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></Icon>
          Pagos
        </NavLink>
      </nav>
      <p className="foot">Turno · [CAJERO]</p>
    </aside>
  );
}

export const PosLayout = ({ children }) => (
  <div className="app">
    <Sidebar />
    {children}
  </div>
);
