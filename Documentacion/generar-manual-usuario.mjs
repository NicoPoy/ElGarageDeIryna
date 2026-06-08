import { createRequire } from 'node:module';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const PDFDocument = require('./pdf-tools/node_modules/pdfkit');

const docDir = resolve('E:/DESARROLLO/Proyectos/Tienda El Garage de Iryna/ElGarageDeIryna/Documentacion');
const outputPath = resolve(docDir, 'Manual-usuario-ElGarageDeIryna.pdf');

const colors = {
  text: '#2f2926',
  softText: '#665b55',
  accent: '#8b5a47',
  accentDark: '#654033',
  pale: '#fbf4ef',
  paleStrong: '#f3dfd5',
  line: '#e8d8cf',
  white: '#ffffff'
};

const doc = new PDFDocument({
  size: 'A4',
  margin: 44,
  bufferPages: true,
  info: {
    Title: 'Manual simple de uso - El Garage de Iryna',
    Author: 'El Garage de Iryna'
  }
});

doc.pipe(createWriteStream(outputPath));

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const left = doc.page.margins.left;

function addFooter() {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.softText)
      .text('El Garage de Iryna - Manual simple de uso', left, 800, {
        width: pageWidth,
        align: 'left'
      })
      .text(`Pagina ${i + 1}`, left, 800, {
        width: pageWidth,
        align: 'right'
      });
  }
}

function cover() {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.pale);
  doc
    .roundedRect(44, 70, pageWidth, 700, 12)
    .fill(colors.white);

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.accent)
    .text('GUIA SIMPLE PARA USAR LA PAGINA', 74, 118, {
      width: pageWidth - 60,
      characterSpacing: 0.7
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(34)
    .fillColor(colors.text)
    .text('El Garage de Iryna', 74, 155, {
      width: pageWidth - 60,
      lineGap: 4
    });

  doc
    .moveDown(0.8)
    .font('Helvetica')
    .fontSize(15)
    .fillColor(colors.softText)
    .text(
      'Este documento explica, con palabras simples, como usar la pagina de la tienda: ver productos, buscar, iniciar sesion, usar el carrito, elegir una forma de pago y consultar pedidos.',
      { width: pageWidth - 60, lineGap: 5 }
    );

  doc
    .moveDown(1.2)
    .roundedRect(74, doc.y, pageWidth - 60, 118, 10)
    .fill(colors.pale);

  const boxY = doc.y + 18;
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(colors.accentDark)
    .text('Pensado para:', 94, boxY)
    .font('Helvetica')
    .fontSize(12)
    .fillColor(colors.softText)
    .text('Personas que quieren comprar o consultar productos sin conocer detalles tecnicos.', 94, boxY + 25, {
      width: pageWidth - 100,
      lineGap: 4
    });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.softText)
    .text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 74, 705, {
      width: pageWidth - 60
    });
}

function newPage(title, intro = '') {
  doc.addPage();
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(colors.text)
    .text(title, left, 62, { width: pageWidth });

  doc
    .moveTo(left, 94)
    .lineTo(left + pageWidth, 94)
    .strokeColor(colors.line)
    .lineWidth(1)
    .stroke();

  doc.y = 112;
  if (intro) {
    doc
      .font('Helvetica')
      .fontSize(11.5)
      .fillColor(colors.softText)
      .text(intro, { width: pageWidth, lineGap: 4 });
    doc.moveDown(0.8);
  }
}

function paragraph(text) {
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(colors.softText)
    .text(text, { width: pageWidth, lineGap: 4 });
  doc.moveDown(0.65);
}

function smallTitle(text) {
  doc
    .moveDown(0.3)
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(colors.accentDark)
    .text(text, { width: pageWidth });
  doc.moveDown(0.35);
}

