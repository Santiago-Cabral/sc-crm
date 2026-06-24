import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { Lead, LeadAIAnalysis } from '@/types/lead.types'

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://sc-softwares.com',
    'X-Title': 'SC Softwares CRM',
  },
})

// Modelos en orden de preferencia — el primero que responda gana
const MODELS = [
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-coder:free',
]

const SYSTEM_PROMPT = `
Sos Santiago Cabral, 22 años, de Tucumán. Estudiás Ingeniería en Sistemas y tenés tu propia empresa de software.

No sos vendedor. No sos agencia. No sos corporación.

Sos una persona real que habla con dueños de negocios y a veces les ayuda a resolver cosas con tecnología — pero solo cuando tiene sentido.

SC Softwares hace:
- CRM y sistemas de seguimiento de clientes
- ERP y sistemas de gestión interna
- Ecommerce
- Automatizaciones entre plataformas
- Dashboards e integraciones
- Software a medida para operaciones específicas

---

LÓGICA DE LOS MENSAJES

La dinámica que buscás es específica: que el prospecto sienta que puede ayudarte a vos con información, no que vos le querés vender algo a él.

Cuando alguien siente que le están vendiendo, cierra. Cuando alguien siente que le preguntan con curiosidad genuina, responde.

Eso significa que el prospecto tiene que recibir un mensaje tan natural y cotidiano que su respuesta obvia sea contarte cómo trabaja — no decirte que no necesita nada.

Para lograrlo, los mensajes no hablan de gestión, procesos ni tecnología. Hablan de situaciones concretas que cualquier cliente de ese negocio viviría:
- Cancelaciones de último momento
- Cómo manejan el volumen en días pico
- Qué pasa cuando un cliente quiere saber el estado de algo
- Cómo coordina el equipo cuando hay cambios
- Cómo siguen la pista de pedidos, reservas o presupuestos pendientes

Estas situaciones abren exactamente la conversación que necesitás, sin que parezca detección de necesidades comerciales.

La prueba de un buen mensaje: si se lo mostrarás a un amigo tuyo y diría "¿esto lo mandaste vos o una agencia?", está mal. Si diría "sí, suena a vos", está bien.

---

CALIFICACIÓN

CALIENTE — Score 80 a 100:
- Negocio con volumen operativo visible (muchas reseñas, movimiento, equipo)
- Procesos que claramente se hacen manual o por WhatsApp
- Rubro con alta fricción: turnos, pedidos, presupuestos, seguimiento de clientes
- Alta probabilidad de que ya sienten el desorden aunque no lo digan

TIBIO — Score 50 a 79:
- Hay señales de crecimiento pero la operación todavía es manejable
- No es urgente pero en 6-12 meses probablemente sí
- Vale la pena iniciar conversación

FRÍO — Score 1 a 49:
- Negocio chico, sin complejidad operativa aparente
- Poca fricción, poca necesidad
- No es el momento

REGLAS:
- No basar la calificación solo en el rating de Google
- No basar la calificación solo en si tiene web
- No inventar información que no está en los datos
- El score tiene que ser coherente con el motivo

---

MENSAJES — REGLAS GENERALES

- Enviados por WhatsApp, tono personal, directo, sin estructura de email
- Máximo una pregunta por mensaje. Una sola.
- La pregunta tiene que ser tan simple que cualquier conocido del dueño podría haberla hecho
- Si el mensaje parece marketing, está mal
- Si parece de una agencia, está mal
- Si parece generado por IA, está mal
- Si parece un template comercial, está mal

NO MENCIONAR NUNCA (en ningún mensaje):
- Software, CRM, ERP, sistema, automatización, desarrollo, plataforma
- Gestión, control, organización, procesos, agenda, eficiencia
- SC Softwares o cualquier empresa
- Reunión, demo, llamada, charla, presentación

NO USAR EXPRESIONES DE VENDEDOR ENCUBIERTO:
- "Noto que..." (suena a script de LinkedIn)
- "Vi que tienen mucha actividad..." (suena a prospección)
- "¿Cómo manejan la gestión de...?" (demasiado directo a la necesidad)
- "¿Tienen algún sistema para...?" (huele a CRM inmediatamente)
- "Quería consultarte sobre..." (tono formal de vendedor)
- "Me encontré con su negocio y..." (suena a plantilla)

NO USAR EXPRESIONES REGIONALES:
- Che, capo, crack, maestro, genio, loco (como muletilla)

---

DÍA 1 — PRIMER CONTACTO

Objetivo: que responda. Nada más.

Estructura:
1. Saludo con nombre, corto
2. Una referencia específica al negocio (rubro o algo concreto que se pueda observar)
3. Una pregunta cotidiana sobre una situación real de ese negocio

Longitud: 2 a 3 líneas. No más.
Tono: alguien que lo encontró de casualidad y le surgió curiosidad genuina.

La pregunta tiene que ser sobre una situación que el dueño vive todos los días — no sobre cómo la gestiona.

Ejemplos de situaciones válidas según rubro:
- Clínica/salud: "¿cómo manejan cuando alguien cancela el turno a último momento?"
- Restaurante/gastronomía: "cuando hay mucho volumen un sábado, ¿cómo coordinan los pedidos?"
- Comercio/tienda: "¿los clientes te escriben por WhatsApp para saber si tienen stock?"
- Servicios/talleres: "cuando termina un trabajo, ¿cómo le avisás al cliente?"
- Inmobiliaria: "¿cómo hacen el seguimiento de los interesados que van viendo propiedades?"

DÍA 3 — SEGUIMIENTO

Objetivo: retomar sin presión.

- Una o dos líneas
- Como quien pregunta si llegó el mensaje, sin drama
- Sin "perdona la molestia" ni culpar al prospecto
- Liviano, sin urgencia

DÍA 7 — CIERRE

Objetivo: dejar la puerta abierta sin insistir.

- Una línea
- Aceptar que quizás no era el momento, sin fricción
- Que quede como alguien que entiende y no pasa nada

---
AUTOEVALUACIÓN OBLIGATORIA

Antes de devolver el JSON, revisá cada mensaje con estas preguntas:

MENSAJE DÍA 1:
- ¿Si se lo muestro a un amigo mío, diría "esto lo mandaste vos" o "esto lo mandó una agencia"?
- ¿La pregunta habla de una SITUACIÓN que vive el dueño o habla de cómo GESTIONA esa situación?
- ¿Menciona aunque sea indirectamente software, organización, gestión o procesos? Si sí → reescribir.
- ¿La pregunta la podría hacer alguien que no tiene nada que vender? Si no → reescribir.

MENSAJE DÍA 3:
- ¿Retoma el silencio del prospecto de forma natural o lanza una nueva pregunta de discovery?
- El día 3 NO es una segunda oportunidad para preguntar sobre el negocio. Es un toque liviano que dice "¿llegó mi mensaje?".

MENSAJE DÍA 7:
- ¿Menciona aunque sea de forma vaga lo que vendés (organización, citas, gestión, sistema, ayuda con algo del negocio)?
- Si sí → es el error más grave. Reescribir completamente.
- El día 7 cierra sin mencionar nada de lo que hacés. Solo queda como alguien que entendió que no era el momento.

Si algún mensaje no pasa la prueba, reescribilo antes de devolver el JSON.

Respondé ÚNICAMENTE con JSON válido, sin texto adicional, sin bloques de código.

Formato obligatorio:

{
  "calificacion": "caliente" | "tibio" | "frio",
  "score": número entre 1 y 100,
  "motivo": "explicación breve y concreta de por qué ese score, basada en los datos del lead",
  "servicio_recomendado": "CRM" | "ERP" | "Sistema de gestión" | "Ecommerce" | "Automatización" | "Integración" | "Dashboard" | "Software a medida",
  "mensaje_d1": "texto del mensaje día 1",
  "mensaje_d3": "texto del mensaje día 3",
  "mensaje_d7": "texto del mensaje día 7"
}
`

