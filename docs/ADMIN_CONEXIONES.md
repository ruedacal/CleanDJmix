# BEATWAVE Admin — Guía de conexión de cada bloque

Ahora el panel (`/admin.html`) funciona con **datos de ejemplo**: todo sale de `web/js/admin/data.js` y `web/js/admin/data-deep.js`. Esta guía explica cómo conectar cada bloque a datos reales sin cambiar el diseño.

---

## 0. Arquitectura común (hazlo primero)

Todos los bloques siguen el mismo patrón:

```
admin.html (React)  ──fetch──>  /api/admin/<bloque>  (Bottle, api/index.py)  ──>  servicio externo / Postgres
```

### 0.1 Base de datos central: Neon Postgres
Casi todos los bloques guardan algo (promos, banners, avisos, contenido…). Usa una sola base de datos.

1. En v0: **Settings → Integrations → Neon** (o en Vercel: Storage → Create → Neon). Esto crea `DATABASE_URL` automáticamente.
2. Añade a `api/requirements.txt`:
   ```
   psycopg[binary]>=3.1
   stripe>=10.0
   ```
3. Crea `infrastructure/db.py`:
   ```python
   import os, psycopg
   from psycopg.rows import dict_row

   def query(sql, params=None):
       with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row) as conn:
           with conn.cursor() as cur:
               cur.execute(sql, params or ())
               return cur.fetchall() if cur.description else []
   ```
   Usa siempre parámetros (`%s`), nunca concatenes texto en el SQL.

### 0.2 Proteger el panel (obligatorio antes de publicar)
Hoy `/admin.html` es público. Antes de conectar datos reales:

1. Tabla `admins (id, email, password_hash, role)` con roles `owner`, `editor`, `viewer`.
2. Endpoint `POST /api/admin/login` que devuelve una cookie `HttpOnly; Secure; SameSite=Strict`.
3. Un decorador `@require_admin(role)` en todas las rutas `/api/admin/*`.
4. Añade a `vercel.json` la cabecera `X-Frame-Options: DENY` para `/admin.html`.

### 0.3 Cambio en el front (igual para todos los bloques)
Sustituye el import de datos de ejemplo por una petición:

```js
// antes
import { BANNERS } from './data.js';
// después
const { data: BANNERS = [] } = useApi('/api/admin/banners');
```

Crea `useApi` una sola vez en `web/js/admin/api.js` (fetch con `credentials: 'include'` y estado de carga/error).

---

## 1. Resumen (KPIs)
| | |
|---|---|
| **Fuente** | Stripe (ingresos, PRO, abandono) + Postgres (usuarios activos) |
| **Endpoint** | `GET /api/admin/overview?from=&to=` |
| **Variables** | `STRIPE_SECRET_KEY`, `DATABASE_URL` |

- Ingresos: `stripe.BalanceTransaction.list(created={'gte': ts})` sumando `amount` por día.
- PRO: `stripe.Subscription.list(status='active', price=PRICE_PRO)`.
- Abandono: suscripciones canceladas en 30 d ÷ activas al inicio del periodo.
- Activos: `SELECT count(DISTINCT user_id) FROM events WHERE ts > now() - interval '30 days'`.
- Cachea la respuesta 5 min (los KPIs no necesitan ser en tiempo real).

## 2. Base de datos
| | |
|---|---|
| **Fuente** | Neon Postgres |
| **Endpoints** | `GET /api/admin/tables`, `GET /api/admin/tables/<t>?page=&q=`, `PATCH /api/admin/tables/<t>/<id>` |

- Lista de tablas: `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`.
- **Lista blanca** de tablas y columnas editables en el servidor; nunca uses el nombre de tabla que llega del navegador directamente en el SQL.
- Paginación con `LIMIT 50 OFFSET %s`.
- Guarda cada edición en `audit_log (admin_id, tabla, fila, antes, después, ts)`.

## 3. Consultas SQL
| | |
|---|---|
| **Fuente** | Neon Postgres con un usuario de **solo lectura** |
| **Endpoint** | `POST /api/admin/sql` `{ sql }` |
| **Variables** | `DATABASE_URL_READONLY` |

