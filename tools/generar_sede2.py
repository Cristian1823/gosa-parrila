"""Genera, a partir de backend/menu_seed.py, las piezas de la carta para el sistema en Google Sheets (sede2-sheets/).

Salidas (se sobrescriben cada vez):
  sede2-sheets/menu-data.js            catálogo de respaldo del sistema de pedidos (MENU, categorías, iconos)
  sede2-sheets/index.html              menú público (estático, listo para Cloudflare Pages)
  sede2-sheets/hoja-google/Productos.csv   hoja "Productos" para importar a Google Sheets
  sede2-sheets/hoja-google/Pedidos.csv     encabezados de la hoja "Pedidos"
  sede2-sheets/google-apps-script.js   solo el bloque CATALOGO_INICIAL (productos con los que el script crea la hoja Productos)

Uso (desde la raíz del proyecto):  backend\\.venv\\Scripts\\python.exe tools\\generar_sede2.py
Los precios se editan en backend/menu_seed.py. Los costos (Costo, GastoOperativo, Sueldos) salen de tools/costos_sede1.csv,
cruzando por categoría y nombre; los productos sin dato quedan en blanco para llenarlos en la hoja Productos de Google.
"""
import csv
import html
import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "sede2-sheets"
sys.path.insert(0, str(ROOT / "backend"))
from menu_seed import SEED_MENU  # noqa: E402

# Datos de contacto del local (vacío = no se muestra). WhatsApp en formato 573001234567.
HORARIO = ""
DIRECCION = ""
WHATSAPP = ""

# Categoría de la carta -> (clave del sistema, prefijo de ID, icono Font Awesome, clase de cabecera)
CATS = {
    "Entradas": ("entradas", "e", "fa-fire", "entradas"),
    "Perros": ("perros", "p", "fa-hotdog", "perros"),
    "Hamburguesas": ("hamburguesas", "h", "fa-burger", "hamburguesas"),
    "Salchipapas": ("salchipapas", "s", "fa-drumstick-bite", "salchipapas"),
    "Platos a la carta": ("platos", "pl", "fa-utensils", "platos"),
    "Adicionales": ("adicionales", "a", "fa-plus", "adicionales"),
    "Bebidas": ("bebidas", "be", "fa-bottle-water", "bebidas"),
}


# Costos de la sede 1 (hoja Productos tal como la envió el cliente). Solo se usan Costo, GastoOperativo y Sueldos;
# los precios y los IDs de esa tabla NO se usan (los de la sede 2 son otros).
COSTOS_CSV = ROOT / "tools" / "costos_sede1.csv"
# Nombres que en la tabla de la sede 1 están escritos distinto: (categoría, nombre sede 2) -> (categoría, nombre sede 1)
ALIAS = {
    ("bebidas", "coca cola 1.5 l"): ("bebidas", "coca cola 1.5 ml"),
    ("bebidas", "coca cola 0 1.5 l"): ("bebidas", "coca cola 0 1.5 ml"),
    ("bebidas", "quatro 1.5 l"): ("bebidas", "quattro 1.5 ml"),
    ("bebidas", "jugo hit 500 ml"): ("bebidas", "juego hit 500"),
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.strip().lower())
    return " ".join("".join(ch for ch in s if unicodedata.category(ch) != "Mn").split())


