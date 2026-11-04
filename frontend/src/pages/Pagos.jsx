import { useState } from 'react';
import { api, money, usePolling } from '../lib.js';
import { PosLayout, Title } from '../components/Bits.jsx';

const fetchUnpaid = () => api.orders('?paid=false');
const METHODS = [['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'], ['nequi', 'Nequi / transferencia']];
const BILLS = ['exact', 50000, 100000, 200000];
const roundTip = (sub, pct) => Math.round((sub * pct) / 100 / 100) * 100;

export default function Pagos() {
  const [accounts, reload, error] = usePolling(fetchUnpaid, 5000);
  const [selId, setSelId] = useState(null);
  const [tip, setTip] = useState(10);
  const [method, setMethod] = useState('efectivo');
  const [rec, setRec] = useState('exact');
  const [msg, setMsg] = useState(null);

  const open = accounts || [];
  const cur = open.find((o) => o.id === selId) || open[0];
  const sub = cur ? cur.subtotal : 0;
  const tipAmt = roundTip(sub, tip);
  const total = sub + tipAmt;
  const received = rec === 'exact' ? total : rec;
  const diff = received - total;
  const cash = method === 'efectivo';
  const cantPay = !cur || (cash && diff < 0);

  const pick = (id) => { setSelId(id); setRec('exact'); setMsg(null); };
  const pay = async () => {
    try {
      const o = await api.pay(cur.id, { tip_pct: tip, method });
      setMsg({ ok: true, text: `${o.place} · #${o.id} cobrada por ${money(o.total)}.` });
      setSelId(null);
      setRec('exact');
      reload();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
  };

  return (
    <PosLayout>
      <main className="content">
        <Title>Pagos</Title>
        {error && <p className="notice err" role="alert">No se pudo actualizar: {error.message}</p>}
        {msg && <p className={'notice' + (msg.ok ? '' : ' err')} role="status">{msg.text}</p>}

        <div className="pay-wrap">
          <section className="pay-list" aria-label="Cuentas abiertas">
            <h2>Cuentas abiertas</h2>
            {open.length === 0 && <p className="muted" style={{ fontSize: 14, padding: '24px 0' }}>No hay cuentas abiertas.</p>}
            {open.map((o) => (
              <button key={o.id} className={'acct' + (cur && o.id === cur.id ? ' on' : '')} aria-pressed={cur && o.id === cur.id} onClick={() => pick(o.id)}>
                <span><b>{o.place}</b><small>Pedido #{o.id}</small></span>
                <span className="amt">{money(o.subtotal)}</span>
              </button>
            ))}
          </section>

          {cur && (
            <div className="pay-detail">
              <section className="card framed pay-panel" aria-label="Detalle de la cuenta">
                <h2 className="display big">{cur.place} · #{cur.id}</h2>
                <div className="pay-items">
                  {cur.items.map((it, k) => (
                    <div className="row" key={k}>
                      <span>{it.qty} × {it.name}</span>
                      <span className="muted">{money(it.qty * it.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="row muted"><span>Subtotal</span><span>{money(sub)}</span></div>
                <div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Propina voluntaria</p>
                  <div className="chips" role="group" aria-label="Propina" style={{ flexWrap: 'nowrap' }}>
                    {[0, 10, 15].map((p) => (
                      <button key={p} className="chip" style={{ flex: 1 }} aria-pressed={p === tip} onClick={() => { setTip(p); setRec('exact'); }}>{p}%</button>
                    ))}
                  </div>
                </div>
                <div className="row muted"><span>Propina</span><span>{money(tipAmt)}</span></div>
                <div className="total-row"><span>Total</span><span>{money(total)}</span></div>
              </section>

              <section className="card pay-panel" aria-label="Cobrar">
                <h2 className="sm">Método de pago</h2>
                <div className="methods" role="group" aria-label="Método de pago">
                  {METHODS.map(([k, label]) => (
                    <button key={k} className="chip" aria-pressed={k === method} onClick={() => setMethod(k)}>{label}</button>
                  ))}
                </div>
                {cash && (
                  <>
                    <p className="muted" style={{ fontSize: 13 }}>Efectivo recibido</p>
                    <div className="bills" role="group" aria-label="Efectivo recibido">
                      {BILLS.map((b) => (
                        <button key={b} className="chip" aria-pressed={b === rec} onClick={() => setRec(b)}>{b === 'exact' ? 'Exacto' : money(b)}</button>
                      ))}
                    </div>
                    <div className="change">
                      <span className="muted" style={{ fontSize: 14 }}>{diff < 0 ? 'Falta' : 'Cambio'}</span>
                      <span className={'v' + (diff < 0 ? ' short' : '')}>{money(Math.abs(diff))}</span>
                    </div>
                  </>
                )}
                <button className="btn lg block" style={{ marginTop: 'auto' }} disabled={cantPay} onClick={pay}>Cobrar {money(total)}</button>
              </section>
            </div>
          )}
        </div>
      </main>
    </PosLayout>
  );
}
