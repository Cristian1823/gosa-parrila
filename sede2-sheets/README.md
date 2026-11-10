# GOSA sede 2 — Sistema con Google Sheets (fase 1)

Réplica del sistema de la sede 1 con la carta y los precios de la sede 2: **menú digital, toma de pedidos, cocina, Para pago, ventas y cierre de caja**. Es un sitio estático (HTML/CSS/JS) y los datos viven en una hoja de Google que funciona como backend mediante Google Apps Script.

Es la solución provisional mientras el local no tiene el computador del POS. Cuando lo tenga, el sistema local (`backend/` + `frontend/` del repositorio) lo reemplaza.

Quedan fuera de esta versión: inventario con recetas y tarjeta de sellos de clientes.

## Qué hay en esta carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | Menú digital público (generado desde la carta) |
| `pedidos.html`, `cocina.html`, `domicilio.html` (Para pago), `ventas.html`, `cierre.html` | Pantallas del sistema |
| `google-apps-script.js` | Código del backend: se pega en Google Apps Script |
| `hoja-google/*.csv` | Opcionales: copia de la hoja Productos y los encabezados de Pedidos, por si se prefiere importarlos a mano. El script ya crea las pestañas solo |
| `config.js` | URL del backend y PIN (**no se sube a git**; se crea desde `config.example.js`) |
| `menu-data.js` | Catálogo de respaldo (generado) |

## Puesta en marcha (una sola vez)

1. **Crear la hoja.** En Google Drive: *Nuevo → Hojas de cálculo*. Nómbrala, por ejemplo, "GOSA Local - Datos".
2. **Pegar el backend.** En la hoja: *Extensiones → Apps Script*. Borra el código que aparece, pega todo el contenido de `google-apps-script.js` y guarda.
3. **Crear las pestañas.** En el editor de Apps Script elige la función **`configurarHojas`** en el menú desplegable de arriba y pulsa **Ejecutar**. Google pedirá autorizar permisos (la primera vez). El script crea solo:
   - **`Pedidos`**, con sus encabezados.
   - **`Productos`**, con la carta completa y sus precios (costos vacíos).
   - **`Sueldos`**, con sus encabezados.
   - Además elimina la "Hoja 1" vacía que trae Google. Si alguna pestaña ya existe, no la toca. Aunque se olvide este paso, el sistema las crea solo al recibir la primera petición.
4. **Publicarlo.** *Implementar → Nueva implementación → Aplicación web*. Configura *Ejecutar como*: **Yo** y *Quién tiene acceso*: **Cualquier persona**. Acepta los permisos y **copia la URL** (termina en `/exec`).
   - Si luego se modifica el código, usar *Implementar → Administrar implementaciones → Editar* para conservar la misma URL.
5. **Configurar el sitio.** Copia `config.example.js` como `config.js` y completa:
   - `API_URL`: la URL del paso 4.
   - `PIN_CIERRE` y `PIN_ELIMINAR`: PIN de 4 dígitos nuevos, definidos por el cliente. Vacío = esa función queda bloqueada.
6. **Probar.** Abre `index.html` con Live Server (o `python -m http.server` dentro de esta carpeta) y recorre: crear un pedido en `pedidos.html`, verlo en `cocina.html`, cobrarlo en `domicilio.html` y revisar `ventas.html`.
7. **Publicar el sitio** en Cloudflare Pages: ver la sección siguiente. No se sube `config.js` a mano: se genera en cada despliegue.

## Despliegue en Cloudflare Pages

Se crean **dos proyectos de Pages desde el mismo repositorio de GitHub**: uno para el menú público (el del QR) y otro para el sistema interno. Así el sistema, la URL del backend y los PIN no quedan en la dirección pública del menú. `build.js` prepara cada sitio y genera su `config.js` con variables de Cloudflare, de modo que **nada se edita a mano** y cada `git push` a `main` publica solo.

En Cloudflare: *Workers & Pages → Create → Pages → Connect to Git* y elige el repositorio.

**Proyecto 1: menú público** (nombre sugerido `gosa-menu`)

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Root directory | `sede2-sheets` |
| Build command | `node build.js menu` |
| Build output directory | `dist/menu` |

Sin variables obligatorias. Opcional: `MENU_API_URL` (la URL del Apps Script) para que el menú tome los precios de la hoja de Google; esa URL quedaría visible en el sitio público, por eso viene apagada y el menú usa los precios del HTML.

**Proyecto 2: sistema interno** (nombre sugerido `gosa-pos`)

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Root directory | `sede2-sheets` |
| Build command | `node build.js pos` |
| Build output directory | `dist/pos` |

Variables (*Settings → Variables and Secrets*, tipo Texto o Secreto, en *Production*):

| Variable | Valor |
|---|---|
| `API_URL` | **Obligatoria.** La URL del Apps Script (termina en `/exec`). Sin ella el despliegue falla a propósito |
| `PIN_CIERRE` | 4 dígitos. Vacía = el cierre queda bloqueado |
| `PIN_ELIMINAR` | 4 dígitos. Vacía = no se pueden eliminar pedidos |
| `MENU_URL` | Opcional. La dirección del proyecto 1 (por ejemplo `https://gosa-menu.pages.dev`) para el botón "Menu" |

Al cambiar una variable hay que **volver a desplegar** (*Deployments → Retry deployment*), porque `config.js` se genera durante la construcción.

