#!/usr/bin/env node
/*
 * Prepara los sitios de GOSA sede 2 para Cloudflare Pages. No necesita dependencias, solo Node 16.7+.
 *
 *   node build.js menu   ->  dist/menu   menú público (el del QR)
 *   node build.js pos    ->  dist/pos    sistema interno (pedidos, cocina, Para pago, ventas, cierre)
 *   node build.js        ->  los dos
 *
 * config.js NO está en git: se genera aquí a partir de variables de entorno (en Cloudflare: Settings > Variables).
 *
 *   Sitio "pos":   API_URL (obligatoria)  URL del Apps Script, termina en /exec
 *                  PIN_CIERRE, PIN_ELIMINAR  4 dígitos; vacías = esa función queda bloqueada
 *                  MENU_URL (opcional)    dirección del menú público, para el botón "Menu"
 *   Sitio "menu":  MENU_API_URL (opcional)  si se define, el menú toma los precios de la hoja de Google;
 *                  sin ella usa los precios escritos en index.html. Ojo: esa URL queda visible en el sitio público.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const env = process.env;

const falla = (msg) => { console.error('ERROR: ' + msg); process.exit(1); };
const aviso = (msg) => console.warn('AVISO: ' + msg);

const RE_API = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
const RE_PIN = /^\d{4}$/;

function limpiar(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copiar(rel, destino) {
  const origen = path.join(ROOT, rel);
  if (!fs.existsSync(origen)) falla('Falta el archivo ' + rel);
  fs.cpSync(origen, path.join(destino, rel), { recursive: true });
}

function escribir(destino, nombre, texto) {
  fs.writeFileSync(path.join(destino, nombre), texto);
}

/** config.js a partir de config.example.js, rellenando solo los valores indicados. */
function configJs(valores) {
  let t = fs.readFileSync(path.join(ROOT, 'config.example.js'), 'utf8');
  for (const [clave, valor] of Object.entries(valores)) {
    const re = new RegExp('(\\b' + clave + ": )''");
    if (!re.test(t)) falla('config.example.js no tiene el campo ' + clave);
    const literal = "'" + String(valor).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    t = t.replace(re, (_, antes) => antes + literal);
  }
  return '// Generado por build.js en el despliegue. No editar: se regenera en cada construcción.\n' + t;
}

// ---------- Menú público ----------
function construirMenu() {
  const dir = path.join(DIST, 'menu');
  limpiar(dir);
  ['index.html', 'style.css', 'script.js', 'images'].forEach((f) => copiar(f, dir));

  const api = (env.MENU_API_URL || '').trim();
  if (api && !RE_API.test(api)) falla('MENU_API_URL no parece una URL de Apps Script (https://script.google.com/macros/s/.../exec)');
  escribir(dir, 'config.js', configJs({ API_URL: api }));
  escribir(dir, '_headers', '/config.js\n  Cache-Control: no-store\n');
  console.log('menu -> ' + dir + (api ? '  (precios desde la hoja de Google)' : '  (precios del HTML)'));
}

// ---------- Sistema interno ----------
const PAGINAS_POS = ['pedidos.html', 'cocina.html', 'domicilio.html', 'ventas.html', 'cierre.html'];

function construirPos() {
  const api = (env.API_URL || '').trim();
  if (!api) falla('Falta la variable API_URL (URL del Apps Script). Sin ella el sistema no puede guardar pedidos.');
  if (!RE_API.test(api)) falla('API_URL no parece una URL de Apps Script (https://script.google.com/macros/s/.../exec)');

  const pins = { PIN_CIERRE: (env.PIN_CIERRE || '').trim(), PIN_ELIMINAR: (env.PIN_ELIMINAR || '').trim() };
  for (const [nombre, valor] of Object.entries(pins)) {
    if (!valor) aviso(nombre + ' está vacío: esa función quedará BLOQUEADA hasta que se defina.');
    else if (!RE_PIN.test(valor)) falla(nombre + ' debe tener exactamente 4 dígitos.');
  }

  const menuUrl = (env.MENU_URL || '').trim();
  if (menuUrl && !/^https:\/\/[^\s"'<>]+$/.test(menuUrl)) falla('MENU_URL debe ser una dirección https válida.');

  const dir = path.join(DIST, 'pos');
  limpiar(dir);
  [...PAGINAS_POS, 'sistema.css', 'sistema.js', 'menu-data.js'].forEach((f) => copiar(f, dir));
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'images', 'logo.jpeg'), path.join(dir, 'images', 'logo.jpeg'));

  // El botón "Menu" de la barra apunta al menú público; si no hay MENU_URL se quita (aquí no existe index.html).
  for (const pagina of PAGINAS_POS) {
    const ruta = path.join(dir, pagina);
    const lineas = fs.readFileSync(ruta, 'utf8').split('\n');
    const resultado = [];
    let tocadas = 0;
    for (const ln of lineas) {
      if (ln.includes('href="index.html"')) {
        tocadas++;
        if (menuUrl) resultado.push(ln.replace('href="index.html"', 'href="' + menuUrl + '" target="_blank" rel="noopener"'));
      } else {
        resultado.push(ln);
      }
    }
    if (tocadas !== 1) falla(pagina + ': se esperaba 1 enlace a index.html y hay ' + tocadas);
    fs.writeFileSync(ruta, resultado.join('\n'));
  }

  escribir(dir, 'config.js', configJs({ API_URL: api, ...pins }));
  // Sitio privado: sin buscadores, sin caché (para que los cambios lleguen al instante) y la raíz abre Pedidos
  escribir(dir, '_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
  escribir(dir, 'robots.txt', 'User-agent: *\nDisallow: /\n');
  escribir(dir, '_redirects', '/ /pedidos.html 302\n');
  console.log('pos  -> ' + dir + (menuUrl ? '  (botón Menu -> ' + menuUrl + ')' : '  (sin botón Menu)'));
}

const objetivo = process.argv[2] || 'all';
if (!['menu', 'pos', 'all'].includes(objetivo)) falla('Uso: node build.js [menu|pos|all]');
if (objetivo === 'all') fs.rmSync(DIST, { recursive: true, force: true });
if (objetivo === 'menu' || objetivo === 'all') construirMenu();
if (objetivo === 'pos' || objetivo === 'all') construirPos();
