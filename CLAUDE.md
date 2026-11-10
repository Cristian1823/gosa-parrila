# GOSA Local — Menú digital + POS de comandas (sede 2)

Sistema para la **segunda sede de GOSA**: deja de ser food truck y pasa a ser un **local**. Debe sentirse como una **extensión tipo franquicia** de la sede 1: misma identidad visual (paleta, tipografías, logo, estilo de tarjetas y etiquetas) y la misma carta, que se irá ajustando.

**Repositorio:** https://github.com/Cristian1823/gosa-parrila (rama `main`, **público**). `sede2-sheets/config.js` (URL del Apps Script y PIN) está en `.gitignore` y no se sube; al clonar hay que crearlo desde `config.example.js`.

## Qué incluye

1. **Menú digital** (`/`) — público, de **solo lectura** (el cliente no pide desde aquí; pide al mesero). Se publicará en **Cloudflare Pages** y se llegará por QR.
2. **Carta imprimible** (`/carta`) — documento aparte para imprimir (Carta/Letter), mismos estilos, sin interacción. Lee la misma base de datos.
3. **POS local** (`/pos/*`) — toma de pedidos (mesero), cocina y pagos. Corre **solo en la red local** del restaurante.
4. **Comandas** (pendiente) — impresión del pedido en cocina con impresora térmica ESC/POS y apertura de cajón al cobrar en efectivo.

**Dos sistemas conviven por fases:**
- **Fase 1 (ahora): `sede2-sheets/`** — copia del sistema de la sede 1 (menú, pedidos, cocina, Para pago, ventas, cierre) con la carta y precios de la sede 2 y **Google Sheets + Apps Script como backend**. Es lo que pidió el cliente porque aún no tiene el computador del POS. Ver `sede2-sheets/README.md`.
- **Fase 2 (después): POS local** — `backend/` (FastAPI + SQLite) + `frontend/` (React), con comandas. Es el sistema descrito en el resto de este archivo; el menú React (`/`) y la carta imprimible (`/carta`) ya existen ahí.

## Decisiones tomadas (no re-discutir sin motivo)

- **Fase 2 — backend gratuito y local:** FastAPI + SQLite en un PC del local. Los celulares de meseros se conectan por Wi-Fi/router al IP del PC (ej. `http://192.168.x.x:8000/pos/pedidos`). Recomendado: router en el local, PC por cable, IP fija por reserva DHCP, puerto 8000 abierto en el firewall de Windows, red Wi-Fi del POS separada de la de clientes. (La zona Wi-Fi móvil de Windows sirve solo como plan B.)
- **Tiempo real:** hoy cocina y caja consultan cada 5 s (`usePolling`). **Pendiente** cambiar a WebSockets.
- **Menú público en Cloudflare Pages:** sitio estático que lee un `menu.json` generado desde la base de datos con un paso "Publicar menú" (único paso que requiere internet). **Pendiente** de construir. Así la base de datos del local nunca queda expuesta.
- **Sin factura por ahora.** El cliente quiere **comandas** (ticket de cocina), no facturación DIAN. Si luego facturan, se conecta un proveedor tecnológico (Alegra, Siigo, Factus, Matías…) sobre el mismo flujo de cobro. Un ticket de comanda **no** es factura.
- **Google Sheets:** la fase 1 SÍ lo usa (decisión del cliente por no tener aún el PC); el POS local de la fase 2 no (Sheets es lento, sin autenticación y con cuotas). Posible migración futura a Postgres (Supabase) si quieren reportes unificados de ambas sedes; el código usa SQL plano.

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
sede2-sheets/      FASE 1: sistema estático + Google Sheets (pedidos, cocina, cierre...). Ver su README.md
  build.js         prepara dist/menu y dist/pos para Cloudflare Pages; genera config.js desde variables de entorno
