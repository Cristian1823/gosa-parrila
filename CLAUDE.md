# GOSA Local — Menú digital + POS de comandas (sede 2)

Sistema para la **segunda sede de GOSA**: deja de ser food truck y pasa a ser un **local**. Debe sentirse como una **extensión tipo franquicia** de la sede 1: misma identidad visual (paleta, tipografías, logo, estilo de tarjetas y etiquetas) y la misma carta, que se irá ajustando.

## Qué incluye

1. **Menú digital** (`/`) — público, de **solo lectura** (el cliente no pide desde aquí; pide al mesero). Se publicará en **Cloudflare Pages** y se llegará por QR.
2. **Carta imprimible** (`/carta`) — documento aparte para imprimir (Carta/Letter), mismos estilos, sin interacción. Lee la misma base de datos.
3. **POS local** (`/pos/*`) — toma de pedidos (mesero), cocina y pagos. Corre **solo en la red local** del restaurante.
4. **Comandas** (pendiente) — impresión del pedido en cocina con impresora térmica ESC/POS y apertura de cajón al cobrar en efectivo.

## Decisiones tomadas (no re-discutir sin motivo)

- **Backend gratuito y local:** FastAPI + SQLite en un PC del local. Los celulares de meseros se conectan por Wi-Fi/router al IP del PC (ej. `http://192.168.x.x:8000/pos/pedidos`). Recomendado: router en el local, PC por cable, IP fija por reserva DHCP, puerto 8000 abierto en el firewall de Windows, red Wi-Fi del POS separada de la de clientes. (La zona Wi-Fi móvil de Windows sirve solo como plan B.)
- **Tiempo real:** hoy cocina y caja consultan cada 5 s (`usePolling`). **Pendiente** cambiar a WebSockets.
- **Menú público en Cloudflare Pages:** sitio estático que lee un `menu.json` generado desde la base de datos con un paso "Publicar menú" (único paso que requiere internet). **Pendiente** de construir. Así la base de datos del local nunca queda expuesta.
- **Sin factura por ahora.** El cliente quiere **comandas** (ticket de cocina), no facturación DIAN. Si luego facturan, se conecta un proveedor tecnológico (Alegra, Siigo, Factus, Matías…) sobre el mismo flujo de cobro. Un ticket de comanda **no** es factura.
- **No usamos Google Sheets** (la sede 1 sí: lenta, sin autenticación, con cuotas). Posible migración futura a Postgres (Supabase) si quieren reportes unificados de ambas sedes; el código usa SQL plano.

## Stack

- Frontend: React 18 + Vite 5 + react-router-dom 6 (JS/JSX, sin TypeScript). CSS propio (`src/styles.css`, `src/pages/carta.css`). Font Awesome 6 por CDN (iconos del menú público).
- Backend: FastAPI + SQLite (`backend/gosa.db`, se crea sola) + pydantic 2. Un solo proceso sirve también `frontend/dist` si existe.
- Entorno de desarrollo: Windows 11, Python 3.11 (venv en `backend/.venv`), Node 22.

## Estructura

```
backend/
  main.py          API, esquema SQLite, migración/seed
  menu_seed.py     CARTA (fuente de datos de productos, precios, etiquetas, variantes)
  requirements.txt
frontend/
  public/logo.jpg  logo (circular, borde dorado)
  public/images/   fondos de categoría, bebidas.jpeg, vaca.jpeg
  src/main.jsx     rutas
  src/lib.js       api, money, usePolling, slug, groupMenu
  src/styles.css   tokens de marca + POS + menú digital
  src/components/Bits.jsx   Sidebar/PosLayout/Title/iconos
  src/pages/Menu.jsx        menú digital (acordeón, solo lectura)
  src/pages/Carta.jsx + carta.css   carta imprimible
  src/pages/Pedidos.jsx, Cocina.jsx, Pagos.jsx   POS
carta impresa/     PDFs de muestra (fondo negro / blanco), foto de la carta de ese día
gosa food truck/   SEDE 1 — SOLO REFERENCIA (ver abajo). No se versiona.
README.md          viene del paquete base gosa-pos; parcialmente desactualizado
```

## Cómo correrlo (desarrollo)

```powershell
# Terminal 1 — API
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
# Terminal 2 — Frontend
cd frontend
npm run dev        # http://localhost:5173  (proxy /api -> :8000)
```

- Abrir **siempre** por Vite (5173) o por la API con `npm run build` hecho (8000). **Live Server no funciona**: no compila JSX y la página sale en blanco.
- Instalación inicial: `python -m venv .venv`, `pip install -r requirements.txt` en `backend`; `npm install` en `frontend`.

## Rutas

| Ruta | Para | Función |
|---|---|---|
| `/` | Clientes (QR) | Menú digital solo lectura |
| `/carta` | Dueño/impresión | Carta imprimible. `?tema=claro` (blanco, ahorra tinta) / `?tema=oscuro` (marca) |
| `/pos/pedidos` | Mesero/caja | Toma de pedidos (mesa 1–8 o para llevar) |
| `/pos/cocina` | Cocina | Tablero Nuevos → Preparando → Listos |
| `/pos/pagos` | Caja | Cobro: propina, método (efectivo/tarjeta/nequi), cambio |

API: `GET /api/menu`, `POST /api/orders`, `GET /api/orders`, `PATCH /api/orders/{id}/status`, `POST /api/orders/{id}/pay`. Los precios los toma siempre el servidor desde `menu_items`.

## Datos y carta

