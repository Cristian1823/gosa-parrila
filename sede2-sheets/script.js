// ========== GOSA - Menú digital (sede 2) ==========

document.addEventListener('DOMContentLoaded', function () {

    // ========== Acordeón: una categoría abierta a la vez ==========
    const items = document.querySelectorAll('.accordion-item');
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function () {
            const item = this.closest('.accordion-item');
            const estabaActivo = item.classList.contains('active');
            items.forEach(i => i.classList.remove('active'));
            if (!estabaActivo) item.classList.add('active');
        });
    });

    // ========== Precios desde Google Sheets ==========
    // Si la hoja Productos cambia un precio, el menú lo refleja sin tocar el HTML.
    // Si no hay API configurada o falla la carga, queda el precio escrito en el HTML.
    const API_URL = (window.GOSA_CONFIG && window.GOSA_CONFIG.API_URL) || '';
    if (!API_URL) return;

    const normalizar = (nombre) => nombre.toUpperCase()
        .replace(/[ÁÀÂÄ]/g, 'A').replace(/[ÉÈÊË]/g, 'E')
        .replace(/[ÍÌÎÏ]/g, 'I').replace(/[ÓÒÔÖ]/g, 'O')
        .replace(/[ÚÙÛÜ]/g, 'U').replace(/Ñ/g, 'N')
        .trim();
    const formatear = (precio) => '$' + Number(precio).toLocaleString('es-CO');

    const cb = 'menuPreciosCallback_' + Date.now();
    const script = document.createElement('script');
    const limpiar = () => { delete window[cb]; if (script.parentNode) script.parentNode.removeChild(script); };

    window[cb] = function (data) {
        limpiar();
        if (!data || !data.productos || data.error) return;
        const precios = {};
        data.productos.forEach(p => { precios[normalizar(p.nombre)] = p.precio; });

        // [elemento con el nombre, selector del precio dentro de su contenedor, contenedor]
        [['.card-header h3', '.price', el => el.parentElement],
         ['.double-name', '.double-price', el => el.parentElement],
         ['.extra-name', '.extra-price', el => el.parentElement]].forEach(([selNombre, selPrecio, cont]) => {
            document.querySelectorAll(selNombre).forEach(nombreEl => {
                const precio = precios[normalizar(nombreEl.textContent)];
                const precioEl = cont(nombreEl).querySelector(selPrecio);
                if (precio !== undefined && precioEl) precioEl.textContent = formatear(precio);
            });
        });
    };

    script.src = API_URL + '?action=getProductos&callback=' + cb;
    script.onerror = limpiar;
    setTimeout(() => { if (window[cb]) limpiar(); }, 10000);
    document.body.appendChild(script);
});