def cargar_costos():
    tabla = {}
    with COSTOS_CSV.open(encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            tabla.setdefault((norm(r["Categoria"]), norm(r["Nombre"])), r)
    return tabla


def _num(v):
    v = (v or "").strip()
    return int(v) if v else ""


def costos_de(clave, nombre, tabla):
    """(Costo, GastoOperativo, Sueldos) del producto; "" donde no hay dato. None si no hay fila."""
    k = (clave, norm(nombre))
    r = tabla.get(ALIAS.get(k, k))
    if r is None:
        return None
    return _num(r["Costo"]), _num(r["GastoOperativo"]), _num(r["Sueldos"])


def filas_catalogo(cats):
    """[(id, nombre, categoria, precio, costo, gasto, sueldos)] con "" donde no hay dato, y la lista de sin fila."""
    tabla = cargar_costos()
    filas, sin_fila = [], []
    for c, pid, nombre, precio in flat(cats):
        co = costos_de(c["clave"], nombre, tabla)
        if co is None:
            sin_fila.append(f"{nombre} ({c['clave']})")
            co = ("", "", "")
        filas.append((pid, nombre, c["clave"], precio) + co)
    return filas, sin_fila


def money(n: int) -> str:
    return "${:,}".format(n).replace(",", ".")


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def build():
    """Devuelve la lista de categorías con sus productos e IDs estables."""
    cats = []
    counters = {}
    for cat, nombre, desc, precio, badge, variantes in SEED_MENU:
        clave, pref, icono, cls = CATS[cat]
        if not cats or cats[-1]["clave"] != clave:
            cats.append({"clave": clave, "titulo": cat, "icono": icono, "cls": cls, "items": []})
        counters[clave] = counters.get(clave, 0) + 1
        pid = f"{pref}{counters[clave]}"
        item = {"id": pid, "nombre": nombre, "desc": desc, "precio": precio, "badge": badge, "variantes": []}
        for vn, vp in variantes:
            suf = "t" if "triple" in vn.lower() else "d"
            item["variantes"].append({"id": pid + suf, "nombre": vn, "precio": vp})
        cats[-1]["items"].append(item)
    return cats


def flat(cats):
    for c in cats:
        for i in c["items"]:
            yield c, i["id"], i["nombre"], i["precio"]
            for v in i["variantes"]:
                yield c, v["id"], v["nombre"], v["precio"]


def menu_data_js(cats):
    lines = ["// ARCHIVO GENERADO por tools/generar_sede2.py a partir de backend/menu_seed.py. No editar a mano.",
             "// Es el catálogo de respaldo: si la hoja Productos de Google carga bien, sus precios lo reemplazan.",
             "const MENU = {"]
    for ci, c in enumerate(cats):
        lines.append(f"    {c['clave']}: [")
        prods = [(i, n, p) for cc, i, n, p in flat(cats) if cc is c]
        for k, (i, n, p) in enumerate(prods):
            lines.append(f"        {{ id: {json.dumps(i)}, nombre: {json.dumps(n, ensure_ascii=False)}, precio: {p} }}" + ("," if k < len(prods) - 1 else ""))
        lines.append("    ]" + ("," if ci < len(cats) - 1 else ""))
    lines.append("};\n")
    lines.append("// Nombres de categorías para mostrar")
    lines.append("const CATEGORIAS_NOMBRES = {")
    lines += [f"    {c['clave']}: {json.dumps(c['titulo'], ensure_ascii=False)}" + ("," if i < len(cats) - 1 else "") for i, c in enumerate(cats)]
    lines.append("};\n")
    lines.append("// Iconos de categorías")
    lines.append("const CATEGORIAS_ICONOS = {")
    lines += [f"    {c['clave']}: {json.dumps(c['icono'])}" + ("," if i < len(cats) - 1 else "") for i, c in enumerate(cats)]
    lines.append("};\n")
    return "\n".join(lines)


def card(i):
    badge = f'<div class="featured-badge">{esc(i["badge"])}</div>' if i["badge"] else ""
    cls = "menu-card featured" if i["badge"] else "menu-card"
    desc = f'<p class="description">{esc(i["desc"])}</p>' if i["desc"] else ""
    var = "".join(
        f'<div class="double-option"><span class="double-name">{esc(v["nombre"])}</span>'
        f'<span class="double-price">{money(v["precio"])}</span></div>'
        for v in i["variantes"]
    )
    return (f'<div class="{cls}">{badge}<div class="card-header"><h3>{esc(i["nombre"].upper())}</h3>'
            f'<span class="price">{money(i["precio"])}</span></div>{desc}{var}</div>')


def index_html(cats):
    secciones = []
    for n, c in enumerate(cats):
        activo = " active" if n == 0 else ""
        if c["clave"] == "bebidas":
            cuerpo = '<div class="bebidas-content"><img src="images/bebidas1.jpeg" alt="Bebidas disponibles" class="bebidas-imagen"></div>'
        elif c["clave"] == "adicionales":
            cuerpo = '<div class="extras-grid">' + "".join(
                f'<div class="extra-item"><span class="extra-name">{esc(i["nombre"])}</span>'
                f'<span class="extra-price">{money(i["precio"])}</span></div>' for i in c["items"]) + "</div>"
        else:
            burbuja = ""
            if c["clave"] == "perros":
                adicional = next((i for cc in cats if cc["clave"] == "adicionales" for i in cc["items"] if i["nombre"] == "Salchicha Americana"), None)
                precio_ad = money(adicional["precio"]) if adicional else ""
                burbuja = (
                    '<div class="info-bubble"><img src="images/vaca.jpeg" alt="" class="info-bubble-img">'
                    '<div class="info-bubble-text"><span class="info-bubble-tag">¡ADICIÓN!</span>'
                    f'<p>Por solo <strong class="info-bubble-price">+{precio_ad}</strong> disfruta tu perro con <strong>salchicha americana</strong></p></div></div>'
                    '<div class="info-bubble"><div class="info-bubble-text"><span class="info-bubble-tag">¡HAZLO COMBO!</span>'
                    '<p>Con la <strong>bebida del día</strong> por solo <strong class="info-bubble-price">$6.500</strong> · con un producto <strong>Coca-Cola</strong> <strong>$8.000</strong> · con uno <strong>Postobón</strong> <strong>$7.500</strong></p></div></div>'
                )
            cuerpo = burbuja + '<div class="menu-grid">' + "".join(card(i) for i in c["items"]) + "</div>"
        secciones.append(
            f'<div class="accordion-item{activo}">'
            f'<button class="accordion-header accordion-header-{c["cls"]}"><i class="fas {c["icono"]}"></i>'
            f'<span>{esc(c["titulo"])}</span><i class="fas fa-chevron-down accordion-icon"></i></button>'
            f'<div class="accordion-content">{cuerpo}</div></div>'
        )
    info = "".join(f"<p class=\"footer-text\">{esc(t)}</p>" for t in (HORARIO, DIRECCION) if t)
    wa = ""
    if WHATSAPP:
        wa = (f'<a href="https://wa.me/{WHATSAPP}?text=Hola%20GOSA!%20Quiero%20hacer%20un%20pedido" class="whatsapp-float" '
              'target="_blank" rel="noopener noreferrer" aria-label="Hacer pedido por WhatsApp"><i class="fab fa-whatsapp"></i>'
              '<span class="whatsapp-text">Haz tu pedido aquí</span></a>')
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menú GOSA Parrilla</title>
    <link rel="icon" type="image/png" href="images/favicon.png">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
</head>
<body>
    <!-- ARCHIVO GENERADO por tools/generar_sede2.py a partir de backend/menu_seed.py. No editar a mano. -->
    <header>
        <img src="images/logo.jpeg" alt="GOSA Parrilla">
        <p class="subtitle">Comida Gourmet con Actitud</p>
    </header>

    <main>
        <h2 class="menu-title">NUESTRO MENÚ</h2>
        <div class="accordion-menu">
{chr(10).join("            " + s for s in secciones)}
        </div>
    </main>

    <footer>
        <h2 class="footer-title">SÍGUENOS EN NUESTRAS REDES</h2>
        <div class="social-icons">
            <a href="https://www.tiktok.com/@gosa.food.truck" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
            <a href="https://www.instagram.com/gosa_ft" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        </div>
        {info}
        <p class="footer-text">GOSA Parrilla © Comida Gourmet con Actitud</p>
    </footer>
    {wa}
    <script src="config.js"></script>
    <script src="script.js"></script>
</body>
</html>
"""


def actualizar_apps_script(cats):
    """Reescribe el bloque CATALOGO_INICIAL del Apps Script (entre las marcas <GENERADO:CATALOGO>)."""
    f = OUT / "google-apps-script.js"
    raw = f.read_bytes().decode("utf-8")
    nl_win, nl = chr(13) + chr(10), chr(10)
    crlf = nl_win in raw
    t = raw.replace(nl_win, nl)
    ini, fin = "  // <GENERADO:CATALOGO>" + nl, "  // </GENERADO:CATALOGO>"
    if t.count(ini) != 1 or t.count(fin) != 1:
        raise SystemExit("google-apps-script.js no tiene las marcas <GENERADO:CATALOGO>")
    filas = ["    [" + ", ".join([json.dumps(pid), json.dumps(nombre, ensure_ascii=False), json.dumps(cat), str(precio)]
                                 + [json.dumps(x) for x in (costo, gasto, sueldos)]) + "]"
             for pid, nombre, cat, precio, costo, gasto, sueldos in filas_catalogo(cats)[0]]
    bloque = ("  // Productos con los que se crea la hoja Productos: [ID, Nombre, Categoria, PrecioVenta, Costo, GastoOperativo, Sueldos]." + nl
              + "  // Costo/GastoOperativo/Sueldos vienen de tools/costos_sede1.csv; \"\" = sin dato. Generado: no editar a mano." + nl
              + "  var CATALOGO_INICIAL = [" + nl + ("," + nl).join(filas) + nl + "  ];" + nl)
    a = t.index(ini) + len(ini)
    b = t.index(fin)
    t = t[:a] + bloque + t[b:]
    f.write_bytes((t.replace(nl, nl_win) if crlf else t).encode("utf-8"))


def write(path: Path, text: str, bom=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes((("﻿" if bom else "") + text).encode("utf-8"))


def main():
    cats = build()
    write(OUT / "menu-data.js", menu_data_js(cats))
    write(OUT / "index.html", index_html(cats))
    actualizar_apps_script(cats)
    # CSV con BOM para que Excel/Sheets respeten las tildes
    prod = OUT / "hoja-google" / "Productos.csv"
    prod.parent.mkdir(parents=True, exist_ok=True)
    with prod.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["ID", "Nombre", "Categoria", "PrecioVenta", "Costo", "GastoOperativo", "Activo", "Sueldos"])
        filas, sin_fila = filas_catalogo(cats)
        for pid, nombre, cat, precio, costo, gasto, sueldos in filas:
            w.writerow([pid, nombre, cat, precio, costo, gasto, "TRUE", sueldos])
    with (OUT / "hoja-google" / "Pedidos.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        csv.writer(fh).writerow(["ID", "Fecha", "Hora", "Items", "Total", "Estado", "Notas", "MetodoPago"])
    print(f"OK: {len(cats)} categorías, {len(filas)} productos -> {OUT}")
    print(f"Costos cruzados: {len(filas) - len(sin_fila)} de {len(filas)}")
    print("SIN costo (llenar a mano en la hoja Productos): " + (", ".join(sin_fila) or "ninguno"))
    # Avisos de datos que merecen revisión
    for pid, nombre, cat, precio, costo, gasto, sueldos in filas:
        if costo == 0:
            print(f"  REVISAR costo 0: {nombre} (precio {precio})")
        elif costo != "" and costo >= precio * 0.7:
            print(f"  REVISAR costo alto: {nombre} costo {costo} vs precio {precio}")


if __name__ == "__main__":
    main()
