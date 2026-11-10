// ========== GOSA - Sistema de Pedidos (sede 2, backend Google Sheets) ==========

// ========== CONFIGURACIÓN ==========
// La URL del Apps Script se configura en config.js (ver sede2-sheets/README.md).
const API_URL = (window.GOSA_CONFIG && window.GOSA_CONFIG.API_URL) || '';

// El catálogo (MENU, CATEGORIAS_NOMBRES, CATEGORIAS_ICONOS) vive en menu-data.js (generado desde la carta).
// Cada página carga config.js y menu-data.js antes que este archivo.

// ========== FUNCIONES DE API ==========

// Verificar si la API está configurada
function apiConfigurada() {
    return API_URL && API_URL !== 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI';
}

// Contador para garantizar nombres únicos de callback aunque Date.now() colisione
let _cbCounter = 0;

// Función para hacer peticiones usando JSONP (evita CORS)
function apiRequest(params) {
    return new Promise((resolve, reject) => {
        // Crear nombre único para el callback (contador + timestamp)
        const callbackName = 'gosaCallback_' + Date.now() + '_' + (++_cbCounter);

        // Crear la función callback global
        window[callbackName] = function(data) {
            // Limpiar
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        // Agregar callback a los parámetros
        params.callback = callbackName;

        // Construir URL
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_URL}?${queryString}`;

        // Crear script
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Error de conexión'));
        };

        // Timeout de 60 segundos (Apps Script puede tardar con reportes y cálculos)
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('Timeout'));
            }
        }, 60000);

        document.body.appendChild(script);
    });
}

// Función para hacer peticiones GET
async function apiGet(action, params = {}) {
    if (!apiConfigurada()) {
        throw new Error('API no configurada');
    }

    try {
        return await apiRequest({ action, ...params });
    } catch (error) {
        console.error('Error en API GET:', error);
        throw error;
    }
}

// Función para hacer peticiones POST
async function apiPost(data) {
    if (!apiConfigurada()) {
        throw new Error('API no configurada');
    }

    try {
        return await apiRequest({ payload: JSON.stringify(data) });
    } catch (error) {
        console.error('Error en API POST:', error);
        throw error;
    }
}

// ========== FUNCIONES DE PEDIDOS ==========

// Crear nuevo pedido
async function crearPedido(items, total, notas = '') {
    return await apiPost({
        action: 'nuevoPedido',
        items: items,
        total: total,
        notas: notas
    });
}

// Obtener pedidos pendientes
async function getPedidosPendientes() {
    return await apiGet('getPendientes');
}

// Obtener pedidos de hoy
async function getPedidosHoy() {
    return await apiGet('getHoy');
}

// Obtener pedidos por fecha
async function getPedidosPorFecha(fecha) {
    return await apiGet('getPorFecha', { fecha });
}

// Obtener resumen del día
async function getResumenDia(fecha) {
    return await apiGet('getResumen', { fecha });
}

// Obtener resumen mensual (mes = 'YYYY-MM')
async function getResumenMes(mes) {
    return await apiGet('getResumenMes', { mes });
}

async function getResumenMesCompleto(mes) {
    return await apiGet('getResumenMesCompleto', { mes });
}

// ========== SUELDOS ==========
async function registrarSueldo(fecha, nombre, valor, nota, linea) {
    return await apiPost({ action: 'registrarSueldo', fecha, nombre, valor: Number(valor), nota: nota || '', linea: linea || 'gosa' });
}

async function eliminarSueldo(id) {
    return await apiPost({ action: 'eliminarSueldo', id });
}

async function getSueldosPorFecha(fecha) {
    return await apiGet('getSueldosFecha', { fecha });
}

async function getSueldosMes(mes) {
    return await apiGet('getSueldosMes', { mes });
}

async function getEmpleados() {
    return await apiGet('getEmpleados');
}

// Obtener catálogo de productos desde la hoja Productos de Sheets
async function getProductos() {
    return await apiGet('getProductos');
}

// Cache de productos en localStorage (TTL: 24 horas)
const CACHE_KEY_PRODUCTOS = 'gosa_productos_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function _aplicarProductosAlMenu(productos) {
    Object.keys(MENU).forEach(cat => { MENU[cat] = []; });
    const catMap = {};
    Object.keys(MENU).forEach(k => { catMap[k.toLowerCase()] = k; });
    productos.forEach(p => {
        const key = catMap[String(p.categoria).trim().toLowerCase()];
        if (key !== undefined) {
            MENU[key].push({ id: p.id, nombre: p.nombre, precio: p.precio });
        }
    });
}

// Cargar productos desde cache local o Sheets.
// forzar=true ignora el cache y siempre llama a Sheets.
// Retorna el array de productos (para construir COSTOS, etc.) o false si falla.
async function cargarProductos(forzar = false) {
    try {
        let productos = null;

        if (!forzar) {
            const cached = localStorage.getItem(CACHE_KEY_PRODUCTOS);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if ((Date.now() - timestamp) < CACHE_TTL_MS) {
                    productos = data;
                    const horas = Math.round((Date.now() - timestamp) / 3600000);
                    console.log(`✅ Precios desde cache local (hace ${horas}h)`);
                }
            }
        }

        if (!productos) {
            const result = await getProductos();
            if (result.error || !result.productos || result.productos.length === 0) return false;
            productos = result.productos;
            localStorage.setItem(CACHE_KEY_PRODUCTOS, JSON.stringify({
                timestamp: Date.now(),
                data: productos
            }));
            console.log('✅ Precios actualizados desde Google Sheets');
        }

        _aplicarProductosAlMenu(productos);
        return productos; // el caller puede usarlo para COSTOS u otros fines
    } catch (e) {
        console.warn('⚠️ Usando precios locales:', e.message);
        return false;
    }
}

// Actualizar estado de pedido
async function actualizarEstadoPedido(id, estado, metodoPago) {
    const data = {
        action: 'actualizarEstado',
        id: id,
        estado: estado
    };
    if (metodoPago) {
        data.metodoPago = metodoPago;
    }
    return await apiPost(data);
}

// Eliminar pedido (marca como cancelado)
async function eliminarPedido(id) {
    return await apiPost({ action: 'eliminarPedido', id: id });
}

// Actualizar items, total y notas de un pedido existente
async function actualizarPedido(id, items, total, notas) {
    const data = {
        action: 'actualizarPedido',
        id: id,
        items: items,
        total: total
    };
    if (notas !== undefined) {
        data.notas = notas;
    }
    return await apiPost(data);
}

// ========== FUNCIONES DE UTILIDAD ==========

// Formatear precio en pesos colombianos
function formatearPrecio(precio) {
    const valor = Number(precio) || 0;
    return '$' + valor.toLocaleString('es-CO');
}

// Formatear fecha
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Obtener fecha de hoy en formato YYYY-MM-DD (zona horaria Colombia)
function fechaHoy() {
    const hoy = new Date();
    // Usar zona horaria de Colombia para evitar desfase UTC después de las 7PM
    return hoy.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

// Mostrar mensaje
function mostrarMensaje(container, mensaje, tipo = 'info') {
    const div = document.createElement('div');
    div.className = `mensaje ${tipo}`;
    div.textContent = mensaje;

    container.insertBefore(div, container.firstChild);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        div.remove();
    }, 5000);
}

// Mostrar loading
function mostrarLoading(container) {
    container.innerHTML = '<div class="loading">Cargando</div>';
}

// Mostrar sin datos
function mostrarSinDatos(container, mensaje = 'No hay datos para mostrar') {
    container.innerHTML = `
        <div class="sin-datos">
            <i class="fas fa-inbox"></i>
            ${mensaje}
        </div>
    `;
}

// Mostrar aviso de configuración pendiente
function mostrarConfigPendiente(container) {
    container.innerHTML = `
        <div class="config-warning">
            <h2><i class="fas fa-exclamation-triangle"></i> Configuracion Pendiente</h2>
            <p>Para usar el sistema de pedidos, necesitas configurar Google Sheets:</p>
            <ol>
                <li>Abre el archivo <strong>google-apps-script.js</strong> en tu proyecto</li>
                <li>Sigue las instrucciones para crear la hoja de calculo</li>
                <li>Copia el codigo a Google Apps Script</li>
                <li>Despliega como aplicacion web y copia la URL</li>
                <li>Abre <strong>sistema.js</strong> y reemplaza <code>TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI</code> con tu URL</li>
                <li>Recarga esta pagina</li>
            </ol>
        </div>
    `;
}

// Vibrar dispositivo (para feedback táctil)
function vibrar(duracion = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duracion);
    }
}

// Reproducir sonido de notificación (campana suave)
function reproducirSonido(tipo = 'success') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const currentTime = audioContext.currentTime;

    // Frecuencias para cada tipo
    const frecuencias = {
        success: [523, 659],  // Do5 y Mi5 - acorde mayor suave
        nuevo: [440, 554]     // La4 y Do#5 - alerta suave
    };

    const freqs = frecuencias[tipo] || frecuencias.success;
    const duracion = tipo === 'nuevo' ? 0.4 : 0.3;

    freqs.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Tipo de onda suave (sine = campana)
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;

        // Envelope tipo campana: ataque rápido, decay suave
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duracion);

        // Pequeño delay para el segundo tono (efecto campana)
        const delay = index * 0.05;
        oscillator.start(currentTime + delay);
        oscillator.stop(currentTime + duracion + delay);
    });
}

// ========== ALMACENAMIENTO LOCAL (BACKUP) ==========

// Guardar pedido localmente (por si falla la conexión)
function guardarPedidoLocal(pedido) {
    const pedidosLocales = JSON.parse(localStorage.getItem('gosa_pedidos_pendientes') || '[]');
    pedidosLocales.push({
        ...pedido,
        timestamp: Date.now(),
        sincronizado: false
    });
    localStorage.setItem('gosa_pedidos_pendientes', JSON.stringify(pedidosLocales));
}

// Obtener pedidos locales no sincronizados
function getPedidosLocalesNoSincronizados() {
    const pedidosLocales = JSON.parse(localStorage.getItem('gosa_pedidos_pendientes') || '[]');
    return pedidosLocales.filter(p => !p.sincronizado);
}

// Marcar pedido local como sincronizado
function marcarPedidoLocalSincronizado(timestamp) {
    const pedidosLocales = JSON.parse(localStorage.getItem('gosa_pedidos_pendientes') || '[]');
    const index = pedidosLocales.findIndex(p => p.timestamp === timestamp);
    if (index !== -1) {
        pedidosLocales[index].sincronizado = true;
        localStorage.setItem('gosa_pedidos_pendientes', JSON.stringify(pedidosLocales));
    }
}

// Sincronizar pedidos locales con el servidor
async function sincronizarPedidosLocales() {
    const pendientes = getPedidosLocalesNoSincronizados();

    for (const pedido of pendientes) {
        try {
            await crearPedido(pedido.items, pedido.total, pedido.notas);
            marcarPedidoLocalSincronizado(pedido.timestamp);
            console.log('Pedido sincronizado:', pedido.timestamp);
        } catch (error) {
            console.error('Error sincronizando pedido:', error);
        }
    }
}

// ========== EXPORTAR FUNCIONES ==========
// (Para uso en las páginas HTML)

window.GOSA = {
    // Configuración
    API_URL,
    MENU,
    CATEGORIAS_NOMBRES,
    CATEGORIAS_ICONOS,
    apiConfigurada,

    // API
    apiGet,
    apiPost,
    crearPedido,
    getPedidosPendientes,
    getPedidosHoy,
    getPedidosPorFecha,
    getResumenDia,
    getResumenMes,
    getResumenMesCompleto,
    getProductos,
    registrarSueldo,
    eliminarSueldo,
    getSueldosPorFecha,
    getSueldosMes,
    getEmpleados,
    cargarProductos,
    actualizarEstadoPedido,
    actualizarPedido,

    // Utilidades
    formatearPrecio,
    formatearFecha,
    fechaHoy,
    mostrarMensaje,
    mostrarLoading,
    mostrarSinDatos,
    mostrarConfigPendiente,
    vibrar,
    reproducirSonido,

    // Local storage
    guardarPedidoLocal,
    getPedidosLocalesNoSincronizados,
    sincronizarPedidosLocales
};

console.log('%c🍔 GOSA Sistema de Pedidos', 'color: #FFD700; font-size: 16px; font-weight: bold;');
console.log('%cVersion 1.0.0', 'color: #E0E0E0; font-size: 12px;');
