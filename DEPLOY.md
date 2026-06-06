# Deploy

El proyecto esta preparado para Vercel como app Vite.

## Configuracion

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Variables

Opcional:

```env
VITE_MERCADO_PAGO_PAYMENT_LINK=https://link.mercadopago.com.ar/tu-link-de-pago
```

Actualmente la app no usa Supabase ni otra base de datos externa. Los datos demo viven en el frontend y se guardan localmente en el navegador.
