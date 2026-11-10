# GOSA Parrilla — Menú digital y sistema de pedidos (sede 2)

Sistema para la **segunda sede de GOSA**: deja de ser food truck y pasa a ser un **local** ("GOSA Parrilla"). Debe sentirse como una **extensión tipo franquicia** de la sede 1: misma identidad visual (paleta, tipografías, estilo de tarjetas y etiquetas), carta parecida pero con precios y productos propios.

**Repositorio:** https://github.com/Cristian1823/gosa-parrila (rama `main`, **público**). Cada `git push` a `main` redespliega los sitios en Cloudflare. `sede2-sheets/config.js` (URL del Apps Script y PIN) está en `.gitignore` y no se sube; al clonar hay que crearlo desde `config.example.js`.

## Estado actual (nov 2026)

Dos sistemas conviven por fases:

- **Fase 1 — EN PRODUCCIÓN: `sede2-sheets/`.** Copia del sistema de la sede 1 (menú, pedidos, cocina, Para pago, ventas, cierre) con la carta de la sede 2 y **Google Sheets + Apps Script como backend**. Es lo que pidió el cliente porque aún no tiene el computador del POS. Ver `sede2-sheets/README.md`.
- **Fase 2 — futura: POS local.** `backend/` (FastAPI + SQLite) + `frontend/` (React), con comandas impresas. Hoy de ahí **se usan** el menú digital React (`/`) y la carta imprimible (`/carta`); el POS React (`/pos/*`) existe pero no se usa todavía.

| Sitio | Dirección | Qué es |
|---|---|---|
| Menú público (QR) | https://gosa-parrila.pages.dev | Proyecto de Cloudflare Pages `gosa-parrila`: `node build.js menu` → `dist/menu` |
| Sistema interno (meseros) | https://gosa-pos.pages.dev | Proyecto `gosa-pos`: `node build.js pos` → `dist/pos`. La raíz abre Pedidos. **Sin Cloudflare Access todavía**: cualquiera con la dirección puede entrar |

Ambos con Root directory `sede2-sheets`. Verificado en vivo: el menú publica las 7 categorías y el sistema carga los 57 productos desde la hoja de Google.

## Decisiones tomadas (no re-discutir sin motivo)

- **Google Sheets en la fase 1** (decisión del cliente por no tener aún el PC). El POS local de la fase 2 no lo usa (Sheets es lento, sin autenticación y con cuotas). Posible migración futura a Postgres (Supabase) para reportes de ambas sedes; el código de la fase 2 usa SQL plano.
- **Fase 2 — backend gratuito y local:** FastAPI + SQLite en un PC del local; los celulares se conectan por Wi-Fi al IP del PC (`http://192.168.x.x:8000/pos/pedidos`). Recomendado: router en el local, PC por cable, IP fija por reserva DHCP, puerto 8000 abierto en el firewall, red del POS separada de la de clientes. Tiempo real: hoy sondeo cada 5 s (`usePolling`); **pendiente** WebSockets.
- **Dos sitios separados** (menú público / sistema interno) para que el menú del QR no lleve la URL del backend ni los PIN. El menú usa los precios escritos en su HTML (se regeneran con `tools/generar_sede2.py`); solo toma precios de la hoja si se define `MENU_API_URL`.
- **Sin factura por ahora.** El cliente quiere **comandas** (ticket de cocina), no facturación DIAN. Si luego facturan, se conecta un proveedor tecnológico (Alegra, Siigo, Factus, Matías…). Un ticket de comanda **no** es factura.
- **Sin Ahumados** (decisión del cliente). Sin inventario ni sellos de clientes en la fase 1.

## Stack

- Fase 2: React 18 + Vite 5 + react-router-dom 6 (JS/JSX, sin TypeScript); FastAPI + SQLite + pydantic 2. Font Awesome 6 por CDN.
- Fase 1: HTML/CSS/JS estático (sin build, salvo `build.js` para desplegar) + Google Apps Script.
- Desarrollo: Windows 11, Python 3.11 (venv en `backend/.venv`), Node 22. Herramientas puntuales fuera del proyecto: `pypdf`, `segno`, `opencv-python-headless`, Pillow.

## Estructura

