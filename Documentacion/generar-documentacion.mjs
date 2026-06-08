import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const projectDir = resolve('E:/DESARROLLO/Proyectos/Tienda El Garage de Iryna/ElGarageDeIryna');
const docDir = resolve(projectDir, 'Documentacion');
const shotDir = resolve(docDir, 'capturas');
const profileDir = resolve(docDir, 'chrome-profile');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const appUrl = 'http://localhost:5173/';
const port = 9225;

await mkdir(shotDir, { recursive: true });
await mkdir(profileDir, { recursive: true });

const chrome = spawn(chromePath, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1365,900',
  'about:blank'
], { stdio: 'ignore' });

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function waitForChrome() {
  for (let index = 0; index < 80; index += 1) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await wait(250);
    }
  }
  throw new Error('Chrome no inicio el puerto de depuracion.');
}

class Cdp {
  constructor(socketUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.socket = new WebSocket(socketUrl);
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveRequest, rejectRequest } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) rejectRequest(new Error(message.error.message));
        else resolveRequest(message.result || {});
      }
      if (message.method && this.handlers.has(message.method)) {
        for (const handler of this.handlers.get(message.method)) handler(message.params || {});
      }
    });
  }

  async open() {
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener('open', resolveOpen, { once: true });
      this.socket.addEventListener('error', rejectOpen, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolveRequest, rejectRequest) => {
      this.pending.set(id, { resolveRequest, rejectRequest });
      this.socket.send(payload);
    });
  }

  once(method) {
    return new Promise((resolveEvent) => {
      const handler = (params) => {
        const list = this.handlers.get(method) || [];
        this.handlers.set(method, list.filter((current) => current !== handler));
        resolveEvent(params);
      };
      this.handlers.set(method, [...(this.handlers.get(method) || []), handler]);
    });
  }

  close() {
    this.socket.close();
  }
}

await waitForChrome();
const pages = await fetchJson(`http://127.0.0.1:${port}/json/list`);
const page = pages.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
if (!page) throw new Error('No se encontro una pestana de Chrome para capturar.');
const cdp = new Cdp(page.webSocketDebuggerUrl);
await cdp.open();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

async function evaluate(expression, awaitPromise = true) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Error evaluando la pagina.');
  }
  return result.result?.value;
}

async function navigate(url) {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url });
  await loaded;
  await wait(900);
}

async function waitForText(text, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
    if (found) return;
    await wait(250);
  }
  throw new Error(`No aparecio el texto: ${text}`);
}

