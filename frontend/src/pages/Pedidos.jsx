import { useEffect, useMemo, useState } from 'react';
import { api, money } from '../lib.js';
import { IconMinus, IconPlus, PosLayout, Title } from '../components/Bits.jsx';

export default function Pedidos() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState(null);
  const [qty, setQty] = useState({});
  const [modo, setModo] = useState('mesa');
  const [mesa, setMesa] = useState(1);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.menu().then((m) => { setItems(m); setCat(m[0]?.cat ?? null); }).catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  const cats = useMemo(() => [...new Set(items.map((i) => i.cat))], [items]);
  const change = (id, d) => {
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + d) }));
    setMsg(null);
  };
  const lines = items.filter((i) => qty[i.id] > 0);
  const total = lines.reduce((a, i) => a + qty[i.id] * i.price, 0);
  const place = modo === 'mesa' ? `Mesa ${mesa}` : 'Para llevar';

  const send = async () => {
    setBusy(true);
    try {
      const o = await api.createOrder({ place, items: lines.map((i) => ({ menu_id: i.id, qty: qty[i.id] })) });
      setQty({});
      setMsg({ ok: true, text: `Pedido #${o.id} (${place}) enviado a cocina.` });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PosLayout>
      <main className="order-layout">
        <section className="catalog">
          <Title>Toma de pedidos</Title>
          <div className="chips" role="group" aria-label="Categorías">
            {cats.map((c) => (
              <button key={c} className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="grid-products">
            {items.filter((i) => i.cat === cat).map((i) => {
              const n = qty[i.id] || 0;
              return (
                <button key={i.id} className={'product' + (n ? ' on' : '')} onClick={() => change(i.id, 1)} aria-label={`Agregar ${i.name}`}>
                  <span className="name">{i.name}</span>
                  <span className="price">{money(i.price)}</span>
                  {n > 0 && <span className="badge">{n}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="ticket" aria-label="Pedido actual">
          <h2 className="display">Nuevo pedido</h2>
          <div className="seg" role="group" aria-label="Tipo de pedido">
            <button className="chip" aria-pressed={modo === 'mesa'} onClick={() => setModo('mesa')}>En mesa</button>
            <button className="chip" aria-pressed={modo === 'llevar'} onClick={() => setModo('llevar')}>Para llevar</button>
          </div>
          {modo === 'mesa' && (
            <div className="chips" role="group" aria-label="Mesa">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button key={n} className="chip sq" aria-label={`Mesa ${n}`} aria-pressed={n === mesa} onClick={() => setMesa(n)}>{n}</button>
              ))}
            </div>
          )}

          <div className="lines">
            {lines.length === 0 && <p className="muted" style={{ margin: 'auto', textAlign: 'center' }}>Toca un producto para agregarlo.</p>}
            {lines.map((i) => (
              <div className="line" key={i.id}>
                <div><b>{i.name}</b><small>{money(qty[i.id] * i.price)}</small></div>
                <div className="stepper">
                  <button onClick={() => change(i.id, -1)} aria-label={`Quitar uno de ${i.name}`}><IconMinus /></button>
                  <span>{qty[i.id]}</span>
                  <button onClick={() => change(i.id, 1)} aria-label={`Agregar uno más de ${i.name}`}><IconPlus /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="total-row"><span>Total</span><span>{money(total)}</span></div>
          <button className="btn block lg" onClick={send} disabled={lines.length === 0 || busy}>Enviar a cocina</button>
          {msg && <p className={'notice' + (msg.ok ? '' : ' err')} role="status">{msg.text}</p>}
        </aside>
      </main>
    </PosLayout>
  );
}
