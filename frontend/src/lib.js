import { useCallback, useEffect, useState } from 'react';

export const money = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const json = async (r) => {
  if (!r.ok) {
    let msg = r.statusText;
    try { msg = (await r.json()).detail || msg; } catch { /* sin cuerpo */ }
    throw new Error(typeof msg === 'string' ? msg : 'Error en la solicitud');
  }
  return r.json();
};
const send = (method, url, body) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

export const api = {
  menu: () => fetch('/api/menu').then(json),
  orders: (query = '') => fetch('/api/orders' + query).then(json),
  createOrder: (body) => send('POST', '/api/orders', body),
  setStatus: (id, status) => send('PATCH', `/api/orders/${id}/status`, { status }),
  pay: (id, body) => send('POST', `/api/orders/${id}/pay`, body)
};

/** Carga `fn` al montar y la repite cada `ms` (cocina y caja se actualizan solas). */
export function usePolling(fn, ms = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(
    () => fn().then((d) => { setData(d); setError(null); }).catch(setError),
    [fn]
  );
  useEffect(() => {
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, [load, ms]);
  return [data, load, error];
}

export const minutesSince = (iso) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60000));

export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

/** Agrupa el menú por categoría; las variantes (doble, triple) cuelgan de su plato base vía parent_id. */
export function groupMenu(items) {
  const variants = new Map();
  items.filter((i) => i.parent_id).forEach((i) => variants.set(i.parent_id, [...(variants.get(i.parent_id) || []), i]));
  const map = new Map();
  items.filter((i) => !i.parent_id).forEach((i) =>
    map.set(i.cat, [...(map.get(i.cat) || []), { ...i, variants: variants.get(i.id) || [] }]));
  return [...map].map(([title, list]) => ({ title, id: slug(title), list }));
}