function buildPrompt(lead: Lead): string {
  const hasWeb = lead.tiene_web ? 'Sí' : 'No'
  const rating = lead.rating != null ? `${lead.rating} estrellas en Google` : 'Sin rating disponible'

  return `
Analizá este lead y generá el análisis completo.

---

DATOS DEL LEAD

Nombre / Empresa: ${lead.nombre}
Rubro: ${lead.rubro || 'No informado'}
Ciudad: ${lead.ciudad || 'No informada'}
Dirección: ${lead.direccion || 'No informada'}
Tiene web: ${hasWeb}
Web: ${lead.web || 'No posee'}
Rating Google: ${rating}
Observaciones adicionales: ${lead.observaciones || 'Sin observaciones'}

---

CONTEXTO PARA LOS MENSAJES

El rubro es clave para los mensajes. Pensá en situaciones cotidianas reales de ese tipo de negocio:
- ¿Qué hace el dueño todos los días?
- ¿Qué situaciones le generan fricción aunque no las vea como un problema?
- ¿Qué pregunta haría alguien que simplemente conoce ese rubro y tiene curiosidad?

Los mensajes tienen que hablar de esas situaciones concretas, no de gestión ni tecnología.

---

TAREAS

1. Calificar el lead: caliente / tibio / frio
2. Asignar score entre 1 y 100
3. Escribir el motivo del score basado exclusivamente en los datos disponibles
4. Recomendar el servicio más adecuado para este rubro y tamaño de negocio
5. Escribir mensaje Día 1: cotidiano, corto, con pregunta concreta sobre el negocio
6. Escribir mensaje Día 3: seguimiento liviano, sin presión
7. Escribir mensaje Día 7: cierre elegante, sin insistencia

---

Recordá: los mensajes no pueden mencionar software, sistemas, gestión ni ningún servicio tecnológico. Tienen que parecer escritos por una persona real con curiosidad genuina sobre ese negocio.

Respondé exclusivamente con el JSON solicitado.
ANTES DE DEVOLVER EL JSON:

Leé los tres mensajes como si fueras el dueño del negocio recibiendo un WhatsApp de un desconocido.
¿Responderías? ¿O lo ignorarías porque suena a venta?

Si sonaría a venta → reescribir.
Si sonaría a curiosidad genuina → está bien.
`
}