tools/generar_sede2.py   genera desde backend/menu_seed.py: menu-data.js, index.html y los CSV de sede2-sheets/
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
- **La carta vive en `backend/menu_seed.py`.** Categorías actuales (orden de la sede 1, **sin Ahumados** por decisión del cliente): Entradas, Perros, Hamburguesas, Salchipapas, **Platos a la carta**, Adicionales, Bebidas. Los precios vigentes son los del PDF del cliente `precios gosa para carta.pdf` (nov 2026, no versionado); lo que no aparece en ese PDF se retiró (Totopos, Tender, 360 Hamburguer, Mozzarella, Salchicha simple).
- **Ojo con el seed:** `init_db()` reemplaza toda la carta solo cuando `PRAGMA user_version < 6`. Editar `menu_seed.py` **no** cambia una base ya creada: hay que subir ese número en `main.py` (reseed destructivo de `menu_items`; los pedidos guardan nombre y precio, no FK, así que no se pierden) o editar la tabla. **Pendiente:** panel de administración para editar la carta sin tocar código.
- Precios de Bebidas: salen del respaldo del sistema de pedidos de la sede 1 (`sistema.js`), no de la hoja real; verificar con el cliente. En el menú público Bebidas se muestra como **imagen** (como en la sede 1); los 12 productos existen para el POS y la carta impresa los lista.

### Precios vigentes (nov 2026)

- Base: PDF del cliente. Luego el cliente pidió **+$1.000 a todos los productos excepto las hamburguesas** (ya aumentadas antes): se aplicó a Entradas, Perros, Salchipapas, Platos a la carta, Adicionales y **Bebidas** (la nota del combo $6.500/$8.000/$7.500 **no** se tocó; la burbuja de salchicha americana quedó en $5.000 = precio del adicional). Hamburguesas: +$1.000 en sencilla, doble y triple.
- `user_version` actual: **8**. Los dos últimos Platos (`Chuleta Gosa` $27.000 y `Gosa Black Ribs` $29.000, IDs `pl7` y `pl8`) se agregaron con el precio que dio el cliente, sin el +$1.000, y van **al final** de la categoría para no mover los IDs existentes (los IDs son por orden dentro de la categoría: insertar a la mitad rompe la correspondencia con la hoja de Google).

### Sistema en Google Sheets (fase 1)

