# El Garage de Iryna

Tienda online hecha con React, Vite y Turso/libSQL. Si Turso no esta configurado, la app conserva un fallback local para desarrollo.

## Requisitos

- Node.js 18 o superior
- npm
- Cuenta de Turso

## Instalacion

```bash
npm install
```

## Variables de entorno

```env
VITE_MERCADO_PAGO_PAYMENT_LINK=https://link.mercadopago.com.ar/tu-link-de-pago
TURSO_DATABASE_URL=libsql://tu-db-tu-org.turso.io
TURSO_AUTH_TOKEN=tu_token_de_turso
```

## Base de datos Turso

Crear la base en Turso y ejecutar:

```bash
turso db shell NOMBRE_DE_TU_DB < db/turso_schema.sql
```

Ese SQL crea tablas, indices, triggers, categorias base y usuarios de prueba. No carga productos.

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

## Desarrollo

```bash
npm run dev
```

Vite sirve el frontend en:

```text
http://localhost:5173
```

Para probar tambien los endpoints `/api` en local, usar Vercel Dev o desplegar en Vercel con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.

## Build

```bash
npm run build
```

## Modelo

El esquema esta en:

```text
db/turso_schema.sql
```

Las imagenes de productos se guardan como URL en `product_images`. Para carga real de imagenes conviene usar storage aparte, por ejemplo Cloudflare R2, Cloudinary o Uploadcare, y guardar solo la URL en Turso.