- Tabla `menu_items(cat, name, description, price, active, sort, badge, parent_id)`.
  - `badge`: etiqueta inclinada (PREMIUM, POPULAR, NUEVO, ESPECIAL, LA REINA, MUNDIALISTA).
  - `parent_id`: las variantes (Doble, Triple) son **productos propios** enlazados a su plato base. En el menú público cuelgan de la tarjeta del plato; en el POS aparecen como productos normales.
- **La carta vive en `backend/menu_seed.py`.** Categorías actuales (orden de la sede 1, **sin Ahumados** por decisión del cliente): Entradas, Perros, Hamburguesas, Salchipapas, Adicionales, Bebidas.
- **Ojo con el seed:** `init_db()` reemplaza toda la carta solo cuando `PRAGMA user_version < 3`. Editar `menu_seed.py` **no** cambia una base ya creada: hay que subir ese número en `main.py` (reseed destructivo de `menu_items`; los pedidos guardan nombre y precio, no FK, así que no se pierden) o editar la tabla. **Pendiente:** panel de administración para editar la carta sin tocar código.
- Precios de Bebidas: salen del respaldo del sistema de pedidos de la sede 1 (`sistema.js`), no de la hoja real; verificar con el cliente. En el menú público Bebidas se muestra como **imagen** (como en la sede 1); los 12 productos existen para el POS y la carta impresa los lista.

## Diseño (réplica de la sede 1)

Tokens en `:root` de `src/styles.css`, idénticos a la sede 1:
- Fondo `#000`, panel `#141414`, dorado `#FFD700` / `#FFC107`, texto `#fff`, gris claro `#E0E0E0`, bordes `#4B4B4B`, éxito `#28a745`, aviso/naranja `#ff6b35`.
- Tipografías: **Bebas Neue** (títulos, precios, botones) + **Inter** (texto).
- Logo circular con borde dorado y marca de agua al 5 % de fondo; tarjetas con barrido dorado al hover; etiquetas dorado inclinadas -2°; precios en pastilla gris; botones con gradiente dorado; chips en forma de pastilla.
- Menú digital: acordeón por categoría con foto de cabecera (90 px, velo oscuro 45 %) y mismos iconos Font Awesome. Perros lleva la burbuja "¡ADICIÓN! +$2.500 salchicha americana Zenú".
- Carta impresa: hoja Letter, dos columnas, `break-inside: avoid` por categoría (hoy 3 páginas: Entradas+Perros / Hamburguesas+Salchipapas+Adicionales / Bebidas). Requiere "Gráficos de fondo" activado al imprimir.

## Pendientes / hoja de ruta

1. Panel de administración con login para editar carta y precios (+ exportar ventas a CSV/Excel).
2. **WebSockets** en cocina/caja (reemplazar sondeo de 5 s).
3. **Comandas:** impresión ESC/POS (`python-escpos`) en impresora térmica de cocina; opcional varias impresoras por zona; apertura de cajón al cobrar en efectivo. Preguntas abiertas: marca/modelo, USB o red, 58 u 80 mm, una o varias impresoras, si se mantiene el tablero en pantalla.
4. **Publicar menú** estático en Cloudflare Pages (`menu.json` + botón/comando "Publicar menú"); cuenta de Cloudflare pendiente.
5. **Login/PIN** para `/pos/*` y endpoints de cocina/pago (hoy abiertos; la red del POS debe ser interna).
6. Sin impuestos (impoconsumo 8 %) ni facturación electrónica por ahora.
7. Banner de promoción y carrusel de videos del menú de la sede 1: **no traídos** (la promo de noviembre es del truck). Ahumados excluidos.
8. Marcadores sin completar: `[HORARIO]` y `[DIRECCIÓN DEL LOCAL]` (pie de `Menu.jsx`), `[CAJERO]` (`Bits.jsx`); `INFO` en `Carta.jsx` (horario/dirección vacíos; redes copiadas de la sede 1: @gosa_ft, @gosa.food.truck — confirmar si el local tiene cuentas propias). Título del menú: solo "GOSA" (ya no es truck); confirmar nombre del local.
9. Actualizar `README.md` (menciona `?mesa=N` y la carta de ejemplo original).

## Sede 1 — carpeta `gosa food truck/` (solo referencia)

Sitio estático HTML/CSS/JS + Google Sheets/Apps Script (menú, pedidos, cocina, cobro, cierre, inventario, sellos). Fuente de verdad de la **carta pública**: su `index.html` (el `CLAUDE.md` de esa carpeta tiene algunos precios desactualizados). Sirve para copiar estilos, productos e imágenes.
- **No versionar ni copiar su `CLAUDE.md`**: contiene PINs y datos sensibles. No reutilizar esos PINs.
- Tiene videos grandes (`videos/`) e imágenes de promociones propias del truck.

## Trampas conocidas

- Guardar `styles.css` desde PowerShell con `Set-Content -Encoding UTF8` añade **BOM** y rompe el `@import` de fuentes → los estilos "desaparecen". Usar `[IO.File]::WriteAllText(..., UTF8Encoding($false))` o las herramientas de edición.
- Al reiniciar la API, una pestaña abierta puede mostrar datos viejos o "Internal Server Error": recargar con Ctrl+F5.
- El proceso uvicorn en Windows se ve como `python.exe` del venv + `python3.11.exe`; para reiniciar hay que matar ambos.

## Convenciones

- Español en UI, textos y comentarios. Precios en COP con puntos de miles (`money()` en `lib.js`).
- Tap targets ≥ 44 px, `aria-*` en controles, sin dependencias nuevas sin necesidad.
- Antes de afirmar que algo se ve bien, abrirlo en el navegador; generar PDF con Edge headless (`--print-to-pdf`) para probar la carta impresa.