- Es la sede 1 portada: `sede2-sheets/` copia pedidos/cocina/domicilio(Para pago)/ventas/cierre + `google-apps-script.js`. Se **quitó** inventario y sellos de clientes; `IDS_AHUMADOS = []` y el selector TOTAL/GOSA/AHUMADOS del cierre queda oculto (una sola línea).
- El catálogo y el menú público se **generan** (`tools/generar_sede2.py`); el sistema de pedidos toma precios de la hoja `Productos` (la hoja manda sobre `menu-data.js`). El **nombre** del producto en la hoja debe coincidir con el de los pedidos (el cierre cruza por nombre) y la `Categoria` debe ser una clave de `MENU`: `entradas, perros, hamburguesas, salchipapas, platos, adicionales, bebidas`.
- **Costos:** `tools/costos_sede1.csv` es la hoja Productos de la sede 1 tal como la envió el cliente; `tools/generar_sede2.py` la cruza por (categoría, nombre) —con alias para 4 bebidas escritas distinto— y escribe Costo/GastoOperativo/Sueldos en `CATALOGO_INICIAL` y en `hoja-google/Productos.csv`. Solo se toman esos 3 campos (precios, IDs y Activo de la sede 1 se ignoran). `completarCostos()` del Apps Script rellena una hoja ya creada **solo en celdas vacías**. **Ojo:** esos costos son datos comerciales y están dentro de `google-apps-script.js`, de `hoja-google/Productos.csv` y de `tools/costos_sede1.csv`. El repositorio es **público** y el cliente lo subió sabiéndolo (nov 2026), así que esos costos son visibles en GitHub y en el historial. Quitarlos después exige reescribir el historial y aun así pudieron copiarse.
- **Productos nuevos en una hoja existente:** `agregarProductosNuevos()` (a mano) agrega al final los de `CATALOGO_INICIAL` cuyo ID no esté en la hoja, sin tocar filas existentes ni duplicar por nombre. Tras agregar productos a `menu_seed.py`: subir `user_version`, correr `tools/generar_sede2.py`, `git push` (Cloudflare redespliega el menú) y ejecutar esa función en Apps Script.
- **Las hojas las crea el Apps Script:** `configurarHojas()` (se ejecuta a mano una vez) y `asegurarHojas()` (se llama al inicio de cada `doGet`) crean `Pedidos`, `Productos` (con la carta, costos vacíos) y `Sueldos` con sus encabezados si faltan, y borran la "Hoja 1" vacía. No sobrescriben hojas existentes. El catálogo inicial es el bloque `<GENERADO:CATALOGO>` del script, que reescribe `tools/generar_sede2.py` (no editarlo a mano). Probado con un `SpreadsheetApp` simulado (17 comprobaciones), **no** contra Google real.
- **Despliegue (Cloudflare Pages, desde GitHub):** dos proyectos del mismo repo con Root directory `sede2-sheets`. Menú: `node build.js menu` -> `dist/menu`. Sistema: `node build.js pos` -> `dist/pos`, con variables `API_URL` (obligatoria; el build falla sin ella), `PIN_CIERRE`, `PIN_ELIMINAR`, `MENU_URL`. `build.js` genera `config.js` (que no está en git) desde esas variables y deja fuera el script con costos, los CSV y el README. El menú público NO lleva la URL del backend salvo que se defina `MENU_API_URL`. Cambiar una variable exige redesplegar. Probado con construcciones locales (casos de error, árbol de salida y 70 referencias sin romper); **no** desplegado todavía en Cloudflare.
- **PIN y URL en `sede2-sheets/config.js`** (git-ignorado; plantilla `config.example.js`). Los PIN de la sede 1 NO se copiaron: el cliente define los nuevos; vacío = función bloqueada.
- Verificado con un servidor de prueba que imita el Apps Script (no está en el repo): pedidos, cocina, Para pago, ventas, menú público y el candado del cierre (PIN malo rechazado, PIN bueno abre). **No** se ha probado contra Google real ni el cálculo completo del cierre (depende del Apps Script desplegado y de los costos).
- Tras cambiar la carta: `backend\.venv\Scripts\python.exe tools\generar_sede2.py`, resubir el sitio y actualizar la hoja `Productos`.

### Cómo actualizar la carta (flujo probado)

1. Editar `backend/menu_seed.py` (nombre, descripción, precio, etiqueta, variantes).
2. Subir `PRAGMA user_version` en `backend/main.py` (el valor actual es **6**; el seed corre cuando es menor) y **reiniciar la API** (matar `python.exe` y `python3.11.exe`).
3. El menú digital (`/`) y la carta (`/carta`) leen `/api/menu`: no requieren más cambios. Para la fase 1 (Sheets) correr además `tools/generar_sede2.py`.
4. **Categoría nueva:** registrar su slug (ej. `platos-a-la-carta`) en tres sitios: `HEADER_BG` e `ICONS` en `Menu.jsx`, `BANDS` en `Carta.jsx`, y las clases `.header-<slug>` (`styles.css`) y `.band-<slug>` (`carta.css`) con su foto en `frontend/public/images/`. Sin eso la categoría sale con cabecera plana.
5. Regenerar los PDF de `carta impresa/` (Edge headless, ver Convenciones) y revisar que sigan en 3 páginas y que ninguna categoría se parta.

## Diseño (réplica de la sede 1)

