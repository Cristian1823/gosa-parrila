import { useEffect, useMemo, useState } from 'react';
import { api, groupMenu, money } from '../lib.js';
import './carta.css';

// Datos del pie de la carta impresa. Si un campo queda vacío, no se imprime.
const INFO = {
  horario: '',
  direccion: '',
  redes: 'Instagram @gosa_ft  ·  TikTok @gosa.food.truck'
};
const BANDS = new Set(['entradas', 'perros', 'hamburguesas', 'salchipapas', 'platos-a-la-carta', 'adicionales', 'bebidas']);
// Categorías que se listan en una sola línea (nombre ····· precio), sin descripción
const COMPACT = new Set(['adicionales', 'acompanantes', 'bebidas']);

const Line = ({ name, price, badge, className = '' }) => (
  <div className={'c-line ' + className}>
    <span className="c-name">{name}</span>
    {badge && <span className="c-badge">{badge}</span>}
    <span className="c-dots" aria-hidden="true" />
    <span className="c-price">{money(price)}</span>
  </div>
);

/** Carta para imprimir (Carta/Letter). Documento estático: sin acordeones ni botones al imprimir. */
export default function Carta() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('tema'); // ?tema=claro | oscuro
    if (q) return q === 'claro' ? 'light' : 'dark';
    try { return localStorage.getItem('gosa_carta_tema') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => { api.menu().then(setItems).catch((e) => setError(e.message)); }, []);
  // El fondo debe cubrir toda la hoja, también los márgenes: se marca el <html>.
  useEffect(() => {
    document.documentElement.classList.add('carta-root', 'carta-' + theme);
    try { localStorage.setItem('gosa_carta_tema', theme); } catch { /* sin almacenamiento */ }
    return () => document.documentElement.classList.remove('carta-root', 'carta-' + theme);
  }, [theme]);

  const sections = useMemo(() => groupMenu(items), [items]);

  return (
    <div className="carta">
      <div className="carta-toolbar no-print">
        <div className="chips" role="group" aria-label="Estilo de impresión">
          <button className="chip" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Fondo negro (marca)</button>
          <button className="chip" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Fondo blanco (ahorra tinta)</button>
        </div>
        <button className="btn" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
        <p className="muted">Tamaño Carta. En el diálogo de impresión activa “Gráficos de fondo” y desactiva “Encabezados y pies de página”.</p>
      </div>

      {error && <p className="notice err no-print">{error}</p>}

      <article className="c-sheet">
        <header className="c-head">
          <img src="/logo.jpg" alt="Logo GOSA" className="c-logo" />
          <div>
            <h1>GOSA</h1>
            <p className="c-sub">Comida Gourmet con Actitud</p>
          </div>
        </header>
        <h2 className="c-title">NUESTRO MENÚ</h2>

        {sections.map((s) => (
          <section key={s.id} className="c-sec">
            <h3 className={'c-band' + (BANDS.has(s.id) ? ' band-' + s.id : '')}>{s.title.toUpperCase()}</h3>
            {s.id === 'perros' && (
              <>
                <p className="c-note"><b>¡ADICIÓN!</b> Por solo <b>+$5.000</b> disfruta tu perro con salchicha americana</p>
                <p className="c-note"><b>¡HAZLO COMBO!</b> Con la bebida del día por solo <b>$6.500</b> · con un producto Coca-Cola <b>$8.000</b> · con uno Postobón <b>$7.500</b></p>
              </>
            )}
            <div className={'c-cols' + (COMPACT.has(s.id) ? ' compact' : '')}>
              {s.list.map((i) =>
                COMPACT.has(s.id) ? (
                  <Line key={i.id} name={i.name} price={i.price} className="c-item" />
                ) : (
                  <div key={i.id} className="c-item">
                    <Line name={i.name} price={i.price} badge={i.badge} className="c-main" />
                    {i.description && <p className="c-desc">{i.description}</p>}
                    {i.variants.map((v) => <Line key={v.id} name={v.name} price={v.price} className="c-var" />)}
                  </div>
                )
              )}
            </div>
          </section>
        ))}

        <footer className="c-foot">
          {(INFO.horario || INFO.direccion) && <p>{[INFO.horario, INFO.direccion].filter(Boolean).join('  ·  ')}</p>}
          <p>{INFO.redes}</p>
        </footer>
      </article>
    </div>
  );
}