```
backend/
  main.py          API, esquema SQLite, migración/seed (PRAGMA user_version)
  menu_seed.py     CARTA: única fuente de productos, precios, etiquetas y variantes
frontend/          React (fase 2)
  public/logo.jpg  logo horizontal "GOSA PARRILLA" (recortado); favicon.png = la "G"
  public/images/   fondos de categoría, bebidas.jpeg, promocion.jpeg (banner del mes)
  src/lib.js       api, money, usePolling, slug, groupMenu
  src/styles.css   tokens de marca + POS + menú digital
  src/pages/       Menu.jsx (menú digital), Carta.jsx + carta.css (carta imprimible), Pedidos/Cocina/Pagos.jsx (POS)
sede2-sheets/      FASE 1 (producción). README.md con el paso a paso
  index.html, menu-data.js, hoja-google/*.csv    GENERADOS por tools/generar_sede2.py (no editar a mano)
  pedidos|cocina|domicilio|ventas|cierre.html, sistema.js, sistema.css   sistema interno
  google-apps-script.js    backend; el bloque <GENERADO:CATALOGO> lo reescribe el generador
  build.js         prepara dist/menu y dist/pos para Cloudflare; genera config.js desde variables de entorno
  config.example.js  plantilla (config.js real: git-ignorado)
tools/
  generar_sede2.py     genera lo de arriba desde backend/menu_seed.py + costos
  costos_sede1.csv     hoja Productos de la sede 1 tal como la envió el cliente (fuente de costos)
  generar_qr.py        QR del menú y cartel
assets/            logo-gosa-parrilla-original.jpeg (original entregado por el cliente, 1536x1024)
qr-menu/           QR (png, svg) y cartel A5 (html, pdf, png) hacia https://gosa-parrila.pages.dev
carta impresa/     PDFs de la carta (fondo negro / blanco)
gosa food truck/   SEDE 1 — SOLO REFERENCIA (ver abajo). No se versiona
README.md          viene del paquete base gosa-pos; parcialmente desactualizado
```

## Cómo correrlo (desarrollo)

**Fase 1 (sistema en Google Sheets):** Live Server sobre `sede2-sheets` (`.vscode/settings.json`, local y no versionado, fija `liveServer.settings.root` en `/sede2-sheets`): `http://127.0.0.1:5501/pedidos.html`. Necesita su `config.js` local; lo que se haga queda guardado en la hoja real.

**Fase 2 (React + API):**

```powershell
cd backend;  .\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
cd frontend; npm run dev        # http://localhost:5173  (proxy /api -> :8000)
```

- Abrir **siempre** por Vite (5173). **Live Server no sirve** para el React: no compila JSX y sale en blanco.
- Instalación inicial: `python -m venv .venv` + `pip install -r requirements.txt` en `backend`; `npm install` en `frontend`.
- Rutas React: `/` menú digital · `/carta` carta imprimible (`?tema=claro|oscuro`) · `/pos/pedidos`, `/pos/cocina`, `/pos/pagos`. API: `GET /api/menu`, `POST/GET /api/orders`, `PATCH /api/orders/{id}/status`, `POST /api/orders/{id}/pay`; los precios los toma siempre el servidor.

## Datos y carta

- **Fuente única: `backend/menu_seed.py`.** Categorías (orden de la sede 1): Entradas, Perros, Hamburguesas, Salchipapas, Platos a la carta, Adicionales, Bebidas. 57 productos. Las variantes (Doble, Triple) son productos propios enlazados por `parent_id`; `badge` es la etiqueta inclinada (PREMIUM, POPULAR, ESPECIAL, LA REINA, NUEVO…).
- **Precios (nov 2026):** base = PDF del cliente `precios gosa para carta.pdf` (no versionado); lo que no estaba se retiró (Totopos, Tender, 360 Hamburguer, Mozzarella, Salchicha simple). Luego **+$1.000 a todo menos hamburguesas** (que ya se habían subido; en sencilla, doble y triple), incluidas las Bebidas; la nota del combo ($6.500 / $8.000 / $7.500) no se tocó. `Chuleta Gosa` ($27.000) y `Gosa Black Ribs` ($29.000) se agregaron con el precio dado, sin el +$1.000.
- **Los IDs son por orden dentro de la categoría** (`e1…`, `pl1…`, variantes con sufijo `d`/`t`) y son la llave con la hoja de Google: **los productos nuevos van siempre al final de su categoría**; insertar a la mitad corre los IDs y rompe la correspondencia.
- **Ojo con el seed de la fase 2:** `init_db()` reemplaza la carta solo cuando `PRAGMA user_version` es menor al número del código (**hoy 8**). Editar `menu_seed.py` no cambia una base ya creada: hay que subir ese número (reseed destructivo de `menu_items`; los pedidos guardan nombre y precio, no FK).
- Bebidas: precios del respaldo de la sede 1 (+$1.000); en el menú público se muestra como **imagen**, los 12 productos existen para el sistema y la carta impresa.

