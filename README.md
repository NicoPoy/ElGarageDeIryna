# El Garage de Iryna

Tienda online hecha con React y Vite. Por ahora trabaja sin base de datos externa: usa productos, categorias, usuarios y pedidos precargados en el frontend, con persistencia simple en `localStorage` para probar el flujo.

## Requisitos

- Node.js 18 o superior
- npm

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
```

## Variables de entorno

La unica variable opcional actual es el link de Mercado Pago:

```env
VITE_MERCADO_PAGO_PAYMENT_LINK=https://link.mercadopago.com.ar/tu-link-de-pago
```

## Usuarios de prueba

Admin:

```text
Email: admin@elgaragedeiryna.com
Contrasena: Admin123
```

Usuario:

```text
Email: cliente@elgaragedeiryna.com
Contrasena: Cliente123
```

## Levantar en desarrollo

```bash
npm run dev
```

Vite va a mostrar una URL local, normalmente:

```text
http://localhost:5173
```

## Build de produccion

```bash
npm run build
```

## Datos locales

Los datos de ejemplo estan en:

```text
src/data/products.js
```

Ahi se cargan productos de limpieza, aromas, jabones, papeleria, categorias y usuarios demo.