Tokens en `:root` de `src/styles.css`, idénticos a la sede 1:
- Fondo `#000`, panel `#141414`, dorado `#FFD700` / `#FFC107`, texto `#fff`, gris claro `#E0E0E0`, bordes `#4B4B4B`, éxito `#28a745`, aviso/naranja `#ff6b35`.
- Tipografías: **Bebas Neue** (títulos, precios, botones) + **Inter** (texto).
- Logo circular con borde dorado y marca de agua al 5 % de fondo; tarjetas con barrido dorado al hover; etiquetas dorado inclinadas -2°; precios en pastilla gris; botones con gradiente dorado; chips en forma de pastilla.
- Menú digital: acordeón por categoría con foto de cabecera (90 px, velo oscuro 45 %) y mismos iconos Font Awesome. Perros lleva dos burbujas: "¡ADICIÓN! +$4.000 salchicha americana" y "¡HAZLO COMBO!" (bebida del día $6.500, Coca-Cola $8.000, Postobón $7.500). Platos a la carta usa como cabecera la foto de parrilla (`fondo-platos.jpeg`).
- Carta impresa: hoja Letter, dos columnas, `break-inside: avoid` por categoría (hoy 3 páginas: Entradas+Perros / Hamburguesas+Salchipapas+Platos a la carta / Adicionales+Bebidas). Requiere "Gráficos de fondo" activado al imprimir.

## Pendientes / hoja de ruta

0. **Fase 1 — esperando al cliente:** los **costos de los 12 productos nuevos** (Bucaro, Salchi Bucara, 8 Platos a la carta, Chimichurri, Queso Doble Crema; el resto ya tiene costo copiado de la sede 1), la revisión de costos dudosos (bebidas con costo 0, Quatro 1.5 L) y los **PIN nuevos** (cierre y eliminar; mientras `PIN_*` esté vacío en `config.js` esas funciones quedan bloqueadas). **Ya conectado:** el Apps Script nuevo está desplegado y `sede2-sheets/config.js` (git-ignorado, la URL no va en este archivo) apunta a él; se comprobó con lecturas reales que devuelve los 55 productos y que `Pedidos` y `Sueldos` existen y están vacías. **Falta:** probar un pedido completo de punta a punta (crear, cocina, cobrar, cierre) contra la hoja real, y **crear en Cloudflare los dos proyectos de Pages** (menú público `gosa-menu` y sistema interno `gosa-pos`) con la configuración y variables de `sede2-sheets/README.md` (sección Despliegue); proteger `gosa-pos` con Cloudflare Access. Pendiente definir WhatsApp/horario/dirección (constantes en `tools/generar_sede2.py`).
1. Panel de administración con login para editar carta y precios (+ exportar ventas a CSV/Excel).
2. **WebSockets** en cocina/caja (reemplazar sondeo de 5 s).
3. **Comandas:** impresión ESC/POS (`python-escpos`) en impresora térmica de cocina; opcional varias impresoras por zona; apertura de cajón al cobrar en efectivo. Preguntas abiertas: marca/modelo, USB o red, 58 u 80 mm, una o varias impresoras, si se mantiene el tablero en pantalla.
4. **Publicar menú** estático en Cloudflare Pages (`menu.json` + botón/comando "Publicar menú"); cuenta de Cloudflare pendiente.
5. **Login/PIN** para `/pos/*` y endpoints de cocina/pago (hoy abiertos; la red del POS debe ser interna).
6. Sin impuestos (impoconsumo 8 %) ni facturación electrónica por ahora.
7. Banner de promoción y carrusel de videos del menú de la sede 1: **no traídos** (la promo de noviembre es del truck). Ahumados excluidos.
8. Marcadores sin completar: `[HORARIO]` y `[DIRECCIÓN DEL LOCAL]` (pie de `Menu.jsx`), `[CAJERO]` (`Bits.jsx`); `INFO` en `Carta.jsx` (horario/dirección vacíos; redes copiadas de la sede 1: @gosa_ft, @gosa.food.truck — confirmar si el local tiene cuentas propias). Título del menú: solo "GOSA" (ya no es truck); confirmar nombre del local.
9. **Confirmar con el cliente** (valores del PDF dudosos, ya aplicados con una suposición): Queso cheddar adicional `300` → se puso 3.000; Chicharrón adicional `400` → 4.000; nombres `Bucaro` (entrada) vs `Salchi Bucara`; `Gosa Gacuho` (¿Gaucho?); alcance de la nota del combo (se aplicó solo a Perros: el PDF dice "los dos cris"); precios de Bebidas (el PDF no las trae); si Totopos, Tender y 360 Hamburguer salen definitivamente.
10. **Logo (pendiente de recibir):** el actual dice "GOSA FOOD TRUCK" y el cliente pidió cambiarlo; se deja el actual hasta que llegue el nuevo. **Dónde se cambia:** `frontend/public/logo.jpg` (menú React, carta imprimible, POS local y favicon) y `sede2-sheets/images/logo.jpeg` (menú estático, páginas del sistema, marca de agua de `style.css`, favicon; `build.js` lo copia por nombre). Si el nuevo logo cambia de nombre o formato (p. ej. PNG) hay que actualizar esas referencias: `grep -rn "logo\.jp" frontend sede2-sheets tools build.js`. Después regenerar los PDF de `carta impresa/`.
11. **Guardar el avance:** hay cambios sin commit (carta nueva del PDF del cliente, categoría Platos a la carta, perros con "salchicha americana", hamburguesas +$1.000, PDFs regenerados). Hacer commit cuando el usuario lo pida. Tip: si un PDF de `carta impresa/` está abierto en un visor, Windows no deja sobrescribirlo; pedir que lo cierren.
12. Actualizar `README.md` (menciona `?mesa=N` y la carta de ejemplo original).