### Cómo actualizar la carta (flujo probado)

1. Editar `backend/menu_seed.py` (nuevos al final de su categoría).
2. Subir `user_version` en `backend/main.py` y reiniciar la API (matar `python.exe` **y** `python3.11.exe`).
3. `backend\.venv\Scripts\python.exe tools\generar_sede2.py` (regenera menú estático, catálogo y CSV; avisa qué productos quedan sin costo).
4. Regenerar los PDF de `carta impresa/` (Edge headless sobre `/carta`) y comprobar que siguen en **3 páginas** y que ninguna categoría se parte.
5. `git push` → Cloudflare redespliega el menú público y el sistema.
6. En Apps Script: pegar el `google-apps-script.js` nuevo y ejecutar **`agregarProductosNuevos`** (los precios de productos existentes se cambian directo en la hoja `Productos`).
7. **Categoría nueva:** registrar su slug en `HEADER_BG` e `ICONS` (`Menu.jsx`), `BANDS` (`Carta.jsx`), `CATS` (`tools/generar_sede2.py`) y las clases `.header-<slug>` / `.band-<slug>` con su foto; en el estático, `.accordion-header-<slug>` en `sede2-sheets/style.css`.

## Sistema en Google Sheets (fase 1)

- **Qué se quitó de la sede 1:** inventario y sellos. `IDS_AHUMADOS = []` y el selector TOTAL/GOSA/AHUMADOS del cierre queda oculto (una sola línea).
- **La hoja manda:** el sistema toma precios de la pestaña `Productos` (sobre `menu-data.js`). El **nombre** del producto debe coincidir con el de los pedidos (el cierre cruza por nombre) y `Categoria` debe ser clave de `MENU`: `entradas, perros, hamburguesas, salchipapas, platos, adicionales, bebidas`.
- **Apps Script** (se despliega a mano desde el editor; la URL de la implementación no cambia si se usa *Editar → Nueva versión*). Funciones que se ejecutan a mano desde el editor: `configurarHojas()` (crea `Pedidos`, `Productos` con carta y costos, `Sueldos`; `asegurarHojas()` lo hace solo en cada petición), `completarCostos()` (rellena Costo/Gasto/Sueldos **solo en celdas vacías**) y `agregarProductosNuevos()` (agrega al final los productos del catálogo que falten, sin tocar ni duplicar por nombre). Probado con un `SpreadsheetApp` simulado (36 comprobaciones) y con lecturas reales (57 productos, `Pedidos` y `Sueldos` presentes); **falta** probar un pedido completo contra la hoja real y el cálculo del cierre.
- **Costos:** `tools/costos_sede1.csv` se cruza por (categoría, nombre) —con alias para 4 bebidas escritas distinto— y escribe Costo/GastoOperativo/Sueldos en `CATALOGO_INICIAL` y en `hoja-google/Productos.csv`. 45 de 57 productos tienen costo; **sin costo:** Bucaro, Salchi Bucara, los 8 Platos a la carta, Chimichurri y Queso Doble Crema.
- **Despliegue:** `build.js` genera `config.js` desde variables de entorno de Cloudflare y deja fuera el script con costos, los CSV y el README. Proyecto `gosa-pos`: `API_URL` (obligatoria; el build **falla** sin ella o si es inválida), `PIN_CIERRE`, `PIN_ELIMINAR` (4 dígitos; vacío = función bloqueada), `MENU_URL`. Cambiar una variable exige *Retry deployment*. El sitio interno sale con `noindex`, sin caché, y `/` redirige a `/pedidos.html`.
- **QR:** `qr-menu/` (ver `tools/generar_qr.py`; `pip install segno`; el PDF del cartel sale de imprimir `cartel.html` con Edge). Verificado con OpenCV. **El QR guarda la dirección**: si el menú cambia de dirección (p. ej. dominio propio) hay que regenerarlo y reimprimir.
- **Seguridad (límites conocidos):** los PIN viven en `config.js` y son visibles en el sitio estático; la URL del Apps Script no pide autenticación (quien la tenga puede leer y modificar pedidos); la toma de pedidos no pide PIN. Los costos son datos comerciales y están dentro de `google-apps-script.js`, `Productos.csv` y `tools/costos_sede1.csv`: **el repositorio es público** y el cliente lo subió sabiéndolo, así que son visibles en GitHub y en el historial.

