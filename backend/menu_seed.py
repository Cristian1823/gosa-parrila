"""Carta GOSA del local (sede 2).

Fuente: "precios gosa para carta.pdf" enviado por el cliente (nov 2026). Las categorías, descripciones y
etiquetas parten de la carta de la sede Food Truck; los precios son los nuevos del local.

Cada plato: (categoría, nombre, descripción, precio, etiqueta, [(variante, precio), ...]).
Las variantes (doble, triple) se guardan como productos propios enlazados al plato base.
"""

ENTRADAS = "Entradas"
PERROS = "Perros"
HAMBURGUESAS = "Hamburguesas"
SALCHIPAPAS = "Salchipapas"
PLATOS = "Platos a la carta"
ADICIONALES = "Adicionales"
BEBIDAS = "Bebidas"

SEED_MENU = [
    # --- Entradas ---
    (ENTRADAS, "Aritos Gosa", "Crujientes y sabrosos aros de cebolla hechos al mejor estilo GOSA y acompañados de salsa de la casa", 11000, "", []),
    (ENTRADAS, "Bacon Gosa", "Generosas porciones de papa doradas bañadas en queso cheddar derretido y coronadas con tocineta crocante", 11000, "", []),
    (ENTRADAS, "La Gallego", "Crujientes papas a la francesa acompañadas de tocineta crocante y nuestra salsa picante de la casa. La combinación perfecta entre textura, intensidad y ese toque especial que abre el apetito para una gran experiencia Gosa.", 12000, "", []),
    (ENTRADAS, "Bucaro", "Crujientes papas a la francesa acompañadas por nuestras salsas de la casa, mermelada de piña y queso costeño", 13000, "", []),
    # --- Perros ---
    (PERROS, "Perro Ranchero", "Salchicha americana envuelta en tocineta crocante, pan brioche artesanal coronado con papa ripio doradita, queso fundido y nuestra inigualable salsa de la casa", 14500, "", []),
    (PERROS, "Chori Gosa", "Chorizo de cerdo envuelto en tocineta, acompañado de queso doble crema, papa ripio y salsa de la casa", 16000, "", []),
    (PERROS, "Tropical Gosa", "Salchicha americana envuelta en tocineta, pan brioche artesanal con piña caramelizada y jamón, cubierta con papa ripio crujiente y queso doble crema fundido", 17000, "", []),
    (PERROS, "Texas BBQ", "Exclusiva salchicha americana envuelta en tocineta, pan brioche artesanal con queso cheddar fundido y brisket BBQ ahumado que potencia cada bocado", 19000, "PREMIUM", []),
    (PERROS, "Triple Gosa", "Salchicha americana envuelta en tocineta, pan brioche artesanal con chorizo a la parrilla, chicharrones crujientes, papa ripio, queso fundido, cebolla fresca y 1 huevo frito", 19000, "POPULAR", []),
    # --- Hamburguesas ---
    (HAMBURGUESAS, "Gosa Burguer", "150 gramos de carne, pan brioche, huevo frito o tocineta, queso americano, papa ripio, salsas de la casa, lechuga y tomate", 14000, "",
     [("Gosa Burguer Doble", 21000), ("Gosa Burguer Triple", 27000)]),
    (HAMBURGUESAS, "Crispy Gosa", "150 gramos de carne, pan brioche, queso cheddar, tocineta, cebolla crispy, bbq, salsa de la casa, lechuga y tomate", 18000, "",
     [("Crispy Gosa Doble", 24000), ("Crispy Gosa Triple", 30000)]),
    (HAMBURGUESAS, "Madurita", "150 gramos de carne, pan brioche, queso americano, plátano maduro y chorizo, salsa de la casa, lechuga y tomate", 18000, "ESPECIAL",
     [("Madurita Doble", 24000), ("Madurita Triple", 30000)]),
    (HAMBURGUESAS, "Alfa Pretzel", "150 gramos de carne, pan pretzel, tocineta, aros de cebolla, queso americano, queso cheddar, salsa de la casa, lechuga y tomate", 19000, "",
     [("Alfa Pretzel Doble", 25000), ("Alfa Pretzel Triple", 33000)]),
    (HAMBURGUESAS, "La Guerita", "150 gramos de carne, pan brioche, salsa de chipotle picante, queso americano, queso cheddar, nachos, lechuga y tomate", 19000, "",
     [("La Guerita Doble", 25000), ("La Guerita Triple", 33000)]),
    # --- Salchipapas ---
    (SALCHIPAPAS, "Rapi Gosa", "Papas a la francesa con salchicha de cerdo y ranchera coronadas con nuestras salsas de la casa y queso cheddar", 14500, "", []),
    (SALCHIPAPAS, "Salchi Gosa", "Papas a la francesa con salchicha ranchera y de cerdo, maduro, chicharrón, chorizo complementados con la salsa de la casa y queso cheddar fundido", 17000, "", []),
    (SALCHIPAPAS, "Salchi Bucara", "Papas a la francesa con salchicha americana o chorizo, mermelada de piña, salsas de la casa y queso costeño por encima", 18000, "", []),
    (SALCHIPAPAS, "La Gosa Supreme", "Papas a la francesa con salchicha de cerdo y ranchera, chorizo jugoso y carne BBQ al punto, acompañadas de papa ripio crocante, maíz tierno y queso doble crema, todo bañado con nuestras irresistibles salsas de la casa", 31000, "LA REINA", []),
    # --- Platos a la carta ---
    (PLATOS, "Gosa Pinchudo", "Delicioso pincho de pollo asado, acompañado de papas a la francesa y nuestra irresistible salsa de la casa.", 12000, "", []),
    (PLATOS, "Gosa Dorada", "Tierna pechuga de pollo a la plancha, acompañada de crujientes papas a la francesa y dulce plátano maduro.", 24000, "", []),
    (PLATOS, "Gosa Pork", "Jugoso lomo de cerdo, acompañado de papas a la francesa, plátano maduro y un toque especial de mermelada de piña.", 24000, "", []),
    (PLATOS, "Gosa Bravio", "Exquisita bola de res a la parrilla, acompañada de arepa, papas a la francesa y chimichurri para darle el toque perfecto.", 25500, "", []),
    (PLATOS, "Gosa Gatrine", "Tierna pechuga de pollo a la plancha, acompañada de crujientes papas a la francesa y dulce plátano maduro. Y queso doble crema derretido por encima.", 27000, "", []),
    (PLATOS, "Gosa Gacuho", "Churrasco a la parrilla, acompañado de arepa, crujientes papas a la francesa, chimichurri y nuestra deliciosa salsa de la casa.", 28500, "", []),
    (PLATOS, "Chuleta Gosa", "Chuleta de cerdo a la parrilla, acompañada de plátano maduro y papas a la francesa.", 27000, "", []),
    (PLATOS, "Gosa Black Ribs", "Costillas BBQ ahumadas, acompañadas de plátano maduro y papas a la francesa.", 29000, "", []),
    # --- Adicionales ---
    (ADICIONALES, "Chimichurri", "", 3000, "", []),
    (ADICIONALES, "Queso Doble Crema", "", 2500, "", []),
    (ADICIONALES, "Tocineta", "", 3500, "", []),
    (ADICIONALES, "Queso Cheddar", "", 4000, "", []),  # el PDF dice "300": se asume 3.000 (confirmar)
    (ADICIONALES, "Chicharrón", "", 5000, "", []),  # el PDF dice "400": se asume 4.000 (confirmar)
    (ADICIONALES, "Salchicha Americana", "", 5000, "", []),
    (ADICIONALES, "Chorizo", "", 5500, "", []),
    (ADICIONALES, "Carne de Hamburguesa", "", 6500, "", []),
    (ADICIONALES, "Porción de Papa", "", 7000, "", []),
    # --- Bebidas (precios del sistema de pedidos de la sede 1; el PDF del cliente no las incluye) ---
    (BEBIDAS, "Coca Cola 250 ml", "", 3500, "", []),
    (BEBIDAS, "Coca Cola 400 ml", "", 5000, "", []),
    (BEBIDAS, "Coca Cola 0 400 ml", "", 4600, "", []),
    (BEBIDAS, "Coca Cola 1.5 L", "", 9500, "", []),
    (BEBIDAS, "Coca Cola 0 1.5 L", "", 9000, "", []),
    (BEBIDAS, "Quatro 400 ml", "", 5000, "", []),
    (BEBIDAS, "Quatro 1.5 L", "", 8500, "", []),
    (BEBIDAS, "Jugo Hit 500 ml", "", 4200, "", []),
    (BEBIDAS, "Agua", "", 3000, "", []),
    (BEBIDAS, "Corona", "", 7500, "", []),
    (BEBIDAS, "Coronita", "", 6000, "", []),
    (BEBIDAS, "Agua del día", "", 2000, "", []),
]