Esto es lo más delicado del panel. Configúralo así:
```sql
CREATE ROLE admin_ro LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE neondb TO admin_ro;
GRANT USAGE ON SCHEMA public TO admin_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO admin_ro;
REVOKE SELECT ON admins FROM admin_ro;  -- nunca expongas hashes
```
En cada consulta: `SET statement_timeout = '5s'`, transacción `READ ONLY`, máximo 1000 filas y solo rol `owner`. Hoy el motor (`web/js/admin/sql.js`) corre en el navegador sobre datos de ejemplo; en producción la consulta se ejecuta en el servidor.

## 4. Promociones
| | |
|---|---|
| **Fuente** | Postgres (`promotions`) + Stripe Coupons |
| **Endpoints** | `GET/POST/PATCH /api/admin/promotions` |

Tabla: `promotions (id, nombre, descuento_pct, inicio, fin, audiencia, estado, stripe_coupon_id)`.
Al crear: `stripe.Coupon.create(percent_off=..., duration='once', redeem_by=fin)` y guarda el id. Un **Vercel Cron** (`vercel.json → crons`) cada hora activa o desactiva las promos por fecha.

## 5. Códigos descuento
| | |
|---|---|
| **Fuente** | Stripe Promotion Codes |
| **Endpoints** | `GET/POST /api/admin/codes`, `POST /api/admin/codes/<id>/disable` |

- Crear: `stripe.PromotionCode.create(coupon=..., code='SUMMER25', max_redemptions=500, expires_at=...)`.
- Usos: `times_redeemed` viene en el mismo objeto; no hace falta guardarlo aparte.
- Inyectar en el checkout: `allow_promotion_codes=True` en `stripe.checkout.Session.create`.
- Webhook `checkout.session.completed` → guarda qué usuario usó qué código.

## 6. Skills en campañas
| | |
|---|---|
| **Fuente** | Postgres (`campaign_skills`) |
| **Endpoints** | `GET/POST/PATCH /api/admin/skills`, público `GET /api/skills/active` |

Tabla: `campaign_skills (id, skill_key, campaña, inicio, fin, audiencia, activo)`.
La app (`web/js/app.jsx`) consulta `/api/skills/active` al arrancar y muestra u oculta cada skill con un `if`. Así activas una skill en una campaña sin redesplegar. Si quieres reglas más finas (porcentaje de usuarios, A/B), usa **Vercel Flags** en lugar de la tabla.

## 7. Banners
| | |
|---|---|
| **Fuente** | Vercel Blob (imágenes) + Postgres (`banners`) |
| **Endpoints** | `POST /api/admin/banners/upload`, `GET/POST/PATCH /api/admin/banners`, público `GET /api/banners?ubicacion=` |
| **Variables** | `BLOB_READ_WRITE_TOKEN` |

1. En v0: **Integrations → Blob**.
2. Subida desde Python: `PUT https://blob.vercel-storage.com/banners/<nombre>` con cabecera `Authorization: Bearer $BLOB_READ_WRITE_TOKEN`; devuelve la URL pública.
3. Tabla: `banners (id, titulo, imagen_url, enlace, ubicacion, inicio, fin, impresiones, clics)`.
4. La app pide `/api/banners?ubicacion=home` y registra impresión y clic con `POST /api/banners/<id>/event`.
5. Valida tipo (`image/png|jpeg|webp`) y tamaño (máx. 2 MB) en el servidor.

## 8. Analítica
| | |
|---|---|
| **Opción A (simple)** | Vercel Web Analytics: activar en Vercel → Analytics. Visitas, páginas y países sin código. |
| **Opción B (recomendada)** | PostHog: eventos de producto, embudos y retención. |
| **Variables** | `POSTHOG_KEY` (público), `POSTHOG_PERSONAL_API_KEY` (servidor), `POSTHOG_PROJECT_ID` |

1. En `index.html` y `copilot.html` carga el snippet de PostHog y llama a `posthog.identify(userId)` tras el login.
2. Las gráficas del panel se rellenan desde el servidor con la API de consultas de PostHog:
   `POST https://eu.posthog.com/api/projects/<id>/query` con un `HogQLQuery`.