## Diseño (réplica de la sede 1)

- Tokens en `:root` de `src/styles.css`, idénticos a la sede 1: fondo `#000`, panel `#141414`, dorado `#FFD700` / `#FFC107`, texto `#fff`, gris `#E0E0E0`, bordes `#4B4B4B`, éxito `#28a745`, aviso `#ff6b35`. Tipografías **Bebas Neue** (títulos, precios, botones) + **Inter**.
- **Logo** horizontal "GOSA PARRILLA" (dorado sobre negro), sin marco circular ni título "GOSA" en texto (el logo ya lo dice) y marca de agua al 5 %. Para cambiarlo: reemplazar `frontend/public/logo.jpg` y `sede2-sheets/images/logo.jpeg` (mismos nombres, proporción similar o ajustar `.logo`, `.c-logo`, `header img`, `.sistema-header .logo`, `.logo-pin`), más `favicon.png`; regenerar PDFs y QR-cartel.
- Menú: acordeón por categoría con foto de cabecera (90 px, velo 45 %), tarjetas con barrido dorado, etiquetas inclinadas -2°, precios en pastilla gris. Perros lleva la burbuja "¡HAZLO COMBO!"; la de "¡ADICIÓN! salchicha americana" se **retiró** (pedido del cliente). Platos a la carta usa la foto de parrilla.
- **Banner "PROMOCIÓN DEL MES"** entre el encabezado y el menú (imagen `promocion.jpeg` en `frontend/public/images/` y `sede2-sheets/images/`; no está en la carta imprimible). Hoy es la promo de **noviembre de la sede 1**, cuyo arte dice "GOSA Food Truck"; cambia cada mes: reemplazar esos dos archivos y hacer push.
- **Carta impresa:** hoja Letter, 2 columnas, `break-inside: avoid` por categoría; 3 páginas (Entradas+Perros / Hamburguesas+Salchipapas+Platos / Adicionales+Bebidas). Requiere "Gráficos de fondo" al imprimir.

## Pendientes / hoja de ruta

**Fase 1 — antes de dar el sistema a los meseros**
1. **Cambiar los PIN:** los del `config.js` local son los mismos de la sede 1, que están en su repositorio público; si se usaron igual en las variables de `gosa-pos`, cambiarlos allá también (y en el `config.js` local) y redesplegar.
2. **Proteger `gosa-pos` con Cloudflare Access** (Zero Trust → Access → Applications → Self-hosted, política *Allow* con los correos del equipo). Opcional: PIN de meseros para entrar a Pedidos.
3. **Probar un pedido completo** (crear → cocina → Para pago → ventas → cierre) contra la hoja real y borrar los de prueba.
4. **Costos:** de los 12 productos sin costo y revisar los dudosos (Coca Cola 1.5 L, 0 1.5 L, Corona y Coronita con costo 0; Quatro 1.5 L con 1.166).
5. Confirmar con el cliente valores del PDF aplicados con una suposición: Queso cheddar adicional `300` → 3.000; Chicharrón `400` → 4.000; nombres `Bucaro` vs `Salchi Bucara`; `Gosa Gacuho` (¿Gaucho?); si la nota del combo aplica solo a Perros; precios de Bebidas.
6. Datos del local sin definir: horario, dirección, WhatsApp (constantes `HORARIO`, `DIRECCION`, `WHATSAPP` en `tools/generar_sede2.py`; `INFO` en `Carta.jsx` y `[HORARIO]`/`[DIRECCIÓN DEL LOCAL]` en `Menu.jsx`); redes copiadas de la sede 1 (@gosa_ft, @gosa.food.truck): confirmar si el local tiene propias. `[CAJERO]` en `Bits.jsx`.
7. Actualizar el banner de promoción cada mes (y su arte, que dice "Food Truck").

