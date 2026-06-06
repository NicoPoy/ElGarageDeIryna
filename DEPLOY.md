# Deploy

El proyecto esta preparado para Vercel como app Vite con endpoints `/api` para Turso/libSQL.

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

## Base de datos

Antes del deploy, ejecutar:

```bash
turso db shell NOMBRE_DE_TU_DB < db/turso_schema.sql
```
