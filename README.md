# Zurdo Tattoo — sitio público y backoffice

Aplicación Next.js 16 con portafolio público, solicitud de tatuaje en cinco pasos y un centro de operaciones protegido para administrar solicitudes, clientes, cotizaciones, disponibilidad, anticipos, citas y comunicación transaccional.

## Desarrollo local

1. Copia `.env.example` como `.env` o `.env.local`.
2. Configura `DATABASE_URL` con la base PostgreSQL `zurdo_tatto`.
3. Define `ADMIN_EMAIL`, `ADMIN_PASSWORD` y un `ADMIN_SESSION_SECRET` de al menos 24 caracteres.
4. Ejecuta `npm install`.
5. Ejecuta `npm run db:migrate`.
6. Ejecuta `npm run db:seed` para importar los trabajos iniciales.
7. Ejecuta `npm run dev` y abre `http://localhost:3000`.

> Los scripts de base de datos cargan las variables desde `.env.local` y `.env`. No agregues secretos al repositorio.

## Frontend separado en Netlify

El mismo repositorio puede desplegar el sitio público en Netlify y mantener las APIs y el backoffice en Render. Configura únicamente en Netlify `NEXT_PUBLIC_API_URL=https://tu-servicio.onrender.com`. Esta variable hace proxy de `/api/*` hacia Render, obtiene desde ahí el portafolio público y redirige `/admin/*` al backoffice. No configures `DATABASE_URL` ni credenciales administrativas en Netlify.

## Rutas administrativas

- `/admin`: métricas operativas, próximas citas y acciones pendientes.
- `/admin/solicitudes`: búsqueda, filtros y seguimiento de solicitudes.
- `/admin/solicitudes/[id]`: cotización, horarios, pago, cita, notas, correos y timeline.
- `/admin/calendario`: vistas de día, semana y mes.
- `/admin/citas`: listado y estados de las citas.
- `/admin/pagos`: anticipos, referencias y confirmación manual auditada.
- `/admin/clientes`: perfiles consolidados con solicitudes, citas, pagos y actividad.
- `/admin/disponibilidad`: tatuadores, horario semanal y excepciones.
- `/admin/trabajos`: administración del portafolio público.
- `/admin/configuracion`: reglas operativas, anticipo y automatizaciones.
- `/admin/configuracion/correos`: preview, pruebas e historial de Brevo.

## Flujo de una cita

La solicitud pública incluye el calendario real dentro de sus cinco pasos. Al finalizar, crea o actualiza el cliente, asigna un folio `SOL-*`, guarda una cita tentativa y genera el anticipo pendiente en una sola operación. No se envían enlaces para elegir horario. La confirmación manual del anticipo desde el backoffice crea un movimiento inmutable, confirma la cita y registra auditoría y timeline.

Los cambios de fecha conservan historial. Las operaciones de pago, selección de horario y correos automáticos utilizan claves de idempotencia y validaciones para evitar duplicados. Las fechas se guardan con zona horaria y se muestran en `America/Mexico_City`.

## Brevo y recordatorios

Configura en el servidor:

```env
APP_URL=https://tu-dominio.com
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=
BREVO_WEBHOOK_SECRET=
CRON_SECRET=
```

La API key nunca llega al navegador. El endpoint `/api/webhooks/brevo` actualiza entregas y rebotes usando el secreto configurado. El endpoint `/api/cron/reminders` requiere `Authorization: Bearer <CRON_SECRET>` y puede ser ejecutado periódicamente por el scheduler del proveedor de hosting. Los marcadores de 48 y 24 horas evitan recordatorios duplicados.

Si Brevo no está configurado, el flujo principal no se pierde: el correo queda como `FAILED` con su error y puede reintentarse, hasta tres intentos, desde el centro de correos.

## Identidad y archivos

- La información del estudio vive en `config/studio.ts`.
- Los trabajos iniciales provienen de `diseños/` y se publican desde `public/portfolio/`.
- Las cargas generan original, WEBP y thumbnail en `public/uploads/`.
- `lib/storage/index.ts` permite cambiar almacenamiento local por R2, S3, Cloudinary o Supabase Storage.

En producción serverless conecta almacenamiento de objetos persistente antes de permitir cargas.

## Verificación

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```
