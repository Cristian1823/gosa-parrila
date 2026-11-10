"""Genera el código QR del menú público y un cartel imprimible con la marca.

Uso (desde la raíz del proyecto):
    pip install segno
    python tools/generar_qr.py                      # usa la dirección por defecto
    python tools/generar_qr.py https://otra-direccion.com

Salidas en qr-menu/ (se sobrescriben):
    qr-menu.png      QR solo, negro sobre blanco, 1200 px o más (para pantallas, WhatsApp, redes)
    qr-menu.svg      QR solo en vector (para imprimir a cualquier tamaño sin perder nitidez)
    cartel.html      cartel A5 con el logo y el QR; se convierte a PDF con Edge (ver README de la carpeta)

IMPORTANTE: el QR guarda la dirección tal cual. Si el menú cambia de dirección, los QR ya impresos dejan de
servir y hay que reimprimirlos. Para evitarlo, conviene usar un dominio propio antes de imprimir en cantidad.
"""
import html
import math
import sys
from pathlib import Path

try:
    import segno
except ImportError:
    sys.exit("Falta la librería segno. Instálala con:  pip install segno")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "qr-menu"
URL_POR_DEFECTO = "https://gosa-parrila.pages.dev"
LOGO = "../sede2-sheets/images/logo.jpeg"  # relativo a qr-menu/cartel.html


def main():
    url = (sys.argv[1] if len(sys.argv) > 1 else URL_POR_DEFECTO).strip()
    if not url.startswith("https://"):
        sys.exit("La dirección debe empezar por https://")
    OUT.mkdir(exist_ok=True)

    # Corrección de errores Q (25 %): tolera manchas o desgaste del papel. Borde de 4 módulos = zona silenciosa.
    qr = segno.make(url, error="q", micro=False)
    lado = qr.symbol_size(border=4)[0]
    escala = math.ceil(1200 / lado)
    qr.save(OUT / "qr-menu.png", scale=escala, border=4, dark="#000000", light="#ffffff")
    qr.save(OUT / "qr-menu.svg", scale=10, border=4, dark="#000000", light="#ffffff", xmldecl=True)

    svg = qr.svg_inline(scale=1, border=4, dark="#000000", light="#ffffff", omitsize=True)
    visible = url.replace("https://", "")
    (OUT / "cartel.html").write_text(cartel(svg, visible, url), encoding="utf-8")
    print(f"OK: {url}")
    print(f"QR versión {qr.version}, {lado}x{lado} módulos, PNG de {lado * escala} px -> {OUT}")


def cartel(svg: str, visible: str, url: str) -> str:
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cartel QR · GOSA Parrilla</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600&display=swap">
<style>
  @page {{ size: A5 portrait; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  html, body {{ background: #000; }}
  body {{ width: 148mm; height: 210mm; font-family: 'Inter', sans-serif; color: #fff; }}
  .hoja {{ position: relative; width: 148mm; height: 210mm; padding: 9mm; background: #000; overflow: hidden; }}
  .marco {{ position: absolute; inset: 6mm; border: 0.8mm solid #ffd700; border-radius: 5mm; pointer-events: none; }}
  .contenido {{ position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; padding: 6mm 4mm 4mm; }}
  .logo {{ width: 100mm; height: auto; display: block; }}
  .titulo {{ font-family: 'Bebas Neue', sans-serif; font-weight: 400; color: #ffd700; letter-spacing: 1.2mm; line-height: 1.02; }}
  .titulo .a {{ display: block; font-size: 13mm; }}
  .titulo .b {{ display: block; font-size: 19mm; color: #fff; }}
  .qr {{ background: #fff; border-radius: 4mm; padding: 3mm; width: 82mm; height: 82mm; box-shadow: 0 0 0 1.2mm #ffd700; }}
  .qr svg {{ display: block; width: 100%; height: 100%; }}
  .url {{ font-size: 4.6mm; letter-spacing: 0.4mm; color: #e0e0e0; font-weight: 600; }}
  .pie {{ font-size: 3.8mm; letter-spacing: 0.9mm; color: #ffd700; font-weight: 300; text-transform: uppercase; }}
</style>
</head>
<body>
<div class="hoja">
  <div class="marco"></div>
  <div class="contenido">
    <img class="logo" src="{LOGO}" alt="GOSA Parrilla">
    <div class="titulo"><span class="a">Escanea y mira</span><span class="b">nuestro menú</span></div>
    <div class="qr" role="img" aria-label="Código QR del menú: {html.escape(url)}">{svg}</div>
    <div class="url">{html.escape(visible)}</div>
    <div class="pie">Comida Gourmet con Actitud</div>
  </div>
</div>
</body>
</html>
"""


if __name__ == "__main__":
    main()
