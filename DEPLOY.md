# Deploy

El proyecto esta preparado para Vercel como app Vite con endpoints Python `/api` para Turso/libSQL.

## Configuracion

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Variables en Vercel

```env
TURSO_DATABASE_URL=libsql://tu-db-tu-org.turso.io
TURSO_AUTH_TOKEN=tu_token_de_turso
VITE_MERCADO_PAGO_PAYMENT_LINK=https://link.mercadopago.com.ar/tu-link-de-pago
```

Sin `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, la API responde error de configuracion y el frontend no usa datos locales.

## API y Swagger

Una vez publicado, la API queda bajo:

```text
https://TU-DOMINIO.vercel.app/api
```

Swagger:

```text
https://TU-DOMINIO.vercel.app/api/docs
```

OpenAPI JSON:

```text
https://TU-DOMINIO.vercel.app/api/openapi.json
```

## Base de datos

Antes del deploy, ejecutar:

```bash
turso db shell NOMBRE_DE_TU_DB < db/turso_schema.sql
```