3. Endpoint propio `GET /api/admin/analytics?from=&to=&granularity=day|hour` que traduce al formato `{ labels, series }` que ya usa `LineChart`. El zoom por horas del panel solo necesita `granularity=hour`.

## 9. Comportamiento (tiempo por sección, navegación, temas por usuario)
Usa la misma fuente que Analítica. Lo importante es **qué eventos envía la app**:

| Evento | Propiedades | Para la gráfica |
|---|---|---|
| `section_view` | `section`, `from_section` | Navegación entre secciones |
| `section_leave` | `section`, `duration_ms` | Tiempo medio por sección |
| `track_processed` | `track_id`, `source` (local/spotify) | Temas procesados por usuario |
| `session_end` | `duration_ms` | Tiempo medio en la app |

Envía `section_view` / `section_leave` cada vez que cambie la pestaña en `app.jsx`, y `track_processed` en `AnalysisService` cuando termine cada pista. Si no quieres PostHog, guarda estos eventos en una tabla `events (user_id, nombre, props jsonb, ts)` y calcula las métricas con SQL.

## 10. SEO
| | |
|---|---|
| **Fuente** | Google Search Console API |
| **Endpoint** | `GET /api/admin/seo?from=&to=` |
| **Variables** | `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` |

1. Google Cloud → crea un proyecto → activa **Search Console API** → crea una *service account* y descarga el JSON.
2. En Search Console → Ajustes → Usuarios → añade el email de la service account como lector.
3. Llama a `searchanalytics.query` con `dimensions: ['page']` (clics, impresiones, CTR, posición) y cachea 24 h, porque Google actualiza los datos una vez al día.
4. Para velocidad por página: Vercel **Speed Insights** (activar en el panel de Vercel).

## 11. Redes sociales
| Red | API | Qué permite |
|---|---|---|
| Instagram / Facebook | Meta Graph API (cuenta Business enlazada a una página) | Publicar, programar, métricas |
| TikTok | Content Posting API | Publicar vídeos, métricas básicas |
| YouTube | YouTube Data API v3 | Subir, métricas |
| X | X API v2 (plan de pago para publicar) | Publicar, métricas |

- **No guardes tokens de estas redes en variables de entorno a mano.** Usa **Vercel Connect** para que Vercel gestione el OAuth y renueve los tokens; tu servidor pide un token de corta duración cuando va a publicar.
- Tabla `scheduled_posts (id, red, texto, media_url, programado_para, estado, post_id_externo)`.
- Un **Vercel Cron** cada 5 min publica los que tocan y guarda el `post_id_externo`.
- Las métricas (alcance, interacción) se recogen una vez al día y se guardan en `social_metrics`.
- Si no quieres mantener cuatro APIs: Buffer o Ayrshare ofrecen una sola API para todas.

## 12. Estudio de contenido (RRSS, blog y Academia)
| | |
|---|---|
| **Generación con IA** | Vercel AI Gateway (sin clave en Vercel) |
| **Almacenamiento** | Postgres `content (id, tipo, titulo, cuerpo_md, estado, autor, modulo_academia, publicado_en)` |
| **Endpoints** | `POST /api/admin/content/generate`, `GET/POST/PATCH /api/admin/content` |

- Generar: el servidor llama a AI Gateway (`https://ai-gateway.vercel.sh/v1/chat/completions`, compatible con OpenAI) con un prompt según el tipo (post corto, artículo de blog, lección). En Vercel la autenticación es automática mediante OIDC.
- Flujo: `borrador → revisión → publicado`. Solo `owner`/`editor` publican.
- **Blog**: publica en `/blog/<slug>` generando HTML estático, o usa un CMS (Sanity/Contentful) si vais a tener varios redactores.
- **Academia**: la app lee `GET /api/academy?modulo=` y muestra las lecciones con `estado='publicado'`.
- **RRSS**: el botón "Programar" crea la fila en `scheduled_posts` (bloque 11).

