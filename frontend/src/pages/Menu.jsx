import { useEffect, useMemo, useState } from 'react';
import { api, groupMenu, money, slug } from '../lib.js';

// Mismos iconos de categoría que el menú de la sede Food Truck (Font Awesome)
const ICONS = {
  entradas: 'fa-fire', ahumados: 'fa-fire-flame-curved', perros: 'fa-hotdog', salchichas: 'fa-hotdog',
  hamburguesas: 'fa-hamburger', salchipapas: 'fa-drumstick-bite', 'platos-a-la-carta': 'fa-utensils', adicionales: 'fa-plus-circle',
  acompanantes: 'fa-plus-circle', combos: 'fa-crown', bebidas: 'fa-glass-cheers'
};
// Fotos de cabecera por categoría (las mismas de la sede Food Truck)
const HEADER_BG = new Set(['entradas', 'perros', 'hamburguesas', 'salchipapas', 'platos-a-la-carta', 'adicionales', 'bebidas']);
const upper = (s) => s.toUpperCase();

/** Menú digital de solo lectura: el cliente lo ve y pide al mesero. */
export default function Menu() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.menu().then((m) => { setItems(m); setOpen(m[0] ? slug(m[0].cat) : null); }).catch((e) => setError(e.message));
  }, []);

  const sections = useMemo(() => groupMenu(items), [items]);

  return (
    <div className="menu-page">
      <header className="menu-head">
        <img className="logo" src="/logo.jpg" alt="Logo GOSA" />
        <h1>GOSA</h1>
        <p className="subtitle">Comida Gourmet con Actitud</p>
      </header>

      <main className="menu-main">
        <h2 className="menu-title">NUESTRO MENÚ</h2>
        {error && <p className="notice err" role="alert">{error}</p>}

        <div className="accordion-menu">
          {sections.map((s) => {
            const active = open === s.id;
            const extras = s.id === 'adicionales' || s.id === 'acompanantes';
            return (
              <div key={s.id} className={'accordion-item' + (active ? ' active' : '')}>
                <button className={`accordion-header header-${HEADER_BG.has(s.id) ? s.id : 'plain'}`} aria-expanded={active} onClick={() => setOpen(active ? null : s.id)}>
                  <i className={`fas ${ICONS[s.id] || 'fa-utensils'}`} aria-hidden="true" />
                  <span>{upper(s.title)}</span>
                  <i className="fas fa-chevron-down accordion-icon" aria-hidden="true" />
                </button>
                <div className="accordion-content">
                  {s.id === 'perros' && (
                    <>
                      <div className="info-bubble">
                        <img src="/images/vaca.jpeg" alt="" className="info-bubble-img" />
                        <div className="info-bubble-text">
                          <span className="info-bubble-tag">¡ADICIÓN!</span>
                          <p>Por solo <strong className="info-bubble-price">+$5.000</strong> disfruta tu perro con <strong>salchicha americana</strong></p>
                        </div>
                      </div>
                      <div className="info-bubble">
                        <div className="info-bubble-text">
                          <span className="info-bubble-tag">¡HAZLO COMBO!</span>
                          <p>Con la <strong>bebida del día</strong> por solo <strong className="info-bubble-price">$6.500</strong> · con un producto <strong>Coca-Cola</strong> <strong>$8.000</strong> · con uno <strong>Postobón</strong> <strong>$7.500</strong></p>
                        </div>
                      </div>
                    </>
                  )}
                  {s.id === 'bebidas' ? (
                    <div className="bebidas-content">
                      <img src="/images/bebidas.jpeg" alt="Bebidas disponibles" className="bebidas-imagen" />
                    </div>
                  ) : extras ? (
                    <div className="extras-grid">
                      {s.list.map((i) => (
                        <div className="extra-item" key={i.id}>
                          <span className="extra-name">{i.name}</span>
                          <span className="extra-price">{money(i.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="menu-grid">
                      {s.list.map((i) => (
                        <div className={'menu-card' + (i.badge ? ' featured' : '')} key={i.id}>
                          {i.badge && <div className="featured-badge">{i.badge}</div>}
                          <div className="card-header">
                            <h3>{upper(i.name)}</h3>
                            <span className="price">{money(i.price)}</span>
                          </div>
                          {i.description && <p className="description">{i.description}</p>}
                          {i.variants.map((v) => (
                            <div className="double-option" key={v.id}>
                              <span className="double-name">{v.name}</span>
                              <span className="double-price">{money(v.price)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="menu-foot">
        <h2 className="footer-title">SÍGUENOS EN NUESTRAS REDES</h2>
        <div className="social-icons">
          <a href="https://www.tiktok.com/@gosa.food.truck" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i className="fab fa-tiktok" /></a>
          <a href="https://www.instagram.com/gosa_ft" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram" /></a>
        </div>
        <p className="info"><span>[HORARIO]</span><span>[DIRECCIÓN DEL LOCAL]</span></p>
        <p className="footer-text">GOSA © Comida Gourmet con Actitud</p>
      </footer>
    </div>
  );
}
