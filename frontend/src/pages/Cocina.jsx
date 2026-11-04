import { api, minutesSince, usePolling } from '../lib.js';
import { PosLayout, Title } from '../components/Bits.jsx';

const COLS = [
  { key: 'nuevo', title: 'Nuevos', btn: 'Iniciar preparación', next: 'preparando' },
  { key: 'preparando', title: 'En preparación', btn: 'Marcar listo', next: 'listo' },
  { key: 'listo', title: 'Listos', btn: 'Entregado', next: 'entregado' }
];
const fetchActive = () => api.orders('?status=nuevo,preparando,listo');
const LATE_MIN = 12;

export default function Cocina() {
  const [orders, reload, error] = usePolling(fetchActive, 5000);
  const advance = (o, next) => api.setStatus(o.id, next).then(reload);

  return (
    <PosLayout>
      <main className="content">
        <Title>Cocina</Title>
        {error && <p className="notice err" role="alert">No se pudo actualizar: {error.message}</p>}
        <div className="kds">
          {COLS.map((col) => {
            const list = (orders || []).filter((o) => o.status === col.key);
            return (
              <section key={col.key} className="kds-col" aria-label={col.title}>
                <div className="kds-head">
                  <h2>{col.title}</h2>
                  <span className="count">{list.length}</span>
                </div>
                {list.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 14 }}>Sin pedidos</p>}
                {list.map((o) => {
                  const mins = minutesSince(o.created_at);
                  return (
                    <article key={o.id} className="card kt">
                      <div className={'kt-head ' + col.key}>
                        <div>
                          <span className="num">#{o.id}</span>
                          <span className="place">{o.place}</span>
                        </div>
                        <div className="right">
                          <span>{mins} min</span>
                          {mins >= LATE_MIN && col.key !== 'listo' && <span className="tag warn">Demora</span>}
                        </div>
                      </div>
                      <ul>
                        {o.items.map((it, k) => (
                          <li key={k}><b>{it.qty}×</b><span>{it.name}</span></li>
                        ))}
                      </ul>
                      <button className="btn ghost" onClick={() => advance(o, col.next)}>{col.btn}</button>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      </main>
    </PosLayout>
  );
}
