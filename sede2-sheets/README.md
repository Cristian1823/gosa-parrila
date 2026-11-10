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
7. **Publicar el sitio.** Sube esta carpeta a Cloudflare Pages (carga directa). No hace falta subir `hoja-google/`. El QR del menú apunta a la dirección de `index.html`.

## Costos y ganancias (para el cierre de caja)

El cierre calcula la ganancia con las columnas `Costo`, `GastoOperativo` y `Sueldos` de la pestaña `Productos` (`Sueldos` = mano de obra por unidad vendida). Una celda vacía cuenta como 0.

Los costos iniciales salen de la hoja de la sede 1 (`tools/costos_sede1.csv`) y se cruzaron **por categoría y nombre** (los IDs y precios de esa tabla no se usan). Quedó con costo 45 de los 55 productos. **Sin costo, para llenar a mano:** Bucaro, Salchi Bucara, los 6 Platos a la carta, Chimichurri y Queso Doble Crema.

### Rellenar los costos en una hoja que ya existe

Si la pestaña `Productos` ya se creó (con los costos vacíos), no hace falta rehacerla:
1. En Apps Script, reemplaza todo el código por el contenido actual de `google-apps-script.js` y guarda.
2. Elige la función **`completarCostos`** y pulsa **Ejecutar**. El resultado queda en *Registro de ejecución* y dice cuántos productos completó y cuáles siguen sin costo.
3. Es seguro repetirlo: **solo llena celdas vacías, nunca pisa un valor ya escrito**, y no toca productos que agregaste a mano.
4. (Recomendado, para que el sitio use el mismo código) *Implementar → Administrar implementaciones → Editar → Versión: Nueva versión → Implementar*. La URL no cambia.

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
- El logo dice "GOSA FOOD TRUCK"; falta definir si habrá uno propio del local.