**Fase 2 — POS local**
8. Panel de administración con login para editar carta y precios (+ exportar ventas a CSV/Excel).
9. **WebSockets** en cocina/caja.
10. **Comandas:** impresión ESC/POS (`python-escpos`) en impresora térmica; opcional varias por zona; apertura de cajón al cobrar en efectivo. Preguntas abiertas: marca/modelo, USB o red, 58 u 80 mm, una o varias, si se mantiene el tablero en pantalla.
11. Login/PIN para `/pos/*` y endpoints de cocina/pago (hoy abiertos; la red del POS debe ser interna). Impoconsumo 8 % y facturación electrónica: fuera de alcance por ahora.
12. Actualizar `README.md` (menciona `?mesa=N` y la carta de ejemplo original).

## Sede 1 — carpeta `gosa food truck/` (solo referencia)

Sitio estático + Google Sheets/Apps Script (menú, pedidos, cocina, cobro, cierre, inventario, sellos). Fuente de la **carta pública** original: su `index.html` (su `CLAUDE.md` tiene precios desactualizados). Sirve para copiar estilos, productos e imágenes.
- **No versionar ni copiar su `CLAUDE.md`**: contiene PINs y datos sensibles.
- Tiene videos grandes (`videos/`) e imágenes de promociones propias del truck; el carrusel de videos no se trajo.

## Trampas conocidas

- **El cliente deja archivos sueltos en la raíz del proyecto** (el logo nuevo, PDFs). Antes de `git add -A`, mirar `git status`: una vez se subió a un repositorio público un `logo.jpeg` sin haberlo abierto. "Deje la imagen" suele significar "ya está en la carpeta".
- Guardar CSS desde PowerShell con `Set-Content -Encoding UTF8` añade **BOM** y rompe el `@import` de fuentes. Usar `[IO.File]::WriteAllText(..., UTF8Encoding($false))` o las herramientas de edición.
- En scripts Python lanzados desde la terminal, **no escribir `\n`/`\r\n` literales dentro de cadenas** (se convierten en saltos reales y rompen el archivo): usar `chr(10)`/`chr(13)` o editar con las herramientas de edición. Los archivos copiados de la sede 1 son CRLF: respetar el fin de línea al reescribirlos.
- **Vite repite el último error de compilación** aunque ya esté corregido y queda impreso en PDFs/capturas ("JSXParser…"). Reiniciar Vite antes de generar PDF y comprobar que `/src/pages/*.jsx` den 200.
- Al reiniciar la API, una pestaña abierta puede mostrar datos viejos o "Internal Server Error": Ctrl+F5. El proceso uvicorn se ve como `python.exe` del venv + `python3.11.exe`; matar ambos.
- Dos elementos JSX hermanos dentro de `cond && (...)` fallan: usar un fragmento.
- **Cloudflare Pages:** en el menú (tiene `index.html`) las rutas inexistentes devuelven 200 con el menú, y los archivos borrados pueden seguir saliendo unos minutos por caché de borde: verificar el contenido o usar `?x=<timestamp>`, no solo el código HTTP. Un push tarda 1–2 minutos en verse.
- Un PDF de `carta impresa/` abierto en un visor impide sobrescribirlo (Windows): pedir que lo cierren.

## Convenciones

- Español en UI, textos y comentarios. Precios en COP con puntos de miles (`money()` en `lib.js`).
- **Nunca escribir los PIN ni la URL del Apps Script** en respuestas, commits ni documentos del repositorio.
- Tap targets ≥ 44 px, `aria-*` en controles, sin dependencias nuevas sin necesidad.
- Verificar visualmente antes de afirmar que algo se ve bien (capturas con Edge headless: `--screenshot`, `--print-to-pdf`). Para revisar PDFs sin visor: `pypdf` instalado **fuera del proyecto** (`PIP_USER=0; pip install --no-user --target <carpeta> pypdf`); el texto de títulos con letra espaciada sale con espacios, normalizar antes de comparar.
- Sistema en Apps Script: probar con un `SpreadsheetApp` simulado en Node antes de pedir al cliente que lo pegue; sus funciones manuales deben ser idempotentes y no pisar datos.
