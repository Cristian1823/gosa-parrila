// GOSA sede 2 - Backend en Google Apps Script. Ver sede2-sheets/README.md para el despliegue.
// Las acciones de clientes (sellos) e inventario vienen de la sede 1 y no se usan en esta versión.
const SHEET_NAME = 'Pedidos';
var IDS_AHUMADOS = []; // Sede 2: sin línea Ahumados, todo se cuenta como 'gosa'                                                                                                                                                                                                                           

  // ========== HOJAS NECESARIAS ==========
  // Nombres y encabezados que usa el sistema. Si falta alguna pestaña se crea sola (asegurarHojas),
  // así no hay que armarlas a mano. También se puede ejecutar configurarHojas() desde el editor.
  var HOJAS = {
    'Pedidos':   ['ID', 'Fecha', 'Hora', 'Items', 'Total', 'Estado', 'Notas', 'MetodoPago'],
    'Productos': ['ID', 'Nombre', 'Categoria', 'PrecioVenta', 'Costo', 'GastoOperativo', 'Activo', 'Sueldos'],
    'Sueldos':   ['ID', 'Fecha', 'Nombre', 'Valor', 'Nota', 'Linea']
  };

  // <GENERADO:CATALOGO>
  // Productos con los que se crea la hoja Productos: [ID, Nombre, Categoria, PrecioVenta, Costo, GastoOperativo, Sueldos].
  // Costo/GastoOperativo/Sueldos vienen de tools/costos_sede1.csv; "" = sin dato. Generado: no editar a mano.
  var CATALOGO_INICIAL = [
    ["e1", "Aritos Gosa", "entradas", 11000, 3348, 1000, ""],
    ["e2", "Bacon Gosa", "entradas", 11000, 3751, 1000, 750],
    ["e3", "La Gallego", "entradas", 12000, 4280, 1000, 750],
    ["e4", "Bucaro", "entradas", 13000, "", "", ""],
    ["p1", "Perro Ranchero", "perros", 14500, 3733, 1000, 500],
    ["p2", "Chori Gosa", "perros", 16000, 5392, 1000, 500],
    ["p3", "Tropical Gosa", "perros", 17000, 4821, 1000, 500],
    ["p4", "Texas BBQ", "perros", 19000, 5921, 500, 500],
    ["p5", "Triple Gosa", "perros", 19000, 5713, 400, 500],
    ["h1", "Gosa Burguer", "hamburguesas", 14000, 5310, 700, 500],
    ["h1d", "Gosa Burguer Doble", "hamburguesas", 21000, 7510, 1000, 500],
    ["h1t", "Gosa Burguer Triple", "hamburguesas", 27000, 10500, 1000, 1000],
    ["h2", "Crispy Gosa", "hamburguesas", 18000, 6681, 1000, 500],
    ["h2d", "Crispy Gosa Doble", "hamburguesas", 24000, 8781, 1000, 500],
    ["h2t", "Crispy Gosa Triple", "hamburguesas", 30000, 12000, 1000, 1000],
    ["h3", "Madurita", "hamburguesas", 18000, 6517, 1000, 500],
    ["h3d", "Madurita Doble", "hamburguesas", 24000, 8617, 1000, 500],
    ["h3t", "Madurita Triple", "hamburguesas", 30000, 12000, 1000, 1000],
    ["h4", "Alfa Pretzel", "hamburguesas", 19000, 7310, 1000, ""],
    ["h4d", "Alfa Pretzel Doble", "hamburguesas", 25000, 9757, 1000, ""],
    ["h4t", "Alfa Pretzel Triple", "hamburguesas", 33000, 13100, 1000, 1000],
    ["h5", "La Guerita", "hamburguesas", 19000, 8394, 1000, 1000],
    ["h5d", "La Guerita Doble", "hamburguesas", 25000, 11838, 1000, 2000],
    ["h5t", "La Guerita Triple", "hamburguesas", 33000, 14700, 1000, 1000],
    ["s1", "Rapi Gosa", "salchipapas", 14500, 4810, 1000, 500],
    ["s2", "Salchi Gosa", "salchipapas", 17000, 7285, 500, 500],
    ["s3", "Salchi Bucara", "salchipapas", 18000, "", "", ""],
    ["s4", "La Gosa Supreme", "salchipapas", 31000, 12249, 1200, 500],
    ["pl1", "Gosa Pinchudo", "platos", 12000, "", "", ""],
    ["pl2", "Gosa Dorada", "platos", 24000, "", "", ""],
    ["pl3", "Gosa Pork", "platos", 24000, "", "", ""],
    ["pl4", "Gosa Bravio", "platos", 25500, "", "", ""],
    ["pl5", "Gosa Gatrine", "platos", 27000, "", "", ""],
    ["pl6", "Gosa Gacuho", "platos", 28500, "", "", ""],
    ["a1", "Chimichurri", "adicionales", 3000, "", "", ""],
    ["a2", "Queso Doble Crema", "adicionales", 2500, "", "", ""],
    ["a3", "Tocineta", "adicionales", 3500, 387, 0, ""],
    ["a4", "Queso Cheddar", "adicionales", 4000, 1000, 0, ""],
    ["a5", "Chicharrón", "adicionales", 5000, 1376, 0, ""],
    ["a6", "Salchicha Americana", "adicionales", 5000, 1800, "", ""],
    ["a7", "Chorizo", "adicionales", 5500, 1500, 600, ""],
    ["a8", "Carne de Hamburguesa", "adicionales", 6500, 2300, 500, ""],
    ["a9", "Porción de Papa", "adicionales", 7000, 1600, 400, ""],
    ["be1", "Coca Cola 250 ml", "bebidas", 3500, 1650, 0, ""],
    ["be2", "Coca Cola 400 ml", "bebidas", 5000, 2500, 0, ""],
    ["be3", "Coca Cola 0 400 ml", "bebidas", 4600, 2500, 0, ""],
    ["be4", "Coca Cola 1.5 L", "bebidas", 9500, 0, 0, ""],
    ["be5", "Coca Cola 0 1.5 L", "bebidas", 9000, 0, 0, ""],
    ["be6", "Quatro 400 ml", "bebidas", 5000, 2000, 0, ""],
    ["be7", "Quatro 1.5 L", "bebidas", 8500, 1166, 0, ""],
    ["be8", "Jugo Hit 500 ml", "bebidas", 4200, 2350, 0, ""],
    ["be9", "Agua", "bebidas", 3000, 900, 0, ""],
    ["be10", "Corona", "bebidas", 7500, 0, 0, ""],
    ["be11", "Coronita", "bebidas", 6000, 0, 0, ""],
    ["be12", "Agua del día", "bebidas", 2000, 200, 0, ""]
  ];
  // </GENERADO:CATALOGO>

  // Ejecutar UNA VEZ a mano (Ejecutar > configurarHojas) para crear las pestañas y autorizar permisos.
  function configurarHojas() {
    var creadas = asegurarHojas();
    var msg = creadas.length ? 'Hojas creadas: ' + creadas.join(', ') : 'Las hojas ya existían; no se cambió nada.';
    Logger.log(msg);
    return msg;
  }

  // Ejecutar a mano (Ejecutar > completarCostos) cuando la hoja Productos ya existe con costos vacios.
  // Rellena Costo, GastoOperativo y Sueldos desde CATALOGO_INICIAL (por ID) SOLO donde la celda esta vacia:
  // nunca pisa un valor que ya este escrito. Se puede ejecutar varias veces sin riesgo.
  function completarCostos() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');
    if (!sheet) return 'No existe la hoja Productos. Ejecuta configurarHojas primero.';
    var porId = {};
    CATALOGO_INICIAL.forEach(function(p) { porId[String(p[0])] = p; });

    var data = sheet.getDataRange().getValues();
    var completados = 0;
    var sinCosto = [];
    for (var i = 1; i < data.length; i++) {
      var p = porId[String(data[i][0]).trim()];
      if (!p) continue; // producto agregado a mano: no se toca
      var cambio = false;
      // [columna en la hoja (0 = A), posicion del dato en CATALOGO_INICIAL]
      [[4, 4], [5, 5], [7, 6]].forEach(function(par) {
        var celda = data[i][par[0]];
        var valor = p[par[1]];
        if ((celda === '' || celda === null) && valor !== '') {
          sheet.getRange(i + 1, par[0] + 1).setValue(valor);
          cambio = true;
        }
      });
      if (cambio) completados++;
      var costoFinal = (data[i][4] === '' || data[i][4] === null) ? p[4] : data[i][4];
      if (costoFinal === '') sinCosto.push(String(data[i][1]).trim());
    }
    var msg = 'Costos completados en ' + completados + ' productos.' +
      (sinCosto.length ? ' Sin costo (llenar a mano): ' + sinCosto.join(', ') + '.' : ' Todos los productos tienen costo.');
    Logger.log(msg);
    return msg;
  }

  // Crea las pestañas que falten (con encabezados; Productos con la carta y los costos que se tengan). Devuelve las creadas.
  function asegurarHojas() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var faltan = Object.keys(HOJAS).filter(function(n) { return !ss.getSheetByName(n); });
    if (faltan.length === 0) return [];

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    var creadas = [];
    try {
      faltan.forEach(function(nombre) {
        if (ss.getSheetByName(nombre)) return; // otra petición la creó mientras esperábamos el bloqueo
        var sheet = ss.insertSheet(nombre);
        var enc = HOJAS[nombre];
        sheet.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
        sheet.setFrozenRows(1);
        if (nombre === 'Pedidos') {
          sheet.getRange('B:C').setNumberFormat('@'); // fecha y hora se guardan como texto
        } else if (nombre === 'Productos') {
          var filas = CATALOGO_INICIAL.map(function(p) { return [p[0], p[1], p[2], p[3], p[4], p[5], true, p[6]]; });
          if (filas.length) sheet.getRange(2, 1, filas.length, enc.length).setValues(filas);
          sheet.autoResizeColumns(1, enc.length);
        }
        creadas.push(nombre);
      });
      // Quitar la hoja vacía que Google crea por defecto ("Hoja 1" / "Sheet1")
      ss.getSheets().forEach(function(h) {
        var n = h.getName();
        if ((n === 'Hoja 1' || n === 'Hoja1' || n === 'Sheet1') && h.getLastRow() === 0 && h.getLastColumn() === 0 && ss.getSheets().length > 1) {
          ss.deleteSheet(h);
        }
      });
    } finally {
      lock.releaseLock();
    }
    return creadas;
  }
                                                                                                                                                                                                                                                          
  function doGet(e) {
    var result;
    var callback = e.parameter.callback;

    try {
      asegurarHojas(); // crea Pedidos, Productos y Sueldos si faltan
      if (e.parameter.payload) {
        var data = JSON.parse(e.parameter.payload);

        if (data.action === 'nuevoPedido') {
          result = crearPedido(data.items, data.total, data.notas || '');
        } else if (data.action === 'actualizarEstado') {
          result = actualizarEstado(data.id, data.estado, data.metodoPago);
        } else if (data.action === 'actualizarPedido') {
          result = actualizarPedido(data.id, data.items, data.total, data.notas);
        } else if (data.action === 'registrarCliente') {
          result = registrarCliente(data.id, data.nombre, data.telefono);
        } else if (data.action === 'agregarSello') {
          result = agregarSello(data.id);
        } else if (data.action === 'quitarSello') {
          result = quitarSello(data.id);
        } else if (data.action === 'canjearPremio') {
          result = canjearPremio(data.id);
        } else if (data.action === 'descontarConsumo') {
          result = descontarConsumo(data.fecha);
        } else if (data.action === 'reponerIngrediente') {
          result = reponerIngrediente(data.id, Number(data.cantidad));
        } else if (data.action === 'registrarSueldo') {
          result = registrarSueldo(data.fecha, data.nombre, data.valor, data.nota, data.linea);
        } else if (data.action === 'eliminarSueldo') {
          result = eliminarSueldo(data.id);
        } else if (data.action === 'eliminarPedido') {
          result = eliminarPedido(data.id);
        } else {
          result = { error: 'Accion POST no valida' };
        }
      } else {
        var action = e.parameter.action;

        if (action === 'getPendientes') {
          result = getPedidosPorEstado(['pendiente', 'preparando']);
        } else if (action === 'getTodos') {
          result = getTodosPedidos();
        } else if (action === 'getHoy') {
          result = getPedidosHoy();
        } else if (action === 'getPorFecha') {
          result = getPedidosPorFecha(e.parameter.fecha);
        } else if (action === 'getResumen') {
          result = getResumenDia(e.parameter.fecha);
        } else if (action === 'getResumenMes') {
          result = getResumenMes(e.parameter.mes);
        } else if (action === 'getResumenMesCompleto') {
          result = getResumenMesCompleto(e.parameter.mes);
        } else if (action === 'getProductos') {
          result = getProductos();
        } else if (action === 'getCliente') {
          result = getClienteClientes(e.parameter.id);
        } else if (action === 'buscarClientes') {
          result = buscarClientesClientes(e.parameter.query);
        } else if (action === 'getInventario') {
          result = getInventario();
        } else if (action === 'inicializarInventario') {
          result = inicializarInventario();
        } else if (action === 'getSueldosFecha') {
          result = getSueldosPorFecha(e.parameter.fecha);
        } else if (action === 'getSueldosMes') {
          result = getSueldosMes(e.parameter.mes);
        } else if (action === 'getEmpleados') {
          result = getEmpleados();
        } else {
          result = { error: 'Accion no valida' };
        }
      }
    } catch(error) {
      result = { error: error.toString() };
    }

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function formatearFechaCell(valor) {
    if (!valor) return '';

    if (valor instanceof Date) {
      var año = valor.getFullYear();
      var mes = ('0' + (valor.getMonth() + 1)).slice(-2);
      var dia = ('0' + valor.getDate()).slice(-2);
      return año + '-' + mes + '-' + dia;
    }

    var str = String(valor);

    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return str;
    }

    if (str.indexOf('GMT') > -1 || str.indexOf('Jan') > -1 || str.indexOf('Feb') > -1) {
      try {
        var d = new Date(str);
        var año = d.getFullYear();
        var mes = ('0' + (d.getMonth() + 1)).slice(-2);
        var dia = ('0' + d.getDate()).slice(-2);
        return año + '-' + mes + '-' + dia;
      } catch(e) {
        return str.substring(0, 10);
      }
    }

    return str;
  }

  function formatearHoraCell(valor) {
    if (!valor) return '';

    if (valor instanceof Date) {
      var horas = ('0' + valor.getHours()).slice(-2);
      var mins = ('0' + valor.getMinutes()).slice(-2);
      var segs = ('0' + valor.getSeconds()).slice(-2);
      return horas + ':' + mins + ':' + segs;
    }

    var str = String(valor);

    if (str.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return str;
    }

    if (str.indexOf('GMT') > -1) {
      try {
        var d = new Date(str);
        var horas = ('0' + d.getHours()).slice(-2);
        var mins = ('0' + d.getMinutes()).slice(-2);
        var segs = ('0' + d.getSeconds()).slice(-2);
        return horas + ':' + mins + ':' + segs;
      } catch(e) {
        return '00:00:00';
      }
    }

    return str;
  }

  function crearPedido(items, total, notas) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var lastRow = sheet.getLastRow();
    var nuevoId = 1;

    if (lastRow > 1) {
      nuevoId = parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
    }

    var ahora = new Date();
    var fecha = Utilities.formatDate(ahora, 'America/Bogota', 'yyyy-MM-dd');
    var hora = Utilities.formatDate(ahora, 'America/Bogota', 'HH:mm:ss');

    sheet.appendRow([nuevoId, fecha, hora, JSON.stringify(items), total, 'pendiente', notas]);

    return { success: true, id: nuevoId, mensaje: 'Pedido #' + nuevoId + ' creado' };
  }

  function actualizarEstado(id, nuevoEstado, metodoPago) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, 6).setValue(nuevoEstado);
        // Columna 8 = MetodoPago (efectivo | qr | tarjeta), solo si se envía
        if (metodoPago) {
          sheet.getRange(i + 1, 8).setValue(String(metodoPago).toLowerCase());
        }
        return { success: true, mensaje: 'Pedido #' + id + ' actualizado' };
      }
    }
    return { error: 'Pedido no encontrado' };
  }

  function eliminarPedido(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return { error: 'Hoja Pedidos no encontrada' };
    var data = sheet.getDataRange().getValues();
    var idStr = String(id).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idStr) {
        sheet.deleteRow(i + 1);
        return { success: true, mensaje: 'Pedido #' + id + ' eliminado' };
      }
    }

    return { error: 'Pedido no encontrado' };
  }

  function actualizarPedido(id, items, total, notas) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, 4).setValue(JSON.stringify(items));
        sheet.getRange(i + 1, 5).setValue(total);
        if (notas !== undefined) {
          sheet.getRange(i + 1, 7).setValue(notas);
        }
        return { success: true, mensaje: 'Pedido #' + id + ' actualizado' };
      }
    }
    return { error: 'Pedido no encontrado' };
  }

  function getPedidosPorEstado(estados) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var pedidos = [];

    for (var i = 1; i < data.length; i++) {
      var estado = String(data[i][5]).trim().toLowerCase();

      if (estados.indexOf(estado) > -1) {
        pedidos.push({
          id: data[i][0],
          fecha: formatearFechaCell(data[i][1]),
          hora: formatearHoraCell(data[i][2]),
          items: JSON.parse(data[i][3]),
          total: data[i][4],
          estado: estado,
          notas: data[i][6] || '',
          metodoPago: String(data[i][7] || '')
        });
      }
    }
    return { pedidos: pedidos };
  }

  function getPedidosHoy() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var pedidos = [];

    // Obtener fecha de hoy en formato YYYY-MM-DD
    var ahora = new Date();
    var hoy = Utilities.formatDate(ahora, 'America/Bogota', 'yyyy-MM-dd');

    for (var i = 1; i < data.length; i++) {
      var fechaPedido = formatearFechaCell(data[i][1]);

      if (fechaPedido === hoy) {
        var itemsRaw = data[i][3];
        if (!itemsRaw) continue;
        var items;
        try { items = JSON.parse(itemsRaw); } catch(e) { continue; }
        pedidos.push({
          id: data[i][0],
          fecha: fechaPedido,
          hora: formatearHoraCell(data[i][2]),
          items: items,
          total: Number(data[i][4]) || 0,
          estado: String(data[i][5]).trim().toLowerCase(),
          notas: data[i][6] || '',
          metodoPago: String(data[i][7] || '')
        });
      }
    }
    return { pedidos: pedidos };
  }

  function getPedidosPorFecha(fecha) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var pedidos = [];

    for (var i = 1; i < data.length; i++) {
      var fechaPedido = formatearFechaCell(data[i][1]);
      if (fechaPedido !== fecha) continue;
      var itemsRaw = data[i][3];
      if (!itemsRaw) continue;
      var items;
      try { items = JSON.parse(itemsRaw); } catch(e) { continue; }
      pedidos.push({
        id: data[i][0],
        fecha: fechaPedido,
        hora: formatearHoraCell(data[i][2]),
        items: items,
        total: Number(data[i][4]) || 0,
        estado: String(data[i][5]).trim().toLowerCase(),
        notas: data[i][6] || '',
          metodoPago: String(data[i][7] || '')
      });
    }
    return { pedidos: pedidos };
  }

  function getTodosPedidos() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var pedidos = [];

    for (var i = 1; i < data.length; i++) {
      pedidos.push({
        id: data[i][0],
        fecha: formatearFechaCell(data[i][1]),
        hora: formatearHoraCell(data[i][2]),
        items: JSON.parse(data[i][3]),
        total: data[i][4],
        estado: String(data[i][5]).trim().toLowerCase(),
        notas: data[i][6] || '',
          metodoPago: String(data[i][7] || '')
      });
    }
    return { pedidos: pedidos };
  }

  function getProductos() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');
    if (!sheet) return { error: 'Hoja Productos no encontrada. Columnas requeridas: ID, Nombre, Categoria, PrecioVenta, Costo, GastoOperativo, Activo' };

    var data = sheet.getDataRange().getValues();
    var productos = [];

    for (var i = 1; i < data.length; i++) {
      var activo = data[i][6];
      if (activo === false || String(activo).toUpperCase() === 'FALSE' || activo === 0) continue;

      productos.push({
        id: String(data[i][0]),
        nombre: String(data[i][1]),
        categoria: String(data[i][2]),
        precio: Number(data[i][3]) || 0,
        costo: Number(data[i][4]) || 0,
        gastoOperativo: Number(data[i][5]) || 0
      });
    }
    return { productos: productos };
  }

  function getResumenDia(fecha) {
    var sheetPedidos   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var sheetProductos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');

    // Lookup: nombre → {costos} y nombre → linea ('gosa'|'ahumados')
    var costosPorNombre = {};
    var lineaPorNombre  = {};
    if (sheetProductos) {
      var prodRows = sheetProductos.getDataRange().getValues();
      for (var k = 1; k < prodRows.length; k++) {
        var prodId    = String(prodRows[k][0]).trim().toLowerCase();
        var nomProd   = String(prodRows[k][1]).trim().toUpperCase();
        costosPorNombre[nomProd] = {
          precioVenta:    Number(prodRows[k][3]) || 0,
          costo:          Number(prodRows[k][4]) || 0,
          gastoOperativo: Number(prodRows[k][5]) || 0,
          sueldos:        Number(prodRows[k][7]) || 0
        };
        lineaPorNombre[nomProd] = IDS_AHUMADOS.indexOf(prodId) > -1 ? 'ahumados' : 'gosa';
      }
    }

    function getCostoInfo(nombreKey) {
      var info = costosPorNombre[nombreKey];
      if (!info && nombreKey.indexOf(':') > -1) {
        var partes     = nombreKey.split(':');
        var nombreBase = partes[0].trim();
        var composicion = partes[1] ? partes[1].trim() : '';
        if (nombreBase.indexOf('COMBO DEL MES') > -1 && composicion) {
          var subs = composicion.split('+');
          var cc = 0, gc = 0;
          for (var m = 0; m < subs.length; m++) {
            var si = costosPorNombre[subs[m].trim().toUpperCase()] || { costo: 0, gastoOperativo: 0 };
            cc += si.costo; gc += si.gastoOperativo;
          }
          return { costo: cc, gastoOperativo: gc, precioVenta: 0 };
        }
        info = costosPorNombre[nombreBase];
      }
      return info || { costo: 0, gastoOperativo: 0, precioVenta: 0 };
    }

    function getLinea(nombreKey) {
      if (lineaPorNombre[nombreKey]) return lineaPorNombre[nombreKey];
      if (nombreKey.indexOf(':') > -1) {
        var base = nombreKey.split(':')[0].trim();
        if (lineaPorNombre[base]) return lineaPorNombre[base];
      }
      return 'gosa';
    }

    // Acumuladores por línea
    var acc = {
      gosa:     { v: 0, c: 0, g: 0, s: 0, prods: {} },
      ahumados: { v: 0, c: 0, g: 0, s: 0, prods: {} }
    };
    var totalVentas = 0, totalCosto = 0, totalGastoOp = 0, totalSueldos = 0, cantidadPedidos = 0;

    var data = sheetPedidos.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var fechaPedido = formatearFechaCell(data[i][1]);
      var estado      = String(data[i][5]).trim().toLowerCase();
      if (fechaPedido !== fecha || estado === 'cancelado') continue;

      cantidadPedidos++;
      totalVentas += Number(data[i][4]) || 0;

      var itemsRaw = data[i][3];
      if (!itemsRaw) continue;
      var items;
      try { items = JSON.parse(itemsRaw); } catch(e) { continue; }

      for (var j = 0; j < items.length; j++) {
        var item      = items[j];
        var nKey      = String(item.nombre).trim().toUpperCase();
        var info      = getCostoInfo(nKey);
        var linea     = getLinea(nKey);
        var cant      = Number(item.cantidad) || 0;
        var precio    = Number(item.precio) || (info.precioVenta || 0);
        var ingreso   = precio * cant;
        var costo     = info.costo * cant;
        var gasto     = info.gastoOperativo * cant;
        var sueldo    = info.sueldos * cant;

        totalCosto    += costo;
        totalGastoOp  += gasto;
        totalSueldos  += sueldo;

        var bucket = acc[linea];
        bucket.v += ingreso;
        bucket.c += costo;
        bucket.g += gasto;
        bucket.s += sueldo;

        if (!bucket.prods[item.nombre]) {
          bucket.prods[item.nombre] = { nombre: item.nombre, cantidad: 0, ingreso: 0, costo: 0, gastoOperativo: 0 };
        }
        bucket.prods[item.nombre].cantidad     += cant;
        bucket.prods[item.nombre].ingreso      += ingreso;
        bucket.prods[item.nombre].costo        += costo;
        bucket.prods[item.nombre].gastoOperativo += gasto;
      }
    }

    function buildLinea(bucket) {
      var prods = [];
      for (var n in bucket.prods) {
        var p = bucket.prods[n];
        p.gananciaNeta = p.ingreso - p.costo;
        prods.push(p);
      }
      prods.sort(function(a, b) { return b.cantidad - a.cantidad; });
      return {
        totalVentas:    bucket.v,
        totalCosto:     bucket.c,
        totalGastoOp:   bucket.g,
        totalSueldos:   bucket.s,
        gananciaNeta:   bucket.v - bucket.c,
        productos:      prods
      };
    }

    // Productos totales (gosa + ahumados)
    var allProds = {};
    function mergeProds(bucket) {
      for (var n in bucket.prods) {
        if (!allProds[n]) allProds[n] = { nombre: n, cantidad: 0, ingreso: 0, costo: 0, gastoOperativo: 0 };
        allProds[n].cantidad       += bucket.prods[n].cantidad;
        allProds[n].ingreso        += bucket.prods[n].ingreso;
        allProds[n].costo          += bucket.prods[n].costo;
        allProds[n].gastoOperativo += bucket.prods[n].gastoOperativo;
      }
    }
    mergeProds(acc.gosa);
    mergeProds(acc.ahumados);
    var totalProds = [];
    for (var nn in allProds) {
      var tp = allProds[nn];
      tp.gananciaNeta = tp.ingreso - tp.costo;
      totalProds.push(tp);
    }
    totalProds.sort(function(a, b) { return b.cantidad - a.cantidad; });

    return {
      fecha:           fecha,
      cantidadPedidos: cantidadPedidos,
      ticketPromedio:  cantidadPedidos > 0 ? Math.round(totalVentas / cantidadPedidos) : 0,
      gosa:            buildLinea(acc.gosa),
      ahumados:        buildLinea(acc.ahumados),
      total: {
        totalVentas:  totalVentas,
        totalCosto:   totalCosto,
        totalGastoOp: totalGastoOp,
        totalSueldos: totalSueldos,
        gananciaNeta: totalVentas - totalCosto,
        productos:    totalProds
      }
    };
  }

  // ══════════════════════════════════════════
  // CLIENTES FRECUENTES — hoja "Clientes"
  // Columnas: ID | Nombre | Teléfono | Sellos | Canjes | FechaRegistro | UltimoSello
  // ══════════════════════════════════════════

  function registrarCliente(id, nombre, telefono) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
    if (!sheet) return { error: 'Hoja Clientes no encontrada. Crea una hoja llamada "Clientes".' };
    var ahora = new Date();
    var fecha = Utilities.formatDate(ahora, 'America/Bogota', 'yyyy-MM-dd');
    sheet.appendRow([id, nombre, telefono || '', 0, 0, fecha, '']);
    return { success: true, id: id };
  }

  function getClienteClientes(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
    if (!sheet) return { error: 'Hoja Clientes no encontrada' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        return {
          cliente: {
            id: String(data[i][0]),
            nombre: String(data[i][1]),
            telefono: String(data[i][2]),
            sellos: Number(data[i][3]) || 0,
            canjes: Number(data[i][4]) || 0,
            fechaRegistro: String(data[i][5]),
            ultimoSello: String(data[i][6])
          }
        };
      }
    }
    return { error: 'Cliente no encontrado' };
  }

  function buscarClientesClientes(query) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
    if (!sheet) return { clientes: [] };
    var data = sheet.getDataRange().getValues();
    var clientes = [];
    var q = String(query || '').trim().toUpperCase();
    if (q.length < 2) return { clientes: [] };
    for (var i = 1; i < data.length; i++) {
      var rowId = String(data[i][0]).toUpperCase();
      var rowNombre = String(data[i][1]).toUpperCase();
      if (rowId.indexOf(q) > -1 || rowNombre.indexOf(q) > -1) {
        clientes.push({
          id: String(data[i][0]),
          nombre: String(data[i][1]),
          telefono: String(data[i][2]),
          sellos: Number(data[i][3]) || 0,
          canjes: Number(data[i][4]) || 0
        });
      }
    }
    return { clientes: clientes.slice(0, 8) };
  }

  function agregarSello(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
    if (!sheet) return { error: 'Hoja Clientes no encontrada' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        var sellos = Number(data[i][3]) || 0;
        var ahora = new Date();
        var fecha = Utilities.formatDate(ahora, 'America/Bogota', 'yyyy-MM-dd');
        sheet.getRange(i + 1, 4).setValue(sellos + 1);
        sheet.getRange(i + 1, 7).setValue(fecha);
        return { success: true, sellos: sellos + 1 };
      }
    }
    return { error: 'Cliente no encontrado' };
  }

  function quitarSello(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
    if (!sheet) return { error: 'Hoja Clientes no encontrada' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        var sellos = Number(data[i][3]) || 0;
        if (sellos <= 0) return { error: 'No hay sellos que quitar' };
        sheet.getRange(i + 1, 4).setValue(sellos - 1);
        return { success: true, sellos: sellos - 1 };
      }
    }
    return { error: 'Cliente no encontrado' };
  }

  function canjearPremio(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
    if (!sheet) return { error: 'Hoja Clientes no encontrada' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        var sellos = Number(data[i][3]) || 0;
        if (sellos < 6) return { error: 'No tiene suficientes sellos' };
        var canjes = Number(data[i][4]) || 0;
        sheet.getRange(i + 1, 4).setValue(0);
        sheet.getRange(i + 1, 5).setValue(canjes + 1);
        return { success: true, canjes: canjes + 1 };
      }
    }
    return { error: 'Cliente no encontrado' };
  }

  // ══════════════════════════════════════════
  // INVENTARIO — hojas "Ingredientes" y "Recetas"
  // Ingredientes: ID | Nombre | Unidad | StockActual | StockMinimo
  // Recetas: Producto | IngredienteID | Cantidad
  // ══════════════════════════════════════════

  // Recetas hardcodeadas (usadas si no existe la hoja "Recetas")
  var RECETAS_DEFAULT = {
    'ARITOS GOSA':          { 'ING01': 6 },
    'BACON GOSA':           { 'ING02': 1, 'ING03': 1 },
    'TENDER GOSA':          { 'ING04': 3 },
    'PERRO RANCHERO':       { 'ING05': 1, 'ING03': 1, 'ING06': 1, 'ING07': 1 },
    'CHORI GOSA':           { 'ING05': 1, 'ING06': 2, 'ING03': 1, 'ING08': 1 },
    'TROPICAL GOSA':        { 'ING05': 1, 'ING03': 1, 'ING06': 1, 'ING09': 1 },
    'TEXAS BBQ':            { 'ING05': 1, 'ING03': 1, 'ING07': 1, 'ING06': 1, 'ING10': 1 },
    'TRIPLE GOSA':          { 'ING05': 1, 'ING03': 1, 'ING07': 1, 'ING06': 1, 'ING11': 1, 'ING08': 0.5 },
    'GOSA BURGUER':         { 'ING12': 1, 'ING13': 1, 'ING14': 1, 'ING06': 1 },
    'GOSA BURGUER DOBLE':   { 'ING12': 1, 'ING13': 1, 'ING14': 2, 'ING06': 2 },
    'CRISPY GOSA':          { 'ING12': 1, 'ING03': 1, 'ING14': 1, 'ING06': 1 },
    'CRISPY GOSA DOBLE':    { 'ING12': 1, 'ING03': 1, 'ING14': 2, 'ING06': 2 },
    'GOSA BALSAMICA':       { 'ING12': 1, 'ING14': 1, 'ING06': 1 },
    'GOSA BALSAMICA DOBLE': { 'ING12': 1, 'ING14': 2, 'ING06': 2 },
    'MADURITA':             { 'ING12': 1, 'ING14': 1, 'ING06': 1, 'ING08': 0.5 },
    'MADURITA DOBLE':       { 'ING12': 1, 'ING14': 1, 'ING06': 2, 'ING08': 0.5 },
    'RAPI GOSA':            { 'ING02': 2, 'ING15': 2 },
    'SALCHI GOSA':          { 'ING02': 2, 'ING15': 1, 'ING08': 0.5, 'ING11': 1 },
    'LA GOSA SUPREME':      { 'ING02': 3, 'ING16': 1, 'ING08': 0.5, 'ING15': 2, 'ING06': 1, 'ING13': 1, 'ING10': 1 },
    'SALCHICHA':            { 'ING07': 1 },
    'TOCINETA':             { 'ING03': 1 },
    'CHORIZO':              { 'ING08': 1 },
    'CARNE DE HAMBURGUESA': { 'ING14': 1 },
    'CHICHARRON':           { 'ING11': 1 },
    'PORCION DE PAPA':      { 'ING02': 1 },
    'PORCION DE PAPA (COMBO)': { 'ING02': 1 },
    'EL COMBO COMPLETO':    { 'ING02': 1 },
    'TOTOPOS GOSA':         { 'ING18': 1 },
    'ALFA PRETZEL':         { 'ING17': 1, 'ING14': 1, 'ING18': 1, 'ING06': 1, 'ING01': 3, 'ING03': 1 },
    'ALFA PRETZEL DOBLE':   { 'ING17': 1, 'ING14': 2, 'ING18': 2, 'ING06': 2, 'ING01': 3, 'ING03': 1 },
    'COLBY BACON':          { 'ING22': 1, 'ING21': 1, 'ING13': 1, 'ING14': 1 },
    'COLBY BACON DOBLE':    { 'ING22': 1, 'ING21': 2, 'ING13': 2, 'ING14': 2 },
    'MENU INFANTIL HAMBURGUESA': { 'ING19': 1, 'ING14': 1, 'ING06': 1, 'ING03': 0.5, 'ING02': 1 },
    'MENU INFANTIL NUGGETS':     { 'ING20': 6, 'ING02': 1 }
  };

  function inicializarInventario() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Ingredientes');

    if (sheet && sheet.getLastRow() > 1) {
      return { error: 'La hoja Ingredientes ya existe y tiene datos. Bórrala primero si quieres reiniciarla.' };
    }

    if (!sheet) {
      sheet = ss.insertSheet('Ingredientes');
    } else {
      sheet.clearContents();
    }

    var datos = [
      ['ID',    'Nombre',              'Unidad',  'StockActual', 'StockMinimo'],
      ['ING01', 'Aro de cebolla',      'unidad',   0, 60],
      ['ING02', 'Porción de papa',     'porción',  0, 40],
      ['ING03', 'Tocineta',            'unidad',   0, 40],
      ['ING04', 'Tira de pollo',       'unidad',   0, 30],
      ['ING05', 'Pan perro caliente',  'unidad',   0, 40],
      ['ING06', 'Queso doble crema',   'porción',  0, 50],
      ['ING07', 'Salchicha yankee',    'unidad',   0, 40],
      ['ING08', 'Chorizo',             'unidad',   0, 20],
      ['ING09', 'Porción de piña',     'porción',  0, 15],
      ['ING10', 'Carne desmechada',    'porción',  0, 20],
      ['ING11', 'Chicharrón',          'porción',  0, 20],
      ['ING12', 'Pan hamburguesa',     'unidad',   0, 30],
      ['ING13', 'Huevo',               'unidad',   0, 20],
      ['ING14', 'Carne hamburguesa',   'porción',  0, 30],
      ['ING15', 'Salchicha ranchera',  'unidad',   0, 40],
      ['ING16', 'Porción de maíz',     'porción',  0, 15],
      ['ING17', 'Pan de pretzel',      'unidad',   0, 20],
      ['ING18', 'Queso amarillo',      'unidad',   0, 20],
      ['ING19', 'Pan pequeño',         'unidad',   0, 10],
      ['ING20', 'Nuggets',             'unidad',   0, 10],
      ['ING21', 'Queso colby',         'unidad',   0, 20],
      ['ING22', 'Pan pretzel colby',   'unidad',   0, 20]
    ];

    sheet.getRange(1, 1, datos.length, 5).setValues(datos);

    // Formato encabezado
    var header = sheet.getRange(1, 1, 1, 5);
    header.setFontWeight('bold');
    header.setBackground('#1a1a1a');
    header.setFontColor('#FFD700');

    // Ancho de columnas
    sheet.setColumnWidth(1, 70);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 90);
    sheet.setColumnWidth(4, 110);
    sheet.setColumnWidth(5, 110);

    return { success: true, mensaje: 'Hoja Ingredientes creada con ' + (datos.length - 1) + ' ingredientes.' };
  }

  function getInventario() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ingredientes');
    if (!sheet) return { error: 'Hoja Ingredientes no encontrada. Crea una hoja llamada "Ingredientes" con columnas: ID | Nombre | Unidad | StockActual | StockMinimo' };
    var data = sheet.getDataRange().getValues();
    var ingredientes = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      ingredientes.push({
        id:     String(data[i][0]).trim(),
        nombre: String(data[i][1]).trim(),
        unidad: String(data[i][2]).trim(),
        stock:  Number(data[i][3]) || 0,
        minimo: Number(data[i][4]) || 0
      });
    }
    return { ingredientes: ingredientes };
  }

  function descontarConsumo(fecha) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetPedidos = ss.getSheetByName(SHEET_NAME);
    var sheetIng     = ss.getSheetByName('Ingredientes');
    var sheetRecetas = ss.getSheetByName('Recetas');

    if (!sheetIng) return { error: 'Hoja Ingredientes no encontrada' };

    // Construir mapa de recetas: { 'NOMBRE UPPERCASE': { 'INGID': cantidad } }
    var recetas = {};
    if (sheetRecetas) {
      var recData = sheetRecetas.getDataRange().getValues();
      for (var i = 1; i < recData.length; i++) {
        var prod  = String(recData[i][0]).trim().toUpperCase();
        var ingId = String(recData[i][1]).trim().toUpperCase();
        var cant  = Number(recData[i][2]) || 0;
        if (!recetas[prod]) recetas[prod] = {};
        recetas[prod][ingId] = (recetas[prod][ingId] || 0) + cant;
      }
    } else {
      recetas = RECETAS_DEFAULT;
    }

    // Calcular consumo por ingrediente sumando todos los pedidos del día (excepto cancelados)
    var pedidosData = sheetPedidos.getDataRange().getValues();
    var consumo = {};

    for (var i = 1; i < pedidosData.length; i++) {
      var fechaPedido = formatearFechaCell(pedidosData[i][1]);
      var estado = String(pedidosData[i][5]).trim().toLowerCase();
      if (fechaPedido !== fecha || estado === 'cancelado') continue;

      var items = JSON.parse(pedidosData[i][3]);
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var nombreKey = String(item.nombre).trim().toUpperCase();

        // Manejar formato "Combo del Mes: ProdA + ProdB"
        var baseKey = nombreKey;
        if (nombreKey.indexOf(':') > -1) {
          baseKey = nombreKey.split(':')[0].trim().toUpperCase();
        }

        var receta = recetas[nombreKey] || recetas[baseKey];
        if (!receta) continue;

        for (var ingId in receta) {
          consumo[ingId] = (consumo[ingId] || 0) + receta[ingId] * item.cantidad;
        }
      }
    }

    // Leer ingredientes y aplicar descuentos en batch
    var ingData  = sheetIng.getDataRange().getValues();
    var descuentos = [];
    var rangesToUpdate = [];

    for (var i = 1; i < ingData.length; i++) {
      if (!ingData[i][0]) continue;
      var ingId = String(ingData[i][0]).trim().toUpperCase();
      if (consumo[ingId] === undefined) continue;

      var stockActual = Number(ingData[i][3]) || 0;
      var nuevoStock  = stockActual - consumo[ingId];
      rangesToUpdate.push({ row: i + 1, valor: nuevoStock });
      descuentos.push({
        id:         ingId,
        nombre:     String(ingData[i][1]).trim(),
        unidad:     String(ingData[i][2]).trim(),
        consumido:  consumo[ingId],
        stockAntes: stockActual,
        stockAhora: nuevoStock,
        minimo:     Number(ingData[i][4]) || 0
      });
    }

    // Escribir todos los cambios
    for (var k = 0; k < rangesToUpdate.length; k++) {
      sheetIng.getRange(rangesToUpdate[k].row, 4).setValue(rangesToUpdate[k].valor);
    }

    return { success: true, fecha: fecha, descuentos: descuentos };
  }

  function getResumenMes(mes) {
    // mes = 'YYYY-MM'
    var sheetPedidos  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var sheetProductos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');

    var costosPorNombre = {};
    if (sheetProductos) {
      var prodRows = sheetProductos.getDataRange().getValues();
      for (var k = 1; k < prodRows.length; k++) {
        var nombreProd = String(prodRows[k][1]).trim().toUpperCase();
        costosPorNombre[nombreProd] = {
          precioVenta:    Number(prodRows[k][3]) || 0,
          costo:          Number(prodRows[k][4]) || 0,
          gastoOperativo: Number(prodRows[k][5]) || 0,
          sueldos:        Number(prodRows[k][7]) || 0
        };
      }
    }

    var data = sheetPedidos.getDataRange().getValues();
    var totalVentas = 0, totalCosto = 0, totalGastoOp = 0, cantidadPedidos = 0;
    var productosCantidad = {}, productosIngreso = {}, productosCosto = {}, productosGastoOp = {};
    var porDia = {};

    for (var i = 1; i < data.length; i++) {
      var fechaPedido = formatearFechaCell(data[i][1]);
      var estado = String(data[i][5]).trim().toLowerCase();
      if (!fechaPedido || fechaPedido.indexOf(mes) !== 0 || estado === 'cancelado') continue;

      cantidadPedidos++;
      var ventaPedido = Number(data[i][4]) || 0;
      totalVentas += ventaPedido;
      var costoPedido = 0;

      var itemsRawMes = data[i][3];
      if (!itemsRawMes) continue;
      var items;
      try { items = JSON.parse(itemsRawMes); } catch(e) { continue; }
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var nombreKey = String(item.nombre).trim().toUpperCase();

        var info = costosPorNombre[nombreKey];
        if (!info && nombreKey.indexOf(':') > -1) {
          var partes     = nombreKey.split(':');
          var nombreBase = partes[0].trim();
          var composicion = partes[1] ? partes[1].trim() : '';
          if (nombreBase.indexOf('COMBO DEL MES') > -1 && composicion) {
            var subProductos = composicion.split('+');
            var costoCombo = 0, gastoCombo = 0;
            for (var m = 0; m < subProductos.length; m++) {
              var subKey  = subProductos[m].trim().toUpperCase();
              var subInfo = costosPorNombre[subKey] || { costo: 0, gastoOperativo: 0 };
              costoCombo += subInfo.costo;
              gastoCombo += subInfo.gastoOperativo;
            }
            info = { costo: costoCombo, gastoOperativo: gastoCombo };
          } else {
            info = costosPorNombre[nombreBase] || { costo: 0, gastoOperativo: 0 };
          }
        }
        if (!info) info = { costo: 0, gastoOperativo: 0 };

        if (!productosCantidad[item.nombre]) {
          productosCantidad[item.nombre] = 0;
          productosIngreso[item.nombre]  = 0;
          productosCosto[item.nombre]    = 0;
          productosGastoOp[item.nombre]  = 0;
        }
        var precioItemMes = Number(item.precio) || (info.precioVenta || 0);
        var cantItemMes   = Number(item.cantidad) || 0;
        productosCantidad[item.nombre] += cantItemMes;
        productosIngreso[item.nombre]  += precioItemMes * cantItemMes;
        productosCosto[item.nombre]    += info.costo * cantItemMes;
        productosGastoOp[item.nombre]  += info.gastoOperativo * cantItemMes;
        totalCosto    += info.costo * cantItemMes;
        totalGastoOp  += info.gastoOperativo * cantItemMes;
        costoPedido   += info.costo * cantItemMes;
      }

      if (!porDia[fechaPedido]) {
        porDia[fechaPedido] = { fecha: fechaPedido, totalVentas: 0, totalCosto: 0, cantidadPedidos: 0 };
      }
      porDia[fechaPedido].totalVentas     += ventaPedido;
      porDia[fechaPedido].totalCosto      += costoPedido;
      porDia[fechaPedido].cantidadPedidos += 1;
    }

    var productos = [];
    for (var nombre in productosCantidad) {
      var ing = productosIngreso[nombre];
      var cos = productosCosto[nombre];
      var gop = productosGastoOp[nombre];
      productos.push({ nombre: nombre, cantidad: productosCantidad[nombre],
        ingreso: ing, costo: cos, gastoOperativo: gop, gananciaNeta: ing - cos });
    }
    productos.sort(function(a, b) { return b.cantidad - a.cantidad; });

    var diasArray = [];
    for (var fecha in porDia) {
      var d = porDia[fecha];
      diasArray.push({ fecha: d.fecha, totalVentas: d.totalVentas,
        gananciaNeta: d.totalVentas - d.totalCosto, cantidadPedidos: d.cantidadPedidos });
    }
    diasArray.sort(function(a, b) { return a.fecha < b.fecha ? -1 : 1; });

    return {
      mes: mes,
      totalVentas: totalVentas,
      totalCosto: totalCosto,
      totalGastoOp: totalGastoOp,
      gananciaNeta: totalVentas - totalCosto,
      cantidadPedidos: cantidadPedidos,
      ticketPromedio: cantidadPedidos > 0 ? Math.round(totalVentas / cantidadPedidos) : 0,
      productos: productos,
      porDia: diasArray
    };
  }

  // ══════════════════════════════════════════
  // SUELDOS — hoja "Sueldos"
  // Columnas: ID | Fecha | Nombre | Valor | Nota
  // ══════════════════════════════════════════

  function _getOCrearHojaSueldos() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Sueldos');
    if (!sheet) {
      sheet = ss.insertSheet('Sueldos');
      var header = sheet.getRange(1, 1, 1, 5);
      sheet.appendRow(['ID', 'Fecha', 'Nombre', 'Valor', 'Nota']);
      header.setFontWeight('bold');
      header.setBackground('#1a1a1a');
      header.setFontColor('#FFD700');
      sheet.setColumnWidth(1, 60);
      sheet.setColumnWidth(2, 110);
      sheet.setColumnWidth(3, 180);
      sheet.setColumnWidth(4, 110);
      sheet.setColumnWidth(5, 200);
    }
    return sheet;
  }

  function registrarSueldo(fecha, nombre, valor, nota, linea) {
    var sheet = _getOCrearHojaSueldos();
    var lastRow = sheet.getLastRow();
    var nuevoId = 1;
    if (lastRow > 1) {
      nuevoId = parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
    }
    var lineaVal = String(linea || 'gosa').trim().toLowerCase();
    sheet.appendRow([nuevoId, fecha, String(nombre).trim(), Number(valor) || 0, nota || '', lineaVal]);
    return { success: true, id: nuevoId };
  }

  function eliminarSueldo(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sueldos');
    if (!sheet) return { error: 'Hoja Sueldos no encontrada' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { error: 'Registro no encontrado' };
  }

  function getSueldosPorFecha(fecha) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sueldos');
    if (!sheet) return { sueldos: [], total: 0 };
    var data = sheet.getDataRange().getValues();
    var sueldos = [];
    var total = 0;
    for (var i = 1; i < data.length; i++) {
      var fechaRow = formatearFechaCell(data[i][1]);
      if (fechaRow === fecha) {
        var valor = Number(data[i][3]) || 0;
        total += valor;
        sueldos.push({
          id:     String(data[i][0]),
          fecha:  fechaRow,
          nombre: String(data[i][2]),
          valor:  valor,
          nota:   String(data[i][4] || ''),
          linea:  String(data[i][5] || 'gosa').trim().toLowerCase()
        });
      }
    }
    return { sueldos: sueldos, total: total };
  }

  function getResumenMesCompleto(mes) {
    var resumen   = getResumenMes(mes);
    var sueldos   = getSueldosMes(mes);
    var empResult = getEmpleados();
    return { resumen: resumen, sueldos: sueldos, empleados: empResult.empleados || [] };
  }

  function getEmpleados() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sueldos');
    if (!sheet) return { empleados: [] };
    var data = sheet.getDataRange().getValues();
    var nombres = {};
    for (var i = 1; i < data.length; i++) {
      var nombre = String(data[i][2]).trim();
      if (nombre) nombres[nombre] = true;
    }
    var lista = Object.keys(nombres).sort();
    return { empleados: lista };
  }

  function getSueldosMes(mes) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sueldos');
    if (!sheet) return { sueldos: [], total: 0 };
    var data = sheet.getDataRange().getValues();
    var sueldos = [];
    var total = 0;
    for (var i = 1; i < data.length; i++) {
      var fechaRow = formatearFechaCell(data[i][1]);
      if (fechaRow && fechaRow.indexOf(mes) === 0) {
        var valor = Number(data[i][3]) || 0;
        total += valor;
        sueldos.push({
          id:     String(data[i][0]),
          fecha:  fechaRow,
          nombre: String(data[i][2]),
          valor:  valor,
          nota:   String(data[i][4] || '')
        });
      }
    }
    return { sueldos: sueldos, total: total };
  }

  function reponerIngrediente(id, cantidad) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ingredientes');
    if (!sheet) return { error: 'Hoja Ingredientes no encontrada' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === String(id).trim().toUpperCase()) {
        var stockActual = Number(data[i][3]) || 0;
        var nuevoStock  = stockActual + cantidad;
        sheet.getRange(i + 1, 4).setValue(nuevoStock);
        return { success: true, nombre: String(data[i][1]).trim(), stockAntes: stockActual, stockAhora: nuevoStock };
      }
    }
    return { error: 'Ingrediente no encontrado: ' + id };
  }