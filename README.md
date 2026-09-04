# SC CRM

CRM de ventas para **SC Softwares** — un estudio de software en Tucumán, Argentina, que hace sistemas a medida (ERPs, e-commerce, apps, autoatización con IA, CRMs) para PyMEs locales.

El sistema está pensado para llevar un pipeline de ventas completo: desde la **captación** de prospectos (leads) hasta el **cierre**, siguiendo una metodología de venta consultiva de 2 fases.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **React 19** + TanStack Query (data fetching/cache) + Zustand (estado de UI)
- **Tailwind CSS 4** + shadcn/ui (@base-ui/react)
- **Supabase** (base de datos + auth, cliente SSR y browser)
- **OpenAI SDK** (análisis de leads con modelos gratuitos vía OpenRouter)

## Primeros pasos

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Variables de entorno requeridas (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OPENROUTER_API_KEY=
```

Comandos útiles:

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # eslint
npx tsc --noEmit # chequeo de tipos
```

## Módulos

| Ruta | Función |
| --- | --- |
| `/dashboard` | KPIs, pipeline funnel, temperatura de leads, volumen de prospección semanal |
| `/leads` | Grid de leads con búsqueda, filtros y panel lateral de detalle |
| `/pipeline` | Kanban drag & drop por etapa (nuevo → contactado → … → cerrado/perdido) |
| `/import` | Importación de leads desde CSV |
| `/api/analyze-lead` | Análisis de cada lead con IA (scoring + mensajes de venta) |

## Metodología de ventas (2 fases)

El análisis con IA sigue un método de venta consultivo aplicando las escuelas de Grant Cardone (volumen/urgencia), Brian Tracy (preparación), Alex Dey (rapport/cierre emocional), Chris Voss (negociación táctica) y Alex Hormozi (valor percibido). Cada lead analizado recibe:

**Fase 1 — Captación** (romper el hielo sin oler a venta):
- `mensaje_d1` (primer contacto), `mensaje_d3` (seguimiento), `mensaje_d7` (cierre de captación).
- Máximo una pregunta, tono cotidiano, sin mencionar software/gestión/servicio.
- La IA prioriza cuándo contactar: caliente (hoy), tibio (esta semana), frío (cuando haya señal).

**Fase 2 — Escalado y cierre** (una vez que el prospecto responde):
- `cta_llamada`: mensaje para agendar la consulta/llamada con cierre asumido.
- `objecion_precio`, `objecion_pensar`, `objecion_presupuesto`: respuestas listas para objeciones típicas.
- `siguiente_paso`: acción concreta y accionable para Santiago.
- Prueba social con casos reales (Sermetal, Forrajería Jovita, TenisTuc, Cabral's Barbería) según el rubro del prospecto.

**Oferta completa de SC Softwares** (consultoría IT + desarrollo): consultoría/diagnóstico IT, posicionamiento web y SEO, mejora del perfil de Google Business, automatización de procesos, CRM, ERP, sistemas de gestión, puntos de venta (POS), apps móviles, integración de IA, páginas web y ecommerce. La IA recomienda el servicio más adecuado por lead (ej. empezar por mejorar presencia/Google si el negocio no tiene web o su perfil está descuidado).

## Rastreador de secuencia y registro de mensajes

El sistema rastrea la secuencia de captación D1 → D3 → D7 usando la tabla `interactions` (ya tipada en el proyecto):

- Al abrir un lead, el panel muestra en qué punto de la secuencia va (Día 1 / Día 3 / Día 7), con el estado del envío.
- El botón **"Marcar como enviado"** registra la interacción en `interactions` (tipo `whatsapp`, `mensaje_tipo` `d1|d3|d7`), actualiza `fecha_ultimo_contacto`, el `next_follow_up` (D1 → +3 días, D3 → +4 días, D7 → fin de secuencia) y pasa el lead de `nuevo` a `contactado` cuando corresponde.
- Al completar la secuencia, el sistema avisa que siga con el **escalado** (agendar llamada / manejar objeciones).

## Paneles de actividad (Cardone)

El dashboard incluye un KPI de **prospección** que mide el volumen y la consistencia (el primer diagnóstico de venta): contactados esta semana (según `fecha_ultimo_contacto`) vs. la semana anterior, más cuántos respondieron y cuántos están en reunión.

## API de análisis

`POST /api/analyze-lead` recibe un `lead` y devuelve el análisis completo de las 2 fases:

```json
{
  "calificacion": "caliente" | "tibio" | "frio",
  "score": 12,
  "motivo": "...",
  "servicio_recomendado": "CRM",
  "mensaje_d1": "...",
  "mensaje_d3": "...",
  "mensaje_d7": "...",
  "siguiente_paso": "...",
  "cta_llamada": "...",
  "objecion_precio": "...",
  "objecion_pensar": "...",
  "objecion_presupuesto": "..."
}
```

El análisis se persiste en el campo `ai_analysis` del lead (JSONB). Los modelos usados son gratuitos (vía `openrouter/free` con fallback automático entre opciones free).

## Notas

- El prompt de análisis vive en `src/app/api/analyze-lead/route.ts` (`SYSTEM_PROMPT` + `buildPrompt`). Para cambiar el comportamiento de ventas de la IA, editá ese archivo.
- Para aplicar la nueva metodología a leads ya cargados, hay que **volver a ejecutar "Analizar con IA"** en cada uno (el análisis viejo no tiene los campos de la fase 2).
- El registro de mensajes asume que la tabla `interactions` existe en Supabase y tiene políticas RLS que permiten insertar al usuario autenticado, igual que `leads`.