## Sede 1 — carpeta `gosa food truck/` (solo referencia)

Sitio estático HTML/CSS/JS + Google Sheets/Apps Script (menú, pedidos, cocina, cobro, cierre, inventario, sellos). Fuente de verdad de la **carta pública**: su `index.html` (el `CLAUDE.md` de esa carpeta tiene algunos precios desactualizados). Sirve para copiar estilos, productos e imágenes.
- **No versionar ni copiar su `CLAUDE.md`**: contiene PINs y datos sensibles. No reutilizar esos PINs.
- Tiene videos grandes (`videos/`) e imágenes de promociones propias del truck.

## Trampas conocidas

- Guardar `styles.css` desde PowerShell con `Set-Content -Encoding UTF8` añade **BOM** y rompe el `@import` de fuentes → los estilos "desaparecen". Usar `[IO.File]::WriteAllText(..., UTF8Encoding($false))` o las herramientas de edición.
- Al reiniciar la API, una pestaña abierta puede mostrar datos viejos o "Internal Server Error": recargar con Ctrl+F5.
- **Vite repite el último error de compilación** aunque ya se haya corregido: aparece como capa roja en navegadores nuevos y **queda impresa en los PDF/capturas** (se vio como texto "JSXParser..." al pie de cada página). Si pasa, reiniciar Vite (matar el proceso del puerto 5173 y volver a correr `npm run dev`) antes de generar PDF. Comprobar siempre que `/src/pages/*.jsx` respondan 200.
- Dos elementos JSX hermanos dentro de `cond && (...)` fallan: envolverlos en un fragmento `<>...</>`.
- El proceso uvicorn en Windows se ve como `python.exe` del venv + `python3.11.exe`; para reiniciar hay que matar ambos.

## Convenciones

- Español en UI, textos y comentarios. Precios en COP con puntos de miles (`money()` en `lib.js`).
- Tap targets ≥ 44 px, `aria-*` en controles, sin dependencias nuevas sin necesidad.
- Para revisar páginas de un PDF sin visor: instalar `pypdf` **fuera del proyecto** (`PIP_USER=0; pip install --no-user --target <carpeta temporal> pypdf`) y listar primera/última línea de cada página; el texto de títulos con letra espaciada sale con espacios (`E N T R A D A S`), normalizar antes de comparar.
- Antes de afirmar que algo se ve bien, abrirlo en el navegador; generar PDF con Edge headless (`--print-to-pdf`) para probar la carta impresa.
