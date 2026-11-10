// ARCHIVO GENERADO por tools/generar_sede2.py a partir de backend/menu_seed.py. No editar a mano.
// Es el catálogo de respaldo: si la hoja Productos de Google carga bien, sus precios lo reemplazan.
const MENU = {
    entradas: [
        { id: "e1", nombre: "Aritos Gosa", precio: 11000 },
        { id: "e2", nombre: "Bacon Gosa", precio: 11000 },
        { id: "e3", nombre: "La Gallego", precio: 12000 },
        { id: "e4", nombre: "Bucaro", precio: 13000 }
    ],
    perros: [
        { id: "p1", nombre: "Perro Ranchero", precio: 14500 },
        { id: "p2", nombre: "Chori Gosa", precio: 16000 },
        { id: "p3", nombre: "Tropical Gosa", precio: 17000 },
        { id: "p4", nombre: "Texas BBQ", precio: 19000 },
        { id: "p5", nombre: "Triple Gosa", precio: 19000 }
    ],
    hamburguesas: [
        { id: "h1", nombre: "Gosa Burguer", precio: 14000 },
        { id: "h1d", nombre: "Gosa Burguer Doble", precio: 21000 },
        { id: "h1t", nombre: "Gosa Burguer Triple", precio: 27000 },
        { id: "h2", nombre: "Crispy Gosa", precio: 18000 },
        { id: "h2d", nombre: "Crispy Gosa Doble", precio: 24000 },
        { id: "h2t", nombre: "Crispy Gosa Triple", precio: 30000 },
        { id: "h3", nombre: "Madurita", precio: 18000 },
        { id: "h3d", nombre: "Madurita Doble", precio: 24000 },
        { id: "h3t", nombre: "Madurita Triple", precio: 30000 },
        { id: "h4", nombre: "Alfa Pretzel", precio: 19000 },
        { id: "h4d", nombre: "Alfa Pretzel Doble", precio: 25000 },
        { id: "h4t", nombre: "Alfa Pretzel Triple", precio: 33000 },
        { id: "h5", nombre: "La Guerita", precio: 19000 },
        { id: "h5d", nombre: "La Guerita Doble", precio: 25000 },
        { id: "h5t", nombre: "La Guerita Triple", precio: 33000 }
    ],
    salchipapas: [
        { id: "s1", nombre: "Rapi Gosa", precio: 14500 },
        { id: "s2", nombre: "Salchi Gosa", precio: 17000 },
        { id: "s3", nombre: "Salchi Bucara", precio: 18000 },
        { id: "s4", nombre: "La Gosa Supreme", precio: 31000 }
    ],
    platos: [
        { id: "pl1", nombre: "Gosa Pinchudo", precio: 12000 },
        { id: "pl2", nombre: "Gosa Dorada", precio: 24000 },
        { id: "pl3", nombre: "Gosa Pork", precio: 24000 },
        { id: "pl4", nombre: "Gosa Bravio", precio: 25500 },
        { id: "pl5", nombre: "Gosa Gatrine", precio: 27000 },
        { id: "pl6", nombre: "Gosa Gacuho", precio: 28500 }
    ],
    adicionales: [
        { id: "a1", nombre: "Chimichurri", precio: 3000 },
        { id: "a2", nombre: "Queso Doble Crema", precio: 2500 },
        { id: "a3", nombre: "Tocineta", precio: 3500 },
        { id: "a4", nombre: "Queso Cheddar", precio: 4000 },
        { id: "a5", nombre: "Chicharrón", precio: 5000 },
        { id: "a6", nombre: "Salchicha Americana", precio: 5000 },
        { id: "a7", nombre: "Chorizo", precio: 5500 },
        { id: "a8", nombre: "Carne de Hamburguesa", precio: 6500 },
        { id: "a9", nombre: "Porción de Papa", precio: 7000 }
    ],
    bebidas: [
        { id: "be1", nombre: "Coca Cola 250 ml", precio: 3500 },
        { id: "be2", nombre: "Coca Cola 400 ml", precio: 5000 },
        { id: "be3", nombre: "Coca Cola 0 400 ml", precio: 4600 },
        { id: "be4", nombre: "Coca Cola 1.5 L", precio: 9500 },
        { id: "be5", nombre: "Coca Cola 0 1.5 L", precio: 9000 },
        { id: "be6", nombre: "Quatro 400 ml", precio: 5000 },
        { id: "be7", nombre: "Quatro 1.5 L", precio: 8500 },
        { id: "be8", nombre: "Jugo Hit 500 ml", precio: 4200 },
        { id: "be9", nombre: "Agua", precio: 3000 },
        { id: "be10", nombre: "Corona", precio: 7500 },
        { id: "be11", nombre: "Coronita", precio: 6000 },
        { id: "be12", nombre: "Agua del día", precio: 2000 }
    ]
};

// Nombres de categorías para mostrar
const CATEGORIAS_NOMBRES = {
    entradas: "Entradas",
    perros: "Perros",
    hamburguesas: "Hamburguesas",
    salchipapas: "Salchipapas",
    platos: "Platos a la carta",
    adicionales: "Adicionales",
    bebidas: "Bebidas"
};

// Iconos de categorías
const CATEGORIAS_ICONOS = {
    entradas: "fa-fire",
    perros: "fa-hotdog",
    hamburguesas: "fa-burger",
    salchipapas: "fa-drumstick-bite",
    platos: "fa-utensils",
    adicionales: "fa-plus",
    bebidas: "fa-bottle-water"
};
