"""GOSA Food Truck · API del POS y menú digital (FastAPI + SQLite)."""
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from menu_seed import SEED_MENU

DB_PATH = os.environ.get("GOSA_DB", str(Path(__file__).with_name("gosa.db")))
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
STATUSES = ["nuevo", "preparando", "listo", "entregado"]

def conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    return c


def init_db() -> None:
    with conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS menu_items(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              cat TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '',
              price INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
              badge TEXT NOT NULL DEFAULT '', parent_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS orders(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              place TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'nuevo',
              paid INTEGER NOT NULL DEFAULT 0, tip INTEGER NOT NULL DEFAULT 0,
              method TEXT, created_at TEXT NOT NULL, paid_at TEXT
            );
            CREATE TABLE IF NOT EXISTS order_items(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
              name TEXT NOT NULL, qty INTEGER NOT NULL, price INTEGER NOT NULL
            );
            """
        )
        cols = {r["name"] for r in c.execute("PRAGMA table_info(menu_items)")}
        for col, ddl in (("badge", "TEXT NOT NULL DEFAULT ''"), ("parent_id", "INTEGER")):
            if col not in cols:  # bases creadas con la versión anterior
                c.execute(f"ALTER TABLE menu_items ADD COLUMN {col} {ddl}")
        # Versión 1: carta de ejemplo -> se reemplaza por la carta real (order_items guarda nombre y precio, no FK).
        if c.execute("PRAGMA user_version").fetchone()[0] < 8:
            c.execute("DELETE FROM menu_items")
            seed_menu(c)
            c.execute("PRAGMA user_version = 8")


def seed_menu(c: sqlite3.Connection) -> None:
    sort = 0
    for cat, name, desc, price, badge, variants in SEED_MENU:
        cur = c.execute(
            "INSERT INTO menu_items(cat,name,description,price,badge,sort) VALUES (?,?,?,?,?,?)",
            (cat, name, desc, price, badge, sort),
        )
        sort += 1
        for vname, vprice in variants:
            c.execute(
                "INSERT INTO menu_items(cat,name,description,price,sort,parent_id) VALUES (?,?,?,?,?,?)",
                (cat, vname, "", vprice, sort, cur.lastrowid),
            )
            sort += 1

def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def order_dict(c: sqlite3.Connection, row: sqlite3.Row) -> dict:
    items = [
        dict(r)
        for r in c.execute(
            "SELECT name, qty, price FROM order_items WHERE order_id=? ORDER BY id", (row["id"],)
        )
    ]
    subtotal = sum(i["qty"] * i["price"] for i in items)
    return {
        "id": row["id"],
        "place": row["place"],
        "status": row["status"],
        "paid": bool(row["paid"]),
        "method": row["method"],
        "created_at": row["created_at"],
        "items": items,
        "subtotal": subtotal,
        "tip": row["tip"],
        "total": subtotal + row["tip"],
    }


class OrderLine(BaseModel):
    menu_id: int
    qty: int = Field(ge=1, le=99)


class OrderIn(BaseModel):
    place: str = Field(min_length=1, max_length=40)  # "Mesa 4" | "Para llevar"
    items: List[OrderLine] = Field(min_length=1)


class StatusIn(BaseModel):
    status: str


class PayIn(BaseModel):
    tip_pct: int = Field(default=0, ge=0, le=30)
    method: str = Field(pattern="^(efectivo|tarjeta|nequi)$")


app = FastAPI(title="GOSA POS")
app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"]
)
init_db()


@app.get("/api/menu")
def get_menu():
    with conn() as c:
        rows = c.execute(
            "SELECT id, cat, name, description, price, badge, parent_id FROM menu_items WHERE active=1 ORDER BY sort, id"
        ).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/orders", status_code=201)
def create_order(body: OrderIn):
    with conn() as c:
        prices = {}
        for line in body.items:
            m = c.execute(
                "SELECT name, price FROM menu_items WHERE id=? AND active=1", (line.menu_id,)
            ).fetchone()
            if not m:
                raise HTTPException(400, f"Producto {line.menu_id} no existe")
            prices[line.menu_id] = m
        cur = c.execute(
            "INSERT INTO orders(place, status, created_at) VALUES (?, 'nuevo', ?)",
            (body.place.strip(), now()),
        )
        oid = cur.lastrowid
        c.executemany(
            "INSERT INTO order_items(order_id, name, qty, price) VALUES (?,?,?,?)",
            [(oid, prices[l.menu_id]["name"], l.qty, prices[l.menu_id]["price"]) for l in body.items],
        )
        return order_dict(c, c.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone())


@app.get("/api/orders")
def list_orders(status: Optional[str] = None, paid: Optional[bool] = None):
    sql, args = "SELECT * FROM orders WHERE 1=1", []
    if status:
        wanted = [s for s in status.split(",") if s in STATUSES]
        sql += f" AND status IN ({','.join('?' * len(wanted))})"
        args += wanted
    if paid is not None:
        sql += " AND paid=?"
        args.append(int(paid))
    sql += " ORDER BY created_at"
    with conn() as c:
        return [order_dict(c, r) for r in c.execute(sql, args).fetchall()]


def get_or_404(c: sqlite3.Connection, oid: int) -> sqlite3.Row:
    row = c.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone()
    if not row:
        raise HTTPException(404, "Pedido no encontrado")
    return row


@app.patch("/api/orders/{oid}/status")
def set_status(oid: int, body: StatusIn):
    if body.status not in STATUSES:
        raise HTTPException(400, f"Estado inválido. Usa uno de {STATUSES}")
    with conn() as c:
        get_or_404(c, oid)
        c.execute("UPDATE orders SET status=? WHERE id=?", (body.status, oid))
        return order_dict(c, get_or_404(c, oid))


@app.post("/api/orders/{oid}/pay")
def pay_order(oid: int, body: PayIn):
    with conn() as c:
        row = get_or_404(c, oid)
        if row["paid"]:
            raise HTTPException(409, "El pedido ya está pagado")
        subtotal = c.execute(
            "SELECT COALESCE(SUM(qty*price),0) FROM order_items WHERE order_id=?", (oid,)
        ).fetchone()[0]
        tip = round(subtotal * body.tip_pct / 100 / 100) * 100  # a la centena
        c.execute(
            "UPDATE orders SET paid=1, tip=?, method=?, paid_at=? WHERE id=?",
            (tip, body.method, now(), oid),
        )
        return order_dict(c, get_or_404(c, oid))


# --- Sirve el frontend compilado (npm run build) desde el mismo puerto ---
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        f = (DIST / path).resolve()
        if path and f.is_file() and DIST in f.parents:
            return FileResponse(f)
        return FileResponse(DIST / "index.html")