async function clickByText(text, selector = 'button') {
  const ok = await evaluate(`(() => {
    const items = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const target = items.find((item) => item.innerText.trim().includes(${JSON.stringify(text)}));
    if (!target) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) throw new Error(`No se encontro ${selector} con texto ${text}`);
  await wait(700);
}

async function setInput(selector, value) {
  const ok = await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`No se encontro input ${selector}`);
  await wait(250);
}

async function selectByLabel(labelText, visibleText) {
  const ok = await evaluate(`(() => {
    const labels = [...document.querySelectorAll('label')];
    const label = labels.find((item) => item.innerText.includes(${JSON.stringify(labelText)}));
    const select = label?.querySelector('select');
    if (!select) return false;
    const option = [...select.options].find((current) => current.textContent.trim() === ${JSON.stringify(visibleText)});
    if (!option) return false;
    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`No se pudo seleccionar ${visibleText}`);
  await wait(500);
}

async function screenshot(name, fullPage = true) {
  let params = { format: 'png', fromSurface: true, captureBeyondViewport: fullPage };
  if (fullPage) {
    const metrics = await cdp.send('Page.getLayoutMetrics');
    const width = Math.ceil(metrics.cssContentSize.width);
    const height = Math.ceil(metrics.cssContentSize.height);
    params = {
      ...params,
      clip: { x: 0, y: 0, width, height, scale: 1 }
    };
  }
  const result = await cdp.send('Page.captureScreenshot', params);
  const file = resolve(shotDir, `${name}.png`);
  await writeFile(file, Buffer.from(result.data, 'base64'));
  return file;
}

async function login(email, password) {
  await clickByText('Iniciar sesion');
  await waitForText('Entrar');
  await setInput('input[type="email"]', email);
  await setInput('input[type="password"]', password);
  await clickByText('Entrar');
  await wait(1200);
}

const shots = [];
function addShot(file, title, body) {
  shots.push({ file, title, body });
}

await navigate(appUrl);
await evaluate('localStorage.clear(); location.reload()');
await wait(1400);
addShot(await screenshot('01-catalogo-publico'), 'Catalogo publico', 'Pantalla principal de la tienda. El cliente puede buscar productos, filtrar por categoria, ordenar resultados y revisar precio, stock y variedades disponibles.');

await setInput('input[placeholder="Aromas, jabones, detergentes..."]', 'lavanda');
addShot(await screenshot('02-busqueda-y-filtros'), 'Busqueda y filtros', 'El buscador y los filtros ayudan a encontrar rapidamente productos por nombre, categoria, precio o disponibilidad de stock.');

await setInput('input[placeholder="Aromas, jabones, detergentes..."]', '');
await clickByText('Iniciar sesion');
await waitForText('Registrarse');
addShot(await screenshot('03-acceso-usuarios', false), 'Acceso de usuarios', 'Desde el acceso se puede iniciar sesion o crear una cuenta. El sistema distingue cuentas cliente y cuentas administradoras.');
await clickByText('x', 'button');
await wait(400);

await login('cliente@elgaragedeiryna.com', 'Cliente123');
addShot(await screenshot('04-vista-cliente'), 'Vista de cliente', 'Cuando el cliente inicia sesion se habilitan el carrito y la seccion Mis pedidos. Las compras quedan asociadas a su cuenta.');

await clickByText('Agregar al carrito');
await clickByText('Carrito');
addShot(await screenshot('05-carrito'), 'Carrito de compras', 'El carrito muestra productos elegidos, cantidades, subtotal, total y acciones para quitar, vaciar, consultar por WhatsApp o avanzar al pago.');

await clickByText('Ir a pagar');
await waitForText('Elegir medio de pago');
await clickByText('Transferencia');
addShot(await screenshot('06-pago'), 'Medios de pago', 'El checkout permite elegir efectivo o transferencia, muestra el alias de pago y recuerda coordinar entrega y comprobante por WhatsApp.');

await clickByText('Cerrar sesion');
await waitForText('Iniciar sesion');
await login('admin@elgaragedeiryna.com', 'IrynaBaez2023');
await waitForText('Administrar productos');
addShot(await screenshot('07-admin-productos'), 'Administracion de productos', 'El panel admin permite cargar productos, definir precio, categoria, stock, imagenes y variedades. Tambien permite exportar el listado.');

await clickByText('Pedidos');
await waitForText('Pedidos activos');
addShot(await screenshot('08-admin-pedidos'), 'Gestion de pedidos', 'La administracion centraliza pedidos activos, entregados y cancelados, con datos del cliente, productos comprados y acciones de seguimiento.');

await clickByText('Sin stock');
await waitForText('Sin stock');
addShot(await screenshot('09-admin-sin-stock'), 'Control de stock', 'La vista Sin stock ayuda a detectar productos agotados para reponerlos, editarlos o retirarlos del catalogo.');

await clickByText('Categorias');
await waitForText('Agregar categoria');
addShot(await screenshot('10-admin-categorias'), 'Categorias', 'El administrador puede crear, renombrar, activar y desactivar categorias. Las categorias inactivas dejan de mostrarse al cliente.');

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Documentacion El Garage de Iryna</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #2d2623; font-family: Arial, sans-serif; background: white; }
    .cover { min-height: 240mm; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
    .kicker { color: #8b5a47; font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 38px; line-height: 1.1; }
    .subtitle { max-width: 620px; color: #665b55; font-size: 17px; line-height: 1.55; }
    .meta { margin-top: 28px; color: #7a6b64; font-size: 13px; }
    .page { page-break-before: always; }
    h2 { margin: 0 0 8px; color: #3d302b; font-size: 23px; }
    p { margin: 0 0 12px; color: #665b55; font-size: 13.5px; line-height: 1.45; }
    img { width: 100%; max-height: 218mm; object-fit: contain; border: 1px solid #eaded8; border-radius: 6px; }
    .note { margin-top: 6px; color: #8b5a47; font-size: 12px; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="kicker">Guia de uso del sistema</div>
    <h1>El Garage de Iryna</h1>
    <p class="subtitle">Documento con capturas de pantalla y explicacion funcional para presentar al cliente. Incluye recorrido de compra, acceso de usuarios y herramientas de administracion.</p>
    <p class="meta">Generado desde el entorno local: ${appUrl}<br>Fecha: ${new Date().toLocaleDateString('es-AR')}</p>
  </section>
  ${shots.map((shot, index) => `
    <section class="page">
      <div class="kicker">Pantalla ${String(index + 1).padStart(2, '0')}</div>
      <h2>${shot.title}</h2>
      <p>${shot.body}</p>
      <img src="${shot.file.replaceAll('\\\\', '/')}" alt="${shot.title}">
    </section>
  `).join('')}
</body>
</html>`;

const htmlPath = resolve(docDir, 'Guia-funcionamiento-ElGarageDeIryna.html');
await writeFile(htmlPath, html, 'utf8');

await navigate(`file:///${htmlPath.replaceAll('\\', '/')}`);
await wait(800);
const pdf = await cdp.send('Page.printToPDF', {
  printBackground: true,
  preferCSSPageSize: true
});
await writeFile(resolve(docDir, 'Guia-funcionamiento-ElGarageDeIryna.pdf'), Buffer.from(pdf.data, 'base64'));

cdp.close();
chrome.kill();
