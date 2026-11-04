# GOSA Food Truck · Menú digital + POS

Frontend React (Vite) + API Python (FastAPI + SQLite).

```
gosa-pos/
├─ backend/    main.py (API) · requirements.txt · gosa.db (se crea sola)
└─ frontend/   src/styles.css (tokens + componentes) · src/pages/* · public/logo.jpg
```

## Rutas

| Ruta | Para quién | Qué hace |
|---|---|---|
| `/` y `/?mesa=4` | Clientes (QR) | Menú digital; envía el pedido a cocina |
| `/pos/pedidos` | Mesero / caja | Toma de pedidos |
| `/pos/cocina` | Cocina | Tablero Nuevos → En preparación → Listos (se actualiza cada 5 s) |
| `/pos/pagos` | Caja | Cobro con propina, método de pago y cambio |

Pon un código QR distinto por mesa apuntando a `https://tu-dominio/?mesa=N`.

## Desarrollo (2 terminales)

```bash
# 1) API
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2) Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173  (proxy /api → :8000)
```

## Producción (un solo proceso)

```bash
cd frontend && npm install && npm run build
cd ../backend && uvicorn main:app --host 0.0.0.0 --port 8000
```
La API sirve también `frontend/dist`, así que todo queda en `http://servidor:8000`.

## Tu carta real

Los productos y precios de `SEED_MENU` en `backend/main.py` son de ejemplo. Se cargan solo
la primera vez que se crea `gosa.db`. Para cambiarlos: edita la lista y borra `gosa.db`, o
edita la tabla `menu_items` (columnas `cat, name, description, price, active, sort`).

Sustituye los marcadores `[HORARIO]`, `[UBICACIÓN DEL TRUCK]`, `[WHATSAPP]`, `[INSTAGRAM]`
(en `src/pages/Menu.jsx`) y `[CAJERO]` (en `src/components/Bits.jsx`).

## API

| Método | Ruta | Cuerpo |
|---|---|---|
| GET | `/api/menu` | |
| POST | `/api/orders` | `{"place":"Mesa 4","items":[{"menu_id":1,"qty":2}]}` |
| GET | `/api/orders?status=nuevo,preparando,listo&paid=false` | |
| PATCH | `/api/orders/{id}/status` | `{"status":"preparando"}` (nuevo · preparando · listo · entregado) |
| POST | `/api/orders/{id}/pay` | `{"tip_pct":10,"method":"efectivo"}` (efectivo · tarjeta · nequi) |

Documentación interactiva en `/docs`. Los precios los toma siempre el servidor desde `menu_items`.

## Pendiente antes de operar en serio

- **Sin login:** las rutas `/pos/*` y los endpoints de cocina y pago están abiertos. Ponlos detrás de
  un usuario/PIN o una red interna antes de publicar el dominio.
- **Sin impuestos ni facturación electrónica:** el total es subtotal + propina voluntaria.
- **Actualización por sondeo cada 5 s** (simple y robusto); si luego quieres tiempo real, cambia a WebSockets.