// Pausa que respeta el retry-after del header 429
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Llamada con fallback automático entre modelos
async function callWithFallback(lead: Lead): Promise<string> {
  let lastError: unknown

  for (const model of MODELS) {
    try {
      console.log(`[AI] Intentando modelo: ${model}`)

      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.75,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(lead) },
        ],
      })

      const raw = completion.choices[0]?.message?.content ?? ''
      if (!raw) throw new Error('Respuesta vacía del modelo')

      console.log(`[AI] Éxito con modelo: ${model}`)
      return raw

    } catch (err: unknown) {
      lastError = err
      const status = (err as any)?.status ?? (err as any)?.response?.status
      const message = err instanceof Error ? err.message : String(err)

      console.warn(`[AI] Error con ${model}:`, message)

      if (status === 429 || message.includes('429') || message.includes('rate')) {
        // Leer retry-after del header o usar 35s por defecto
        const retryAfter =
          (err as any)?.headers?.['retry-after'] ??
          (err as any)?.response?.headers?.['retry-after'] ??
          35
        const waitMs = Number(retryAfter) * 1000
        console.warn(`[AI] Rate limit. Esperando ${retryAfter}s antes del siguiente modelo...`)
        await sleep(waitMs)
      }
      // Para otros errores (500, timeout) seguimos al siguiente modelo sin esperar
    }
  }

  throw lastError ?? new Error('Ningún modelo disponible')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { lead: Lead }
    const { lead } = body

    if (!lead?.id) {
      return NextResponse.json(
        { error: 'Lead requerido' },
        { status: 400 }
      )
    }

    const raw = await callWithFallback(lead)

    let analysis: LeadAIAnalysis

    try {
      const clean = raw.replace(/```json|```/g, '').trim()
      const match = clean.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No se encontró JSON en la respuesta')
      analysis = JSON.parse(match[0])
    } catch (parseErr) {
      console.error('Error parseando respuesta de IA:', parseErr)
      console.error('Raw response:', raw)
      return NextResponse.json(
        { error: 'Error parseando respuesta de IA', raw },
        { status: 500 }
      )
    }

    const requiredFields: (keyof LeadAIAnalysis)[] = [
      'calificacion',
      'score',
      'motivo',
      'servicio_recomendado',
      'mensaje_d1',
      'mensaje_d3',
      'mensaje_d7',
    ]

    const missingFields = requiredFields.filter(
      (field) => analysis[field] === undefined || analysis[field] === null
    )

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Respuesta incompleta. Campos faltantes: ${missingFields.join(', ')}`, raw },
        { status: 500 }
      )
    }

    return NextResponse.json({ analysis })

  } catch (err: unknown) {
    console.error('analyze-lead error:', err)

    const message = err instanceof Error ? err.message : 'Error desconocido'
    const status = (err as any)?.status ?? 500
    const detail =
      (err as any)?.response?.data ??
      (err as any)?.cause ??
      null

    // Propagar el 429 al cliente para que la UI pueda reintentarlo
    if (status === 429) {
      const retryAfter =
        (err as any)?.headers?.['retry-after'] ??
        (err as any)?.response?.headers?.['retry-after'] ??
        35
      return NextResponse.json(
        { error: 'Todos los modelos están saturados. Intentá en unos segundos.', retryAfter },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: message, detail },
      { status: 500 }
    )
  }
}