function stepList(items) {
  items.forEach((item, index) => {
    const y = doc.y;
    doc.circle(left + 12, y + 9, 10).fill(colors.accent);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(colors.white)
      .text(String(index + 1), left + 8.5, y + 3.5, { width: 8, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(colors.text)
      .text(item, left + 34, y, { width: pageWidth - 34, lineGap: 4 });
    doc.moveDown(0.75);
  });
  doc.moveDown(0.3);
}

function simpleList(items) {
  items.forEach((item) => {
    const y = doc.y;
    doc.circle(left + 5, y + 7, 2.4).fill(colors.accent);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(colors.text)
      .text(item, left + 18, y, { width: pageWidth - 18, lineGap: 4 });
    doc.moveDown(0.55);
  });
  doc.moveDown(0.35);
}

function note(title, text) {
  const y = doc.y;
  const height = 74;
  doc.roundedRect(left, y, pageWidth, height, 8).fill(colors.pale);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.accentDark)
    .text(title, left + 16, y + 13, { width: pageWidth - 32 });
  doc
    .font('Helvetica')
    .fontSize(10.2)
    .fillColor(colors.softText)
    .text(text, left + 16, y + 32, { width: pageWidth - 32, lineGap: 3 });
  doc.y = y + height + 16;
}

function twoColumnCards(cards) {
  const gap = 12;
  const cardWidth = (pageWidth - gap) / 2;
  cards.forEach((card, index) => {
    const x = index % 2 === 0 ? left : left + cardWidth + gap;
    const y = doc.y;
    doc.roundedRect(x, y, cardWidth, 92, 8).fill(colors.pale);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(colors.accentDark)
      .text(card.title, x + 14, y + 14, { width: cardWidth - 28 });
    doc
      .font('Helvetica')
      .fontSize(9.7)
      .fillColor(colors.softText)
      .text(card.text, x + 14, y + 34, { width: cardWidth - 28, lineGap: 2 });
    if (index % 2 === 1) doc.y = y + 108;
  });
  if (cards.length % 2 === 1) doc.y += 108;
}

cover();

newPage('Que se puede hacer en la pagina', 'La pagina es una tienda online. Sirve para que una persona vea los productos disponibles y pueda preparar un pedido.');
twoColumnCards([
  {
    title: 'Ver productos',
    text: 'Cada producto muestra nombre, foto, categoria, precio y stock disponible.'
  },
  {
    title: 'Buscar rapido',
    text: 'Se puede escribir una palabra, elegir categoria o cambiar el orden de los productos.'
  },
  {
    title: 'Usar carrito',
    text: 'El cliente agrega productos, revisa cantidades y ve el total antes de pagar.'
  },
  {
    title: 'Coordinar compra',
    text: 'La entrega y las consultas se coordinan por WhatsApp.'
  }
]);
paragraph('No hace falta saber de tecnologia para usarla. La persona solo debe seguir los botones visibles en pantalla.');
note('Idea general', 'La pagina guia al usuario: primero mira productos, despues inicia sesion, luego agrega al carrito y finalmente elige como pagar.');

newPage('Como mirar productos', 'Esta es la parte principal de la pagina. Al entrar, se ve el catalogo de la tienda.');
smallTitle('Que ve el usuario');
simpleList([
  'El nombre de la tienda.',
  'Una descripcion corta de lo que vende.',
  'Un buscador.',
  'Filtros por categoria.',
  'Tarjetas de productos con precio y stock.',
  'Datos de contacto al final.'
]);
smallTitle('Como elegir un producto');
stepList([
  'Mirar las tarjetas del catalogo.',
  'Leer el nombre, precio y stock.',
  'Si el producto tiene variedad, elegir una opcion.',
  'Tocar Agregar al carrito.'
]);
note('Importante', 'Si un boton dice Elegir opcion, significa que antes hay que seleccionar una variedad, por ejemplo aroma, tamano o presentacion.');

newPage('Como buscar o filtrar', 'Cuando hay muchos productos, el buscador y los filtros ayudan a encontrar mas rapido lo que se necesita.');
smallTitle('Buscar por palabra');
stepList([
  'Tocar el cuadro de Buscar.',
  'Escribir una palabra, por ejemplo lavanda, jabon o detergente.',
  'La pagina muestra solo los productos relacionados.',
  'Para volver a ver todo, borrar lo escrito.'
]);
smallTitle('Filtrar por categoria');
stepList([
  'Abrir el filtro Categoria.',
  'Elegir una categoria, por ejemplo Aromas o Limpieza del hogar.',
  'La pagina muestra solo productos de esa categoria.',
  'Para ver todos otra vez, elegir Todos.'
]);
smallTitle('Ordenar productos');
simpleList([
  'Nombre A-Z: muestra productos ordenados por nombre.',
  'Menor precio: muestra primero los mas economicos.',
  'Mayor precio: muestra primero los de mayor valor.',
  'Mas stock: muestra primero los que tienen mas unidades disponibles.'
]);

newPage('Como iniciar sesion o registrarse', 'Para comprar, el cliente necesita entrar con su cuenta. Si no tiene cuenta, puede crear una.');
smallTitle('Iniciar sesion');
stepList([
  'Tocar Iniciar sesion.',
  'Escribir email.',
  'Escribir contrasena.',
  'Tocar Entrar.'
]);
smallTitle('Crear cuenta');
stepList([
  'Tocar Iniciar sesion.',
  'Elegir Registrarse.',
  'Completar nombre, WhatsApp, DNI, email y contrasena.',
  'Tocar Crear cuenta.'
]);
note('Para el cliente', 'La cuenta permite que el pedido quede asociado a la persona correcta y que luego pueda consultar sus compras.');

newPage('Como usar el carrito', 'El carrito es donde se guardan los productos antes de confirmar la compra.');
smallTitle('Agregar productos');
stepList([
  'Iniciar sesion como cliente.',
  'Buscar el producto.',
  'Elegir variedad si corresponde.',
  'Tocar Agregar al carrito.',
  'Abrir el boton Carrito.'
]);
smallTitle('Dentro del carrito se puede');
simpleList([
  'Ver los productos elegidos.',
  'Subir o bajar cantidades.',
  'Quitar un producto.',
  'Vaciar todo el carrito.',
  'Ver el total de la compra.',
  'Ir a pagar.'
]);
note('Si no deja agregar', 'Revisar que la sesion sea de cliente, que el producto tenga stock y que se haya elegido variedad si el producto la pide.');

newPage('Como pagar y coordinar entrega', 'Despues de revisar el carrito, el cliente pasa a la pantalla de pago.');
smallTitle('Pasos para pagar');
stepList([
  'Abrir el carrito.',
  'Tocar Ir a pagar.',
  'Elegir Efectivo o Transferencia.',
  'Si elige Transferencia, copiar el alias que muestra la pagina.',
  'Coordinar entrega o enviar comprobante por WhatsApp.',
  'Finalizar el pedido.'
]);
smallTitle('Medios de pago');
simpleList([
  'Efectivo: se coordina directamente con la tienda.',
  'Transferencia: la pagina muestra el alias para pagar.',
  'Mercado Pago: aparece como opcion proximamente si todavia no esta habilitada.'
]);
note('Entrega', 'La entrega no se calcula sola en la pagina. Se coordina por WhatsApp segun zona y disponibilidad.');

newPage('Mis pedidos', 'Cuando el cliente ya tiene una cuenta, puede revisar sus pedidos desde la pagina.');
smallTitle('Para que sirve');
simpleList([
  'Ver pedidos realizados.',
  'Consultar el estado del pedido.',
  'Revisar que productos compro.',
  'Tener un seguimiento sin volver a cargar todo.'
]);
paragraph('Esta seccion aparece para usuarios clientes cuando ya iniciaron sesion.');

newPage('Parte de administracion', 'Esta parte es solo para la persona que gestiona la tienda. Un cliente comun no necesita usarla.');
smallTitle('Productos');
simpleList([
  'Cargar productos nuevos.',
  'Cambiar nombre, precio, categoria o stock.',
  'Agregar imagenes.',
  'Agregar variedades, por ejemplo aromas o tamanos.',
  'Exportar listado de productos si se necesita control externo.'
]);
smallTitle('Pedidos');
simpleList([
  'Ver pedidos activos.',
  'Marcar pedidos como entregados.',
  'Cancelar pedidos cuando corresponda.',
  'Revisar datos del cliente y productos comprados.'
]);
smallTitle('Stock y categorias');
simpleList([
  'Ver productos sin stock.',
  'Editar o eliminar productos agotados.',
  'Crear categorias nuevas.',
  'Activar o desactivar categorias.'
]);
note('Recomendacion para administrar', 'Antes de cargar muchos productos, conviene revisar primero las categorias. Asi cada producto queda ordenado desde el comienzo.');

newPage('Problemas frecuentes', 'Estas son dudas comunes que puede tener una persona usando la pagina.');
smallTitle('No encuentro un producto');
simpleList([
  'Borrar lo escrito en Buscar.',
  'Elegir Categoria: Todos.',
  'Cambiar el orden de productos.',
  'Consultar por WhatsApp si el producto no aparece.'
]);
smallTitle('No puedo agregar al carrito');
simpleList([
  'Iniciar sesion como cliente.',
  'Revisar que haya stock.',
  'Elegir variedad si el producto la pide.',
  'Intentar nuevamente.'
]);
smallTitle('No se como coordinar la entrega');
simpleList([
  'Usar el contacto de WhatsApp que aparece en la pagina.',
  'Enviar el pedido o comprobante por ese medio.',
  'Esperar confirmacion de la tienda.'
]);

newPage('Resumen rapido', 'Estos son los pasos principales para usar la pagina de principio a fin.');
stepList([
  'Entrar a la pagina.',
  'Buscar o elegir productos del catalogo.',
  'Iniciar sesion o registrarse.',
  'Elegir variedad si corresponde.',
  'Agregar productos al carrito.',
  'Revisar cantidades y total.',
  'Tocar Ir a pagar.',
  'Elegir forma de pago.',
  'Coordinar la entrega por WhatsApp.'
]);
note('En una frase', 'La pagina permite mostrar productos, preparar un pedido y dejar todo listo para coordinar la compra con la tienda.');

addFooter();
doc.end();

console.log(outputPath);
