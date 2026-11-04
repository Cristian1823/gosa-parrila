"""Carta GOSA (copiada del menú público de la sede Food Truck).

Cada plato: (categoría, nombre, descripción, precio, etiqueta, [(variante, precio), ...]).
Las variantes (doble, triple) se guardan como productos propios enlazados al plato base.
"""

ENTRADAS = "Entradas"
PERROS = "Perros"
HAMBURGUESAS = "Hamburguesas"
SALCHIPAPAS = "Salchipapas"
ADICIONALES = "Adicionales"
BEBIDAS = "Bebidas"

SEED_MENU = [
    # --- Entradas ---
    (ENTRADAS, "Aritos Gosa", "Crujientes y sabrosos aros de cebolla hechos al mejor estilo GOSA y acompañados de salsa de la casa", 8000, "", []),
    (ENTRADAS, "Bacon Gosa", "Generosas porciones de papa doradas bañadas en queso cheddar derretido y coronadas con tocineta crocante", 8000, "", []),
    (ENTRADAS, "Totopos Gosa", "Crujientes totopos de maíz bañados en nuestra salsa cheddar de la casa, el picoteo perfecto para comenzar", 8000, "", []),
    (ENTRADAS, "Tender Gosa", "Crujientes nuggets de pollo apanados servidos con el toque único de la salsa artesanal de la casa", 8500, "", []),
    (ENTRADAS, "La Gallego", "Crujientes papas a la francesa acompañadas de tocineta crocante y nuestra salsa picante de la casa. La combinación perfecta entre textura, intensidad y ese toque especial que abre el apetito para una gran experiencia Gosa.", 8500, "MUNDIALISTA", []),
    # --- Perros ---
    (PERROS, "Perro Ranchero", "Salchicha artesanal envuelta en tocineta crocante, pan brioche artesanal coronado con papa ripio doradita, queso fundido y nuestra inigualable salsa de la casa", 10000, "", []),
    (PERROS, "Chori Gosa", "Chorizo de cerdo envuelto en tocineta, acompañado de queso doble crema, papa ripio y salsa de la casa", 12000, "", []),
    (PERROS, "Tropical Gosa", "Salchicha premium envuelta en tocineta, pan brioche artesanal con piña caramelizada y jamón, cubierta con papa ripio crujiente y queso doble crema fundido", 12000, "", []),
    (PERROS, "Texas BBQ", "Exclusiva salchicha premium envuelta en tocineta, pan brioche artesanal con queso cheddar fundido y brisket BBQ ahumado que potencia cada bocado", 14000, "PREMIUM", []),
    (PERROS, "Triple Gosa", "Salchicha premium envuelta en tocineta, pan brioche artesanal con chorizo a la parrilla, chicharrones crujientes, papa ripio, queso fundido, cebolla fresca y 1 huevo frito", 14000, "POPULAR", []),
    # --- Hamburguesas ---
    (HAMBURGUESAS, "Gosa Burguer", "150 gramos de carne, pan brioche, huevo frito o tocineta, queso americano, papa ripio, salsas de la casa, lechuga y tomate", 10000, "",
     [("Gosa Burguer Doble", 16000), ("Gosa Burguer Triple", 23000)]),
    (HAMBURGUESAS, "Crispy Gosa", "150 gramos de carne, pan brioche, queso cheddar, tocineta, cebolla crispy, bbq, salsa de la casa, lechuga y tomate", 14000, "",
     [("Crispy Gosa Doble", 19000), ("Crispy Gosa Triple", 26000)]),
    (HAMBURGUESAS, "Madurita", "150 gramos de carne, pan brioche, queso americano, plátano maduro y chorizo, salsa de la casa, lechuga y tomate", 14000, "ESPECIAL",
     [("Madurita Doble", 19000), ("Madurita Triple", 26000)]),
    (HAMBURGUESAS, "Alfa Pretzel", "150 gramos de carne, pan pretzel, tocineta, aros de cebolla, queso americano, queso cheddar, salsa de la casa, lechuga y tomate", 16000, "",
     [("Alfa Pretzel Doble", 22000), ("Alfa Pretzel Triple", 30000)]),
    (HAMBURGUESAS, "La Guerita", "150 gramos de carne, pan brioche, salsa de chipotle picante, queso americano, queso cheddar, nachos, lechuga y tomate", 16000, "MUNDIALISTA",
     [("La Guerita Doble", 22000), ("La Guerita Triple", 30000)]),
    (HAMBURGUESAS, "360 Hamburguer", "150 gramos de carne, pan pretzel, queso doble crema y cheddar, mermelada de champiñones y tocineta acompañando con el sabor fresco del perejil y salsas de la casa", 16000, "NUEVO",
     [("360 Hamburguer Doble", 22000)]),
    # --- Salchipapas ---
    (SALCHIPAPAS, "Rapi Gosa", "Papas a la francesa con salchicha de cerdo y ranchera coronadas con nuestras salsas de la casa y queso cheddar", 10000, "", []),
    (SALCHIPAPAS, "Salchi Gosa", "Papas a la francesa con salchicha ranchera y de cerdo, maduro, chicharrón, chorizo complementados con la salsa de la casa y queso cheddar fundido", 14500, "", []),
    (SALCHIPAPAS, "La Gosa Supreme", "Papas a la francesa con salchicha de cerdo y ranchera, chorizo jugoso y carne BBQ al punto, acompañadas de papa ripio crocante, maíz tierno y queso doble crema, todo bañado con nuestras irresistibles salsas de la casa", 26000, "LA REINA", []),
    # --- Adicionales ---
    (ADICIONALES, "Salchicha", "", 1500, "", []),
    (ADICIONALES, "Tocineta", "", 1500, "", []),
    (ADICIONALES, "Agua", "", 1000, "", []),
    (ADICIONALES, "Queso Mozzarella", "", 1500, "", []),
    (ADICIONALES, "Chorizo", "", 3000, "", []),
    (ADICIONALES, "Queso Cheddar", "", 2000, "", []),
    (ADICIONALES, "Salchicha Americana Zenú", "", 2500, "", []),
    (ADICIONALES, "Carne de Hamburguesa", "", 3500, "", []),
    (ADICIONALES, "Chicharrón", "", 3500, "", []),
    (ADICIONALES, "Porción de Papa", "", 5000, "", []),
    # --- Bebidas (precios del sistema de pedidos de la sede 1; el menú público solo muestra la imagen) ---
    (BEBIDAS, "Coca Cola 250 ml", "", 2500, "", []),
    (BEBIDAS, "Coca Cola 400 ml", "", 4000, "", []),
    (BEBIDAS, "Coca Cola 0 400 ml", "", 3600, "", []),
    (BEBIDAS, "Coca Cola 1.5 L", "", 8500, "", []),
    (BEBIDAS, "Coca Cola 0 1.5 L", "", 8000, "", []),
    (BEBIDAS, "Quatro 400 ml", "", 4000, "", []),
    (BEBIDAS, "Quatro 1.5 L", "", 7500, "", []),
    (BEBIDAS, "Jugo Hit 500 ml", "", 3200, "", []),
    (BEBIDAS, "Agua", "", 2000, "", []),
    (BEBIDAS, "Corona", "", 6500, "", []),
    (BEBIDAS, "Coronita", "", 5000, "", []),
    (BEBIDAS, "Agua del día", "", 1000, "", []),
]
