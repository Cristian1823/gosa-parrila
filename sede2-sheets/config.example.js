// Configuración de la sede 2. Copia este archivo como config.js y completa los valores.
// config.js NO se sube a git (lo contiene .gitignore): tiene la URL del backend y los PIN.
//
// ADVERTENCIA: al ser un sitio estático, estos valores son visibles para quien abra el sitio.
// Los PIN frenan el uso casual, no a alguien con conocimientos técnicos. Ver sede2-sheets/README.md.
window.GOSA_CONFIG = {
    // URL de la implementación web de Apps Script (termina en /exec). Ver README, paso 4.
    API_URL: '',

    // PIN de 4 dígitos. Vacío = esa función queda BLOQUEADA hasta que se configure.
    PIN_CIERRE: '',     // entrar al cierre de caja
    PIN_ELIMINAR: '',   // eliminar un pedido desde cocina o Para Pago

    pinOk(tipo, pin) {
        const esperado = tipo === 'cierre' ? this.PIN_CIERRE : this.PIN_ELIMINAR;
        if (!esperado) console.warn('GOSA: falta configurar el PIN "' + tipo + '" en config.js');
        return !!esperado && String(pin) === String(esperado);
    }
};