## 13. Facturación
| | |
|---|---|
| **Fuente** | Stripe |
| **Endpoints** | `GET /api/admin/invoices`, `POST /api/admin/invoices/<id>/refund`, `POST /api/stripe/webhook` |
| **Variables** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

1. En v0: **Integrations → Stripe**.
2. Listado: `stripe.Invoice.list(limit=50, starting_after=...)`.
3. PDF: cada factura trae `invoice_pdf`; el botón "Descargar" abre esa URL.
4. Reembolso: `stripe.Refund.create(payment_intent=..., idempotency_key=...)`, solo rol `owner`.
5. Webhook: verifica la firma con `stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)`. Eventos: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.

## 14. Avisos
| | |
|---|---|
| **En la app** | Postgres `notices (id, titulo, cuerpo, audiencia, inicio, fin)` + `GET /api/notices` |
| **Email** | Resend (`RESEND_API_KEY`) |
| **Push (opcional)** | Web Push con VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) |

- Email: `POST https://api.resend.com/emails`. Verifica vuestro dominio en Resend (registros DNS SPF/DKIM) para no caer en spam.
- Envíos masivos en lotes de 100 con un Cron para no superar el límite de tiempo de la función.
- Incluye siempre el enlace de baja (obligatorio por RGPD).

## 15. Logs (con detalle de error)
El detalle (fichero, 50 líneas de código, excepción, traza, motivo y solución) ya está implementado con datos de ejemplo.

| | |
|---|---|
| **Captura** | Sentry (`SENTRY_DSN`) — integración oficial con Python |
| **Logs de servidor** | Vercel → Settings → Log Drains (o `vercel logs`) |
| **Endpoint** | `GET /api/admin/logs?level=&q=&from=`, `GET /api/admin/logs/<id>` |

1. `pip install sentry-sdk` y en `main.py`:
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn=os.environ["SENTRY_DSN"], traces_sample_rate=0.1, include_source_context=True)
   ```
   Sentry guarda para cada error la excepción, el fichero, la línea y el código de alrededor: es justo lo que pinta el panel.
2. El endpoint pide los eventos a `GET https://sentry.io/api/0/projects/<org>/<proyecto>/events/` con `SENTRY_AUTH_TOKEN`, y traduce cada `frame` (`filename`, `lineno`, `pre_context`, `context_line`, `post_context`) a `{ file, start, errLine, lines }`, el formato de `web/js/admin/log-snippets.js`. Recorta a 50 líneas.
3. "Motivo probable" y "Solución": de momento son textos fijos por tipo de error (`web/js/admin/log-details.js`). Para generarlos automáticamente, manda la excepción y el código a AI Gateway y guarda la respuesta para no repetir la llamada.
4. Sube los *source maps* del bundle JS a Sentry para ver también los errores del front con su línea original.
5. **Nunca** muestres en el panel valores de variables de entorno ni tokens que aparezcan en una traza; Sentry los filtra por defecto con `send_default_pii=False`.

---

## Orden recomendado
1. Neon + login de administradores (0.1 y 0.2) — sin esto no publiques datos reales.
2. Stripe: Facturación, Códigos y Promociones (13, 5, 4).
3. Sentry: Logs (15).
4. PostHog: Analítica y Comportamiento (8, 9).
5. Blob: Banners (7) y Skills en campañas (6).
6. Avisos con Resend (14).
7. Contenido con AI Gateway (12), Redes sociales con Vercel Connect (11) y SEO (10).

## Resumen de variables de entorno
| Variable | Bloques |
|---|---|
| `DATABASE_URL` | Todos los que guardan datos |
| `DATABASE_URL_READONLY` | Consultas SQL |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Resumen, Promociones, Códigos, Facturación |
| `BLOB_READ_WRITE_TOKEN` | Banners, Contenido (imágenes) |
| `POSTHOG_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` | Analítica, Comportamiento |
| `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` | SEO |
| `RESEND_API_KEY` | Avisos |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Logs |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | App (análisis de Spotify) |
| *(gestionadas por Vercel Connect)* | Redes sociales |
| *(automática en Vercel)* | AI Gateway |