**Proteger el sistema interno (muy recomendable).** El sitio `gosa-pos` no pide usuario: cualquiera con la dirección puede abrirlo, y `config.js` incluye la URL del backend y los PIN. Se le puede poner una puerta gratuita: *Zero Trust → Access → Applications → Add an application → Self-hosted*, con el dominio de `gosa-pos` y una política *Allow* con los correos autorizados (el equipo del local). Mientras tanto, no compartas esa dirección. El sitio ya sale con `noindex` y sin caché, y su raíz abre Pedidos.

**Probar la construcción en el computador** (opcional):

```powershell
cd sede2-sheets
$env:API_URL = "https://script.google.com/macros/s/XXXX/exec"; $env:PIN_CIERRE = "1234"; $env:PIN_ELIMINAR = "5678"
node build.js          # genera dist/menu y dist/pos (dist/ no se sube a git)
```

Para trabajar en local sigue sirviendo Live Server sobre esta carpeta con su propio `config.js`.

## Costos y ganancias (para el cierre de caja)

El cierre calcula la ganancia con las columnas `Costo`, `GastoOperativo` y `Sueldos` de la pestaña `Productos` (`Sueldos` = mano de obra por unidad vendida). Una celda vacía cuenta como 0.

Los costos iniciales salen de la hoja de la sede 1 (`tools/costos_sede1.csv`) y se cruzaron **por categoría y nombre** (los IDs y precios de esa tabla no se usan). Quedó con costo 45 de los 57 productos. **Sin costo, para llenar a mano:** Bucaro, Salchi Bucara, los 8 Platos a la carta (incluidos Chuleta Gosa y Gosa Black Ribs), Chimichurri y Queso Doble Crema.

### Rellenar los costos en una hoja que ya existe

Si la pestaña `Productos` ya se creó (con los costos vacíos), no hace falta rehacerla:
1. En Apps Script, reemplaza todo el código por el contenido actual de `google-apps-script.js` y guarda.
2. Elige la función **`completarCostos`** y pulsa **Ejecutar**. El resultado queda en *Registro de ejecución* y dice cuántos productos completó y cuáles siguen sin costo.
3. Es seguro repetirlo: **solo llena celdas vacías, nunca pisa un valor ya escrito**, y no toca productos que agregaste a mano.
4. (Recomendado, para que el sitio use el mismo código) *Implementar → Administrar implementaciones → Editar → Versión: Nueva versión → Implementar*. La URL no cambia.

### Agregar a la hoja los productos nuevos de la carta

Cuando la carta suma productos (por ejemplo *Chuleta Gosa* y *Gosa Black Ribs*) y la pestaña `Productos` ya existe:
1. Pega el `google-apps-script.js` actualizado en Apps Script y guarda.
2. Ejecuta la función **`agregarProductosNuevos`**. Agrega **al final** de la hoja los productos que todavía no están, con costos vacíos (se llenan a mano).
3. No modifica ni borra filas existentes, ni duplica un producto que ya exista con ese nombre, y se puede repetir sin riesgo. Opcional: *Implementar → Administrar implementaciones → Editar → Nueva versión*.
4. Un `git push` a `main` actualiza el menú público solo; el sistema interno toma los productos de la hoja.

### Datos para revisar con el cliente

Se copiaron tal cual venían; estos se ven raros: Coca Cola 1.5 L, Coca Cola 0 1.5 L, Corona y Coronita tienen costo **0** (la ganancia saldría igual a la venta), y Quatro 1.5 L tiene costo **1.166** para un precio de $8.500 (en la sede 1 ese dato estaba junto a un precio de $2.500). Los costos de las hamburguesas, perros y demás se cruzaron con su equivalente de la sede 1, pero los precios de la sede 2 son más altos, así que la ganancia por producto será distinta a la de allá.

## Cambiar precios o productos

- **Rápido (recomendado en el día a día):** editar `PrecioVenta` en la pestaña `Productos`. El menú público se actualiza solo. En la pantalla de pedidos, los precios se guardan 24 horas en el navegador: el botón 🔄 fuerza la actualización.
- **Producto nuevo:** agregar una fila en `Productos` con un ID único y una `Categoria` de esta lista: `entradas, perros, hamburguesas, salchipapas, platos, adicionales, bebidas`. Para que aparezca también en el menú público hay que regenerarlo (abajo).
- **Cambio permanente de la carta:** editar `backend/menu_seed.py` y regenerar con
  `backend\.venv\Scripts\python.exe tools\generar_sede2.py`
  (reescribe `index.html`, `menu-data.js` y los CSV). Después volver a subir el sitio y actualizar la hoja `Productos`.

## Límites conocidos

- Los PIN están en `config.js`, que es visible para quien abra el sitio. Frenan el uso casual, no a una persona con conocimientos técnicos.
- La URL del backend no pide autenticación: quien la tenga puede leer y modificar pedidos. No la publiques ni la compartas.
- El número de WhatsApp, el horario y la dirección del local no están definidos: se completan en `tools/generar_sede2.py` (constantes `WHATSAPP`, `HORARIO`, `DIRECCION`) y se regenera.
- El logo dice "GOSA FOOD TRUCK"; el cliente pidió cambiarlo y falta recibir el nuevo. Se reemplaza en `images/logo.jpeg` (ver CLAUDE.md, sección Logo).
