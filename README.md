# El Garage de Iryna

Tienda online hecha con React, Vite, API Python y Turso/libSQL.

## Requisitos

- Node.js 18 o superior
- npm
- Python soportado por Vercel
- Cuenta de Turso

## Instalacion

```bash
npm install
```

Las dependencias Python estan en:

```text
requirements.txt
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

Ese SQL crea tablas, indices, triggers y el usuario administrador. No carga productos, categorias ni usuarios cliente.

Para limpiar una base que ya tenia datos de prueba y conservar solo el admin:

```bash
turso db shell NOMBRE_DE_TU_DB < db/cleanup_keep_admin.sql
```

## Usuario administrador

Admin:

```text
Email: admin@elgaragedeiryna.com
Contrasena: IrynaBaez2023
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

## Swagger

Una vez desplegado en Vercel, la documentacion interactiva queda disponible en:

```text
https://TU-DOMINIO.vercel.app/api/docs
```

El contrato OpenAPI JSON queda en:

```text
https://TU-DOMINIO.vercel.app/api/openapi.json
```

## Arquitectura

```text
api/                  Handler Python para Vercel
backend/core/         Configuracion, errores HTTP y seguridad
backend/db/           Cliente Turso/libSQL
backend/repositories/ Acceso a datos
backend/services/     Reglas de negocio
backend/schemas/      Mapeos de datos hacia el frontend
db/                   SQL de esquema Turso
src/                  Frontend React
```

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
