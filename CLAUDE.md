# Sales AI Agent - Landing Page Next.js

Landing page moderno y minimalista para un agente IA de ventas privado. Diseño limpio enfocado en demostrar valor sin excesos visuales. Integración con webhooks n8n para formularios.

---

## Stack Técnico

- **Framework**: Next.js 14+ (React)
- **Styling**: Tailwind CSS + CDS Design System tokens
- **Icons**: Tabler Icons (outlined)
- **Integración**: Webhooks n8n (formularios, contacto, demo)
- **Deployment**: Vercel o AWS EC2 + Nginx
- **Dark mode**: Sistema nativo de Next.js (`next-themes`)

---

## Estructura de Carpetas

```
sales-ai-landing/
├── app/
│   ├── layout.tsx              # Root layout con CDS tokens
│   ├── page.tsx                # Landing page principal
│   ├── globals.css             # Estilos globales + CDS vars
│   └── api/
│       └── contact/
│           └── route.ts        # Endpoint para webhook n8n
├── components/
│   ├── Header.tsx              # Navegación
│   ├── Hero.tsx                # Sección hero
│   ├── Features.tsx            # Grid de features
│   ├── Demo.tsx                # Demo interactivo
│   ├── Stats.tsx               # Estadísticas
│   ├── Pricing.tsx             # Tabla de precios
│   ├── FAQ.tsx                 # Accordion FAQ
│   ├── Footer.tsx              # Footer
│   └── forms/
│       ├── ContactForm.tsx      # Formulario de contacto
│       └── DemoForm.tsx         # Solicitud de demo
├── hooks/
│   └── useN8nWebhook.ts       # Hook para integración n8n
├── lib/
│   ├── constants.ts            # URLs, configuración
│   └── cn.ts                   # Util para classNames
├── public/
│   ├── images/
│   └── favicon.ico
├── .env.local.example
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## Instalación y Setup

### 1. Clonar y crear proyecto Next.js

```bash
npx create-next-app@latest sales-ai-landing --typescript --tailwind
cd sales-ai-landing
```

### 2. Instalar dependencias adicionales

```bash
npm install next-themes clsx tailwind-merge
npm install -D @tabler/icons-react  # Para icons (opcional, usaremos CDN)
```

### 3. Configurar `.env.local`

```bash
# .env.local
NEXT_PUBLIC_N8N_CONTACT_WEBHOOK=https://your-n8n-instance.com/webhook/contact
NEXT_PUBLIC_N8N_DEMO_WEBHOOK=https://your-n8n-instance.com/webhook/demo
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

---

## Componentes Next.js

### 1. **app/layout.tsx** - Root Layout con CDS tokens

```typescript
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'SalesAI - Tu agente de ventas IA privado',
  description: 'Analiza conversaciones, obtén insights en tiempo real, cierra más tratos con IA 100% privada',
  openGraph: {
    title: 'SalesAI - Tu agente de ventas IA privado',
    description: 'Agente de ventas IA disponible 24/7',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.css" />
      </head>
      <body className="bg-surface-0 text-text-primary">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. **app/globals.css** - Estilos base con CDS tokens

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Text */
  --text-primary: #0b0b0b;
  --text-secondary: #57565a;
  --text-muted: #8c8b8f;
  --text-accent: #0c447c;
  --text-danger: #791f1f;
  --text-success: #27500a;

  /* Surface */
  --surface-0: #ffffff;
  --surface-1: #f7f7f6;
  --surface-2: #f1f1f0;

  /* Backgrounds */
  --bg-accent: #e6f1fb;
  --bg-danger: #fcebeb;
  --bg-success: #eaf3de;
  --bg-warning: #faeeda;

  /* Fills */
  --fill-accent: #378add;
  --fill-success: #639922;
  --fill-warning: #ba7517;
  --fill-danger: #e24b4a;

  /* On colors */
  --on-accent: #ffffff;
  --on-success: #ffffff;

  /* Borders */
  --border: rgba(11, 11, 11, 0.08);
  --border-strong: rgba(11, 11, 11, 0.12);
  --border-accent: #378add;

  /* Spacing */
  --radius: 8px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f5f5f4;
    --text-secondary: #a8a7ab;
    --text-muted: #6f6f73;
    --surface-0: #0b0b0b;
    --surface-1: #1a1a1a;
    --surface-2: #252524;
    --border: rgba(245, 245, 244, 0.1);
    --border-strong: rgba(245, 245, 244, 0.15);
    --bg-accent: #042c53;
    --bg-success: #173404;
  }
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-surface-0 text-text-primary;
}

/* Estilos base para elementos */
a {
  @apply text-text-secondary hover:text-text-primary transition-colors;
}

button {
  @apply transition-all;
}

/* Utilidades */
.bg-surface-0 { background-color: var(--surface-0); }
.bg-surface-1 { background-color: var(--surface-1); }
.bg-surface-2 { background-color: var(--surface-2); }

.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }

.border-line { border: 0.5px solid var(--border); }
.border-strong { border: 0.5px solid var(--border-strong); }
```

### 3. **components/Header.tsx**

```typescript
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-100 bg-surface-2 border-b border-line">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-medium">
          <i className="ti ti-robot"></i>
          SalesAI
        </Link>

        {/* Desktop menu */}
        <ul className="hidden md:flex gap-8">
          <li><a href="#features" className="text-sm">Features</a></li>
          <li><a href="#demo" className="text-sm">Demo</a></li>
          <li><a href="#pricing" className="text-sm">Precios</a></li>
          <li><a href="#faq" className="text-sm">FAQ</a></li>
        </ul>

        <button className="bg-fill-accent text-on-accent px-5 py-2 rounded-md text-sm font-medium hover:opacity-90">
          Acceder
        </button>
      </nav>
    </header>
  )
}
```

### 4. **components/Hero.tsx**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="py-20 md:py-32 px-4 text-center bg-surface-0">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-medium mb-6 text-text-primary">
          Tu agente de ventas disponible 24/7
        </h1>

        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
          Analiza conversaciones históricas, obtén insights accionables en tiempo real y cierra más tratos con un agente IA 100% privado.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <button className="bg-fill-accent text-on-accent px-6 py-3 rounded-md font-medium hover:opacity-90 flex items-center gap-2">
            <i className="ti ti-play"></i>
            Ver Demo
          </button>

          <button className="border border-border-strong px-6 py-3 rounded-md font-medium hover:bg-surface-2 flex items-center gap-2">
            <i className="ti ti-book"></i>
            Documentación
          </button>
        </div>
      </div>
    </section>
  )
}
```

### 5. **components/Features.tsx**

```typescript
const features = [
  {
    icon: 'ti-message-circle',
    title: 'Análisis de Conversaciones',
    description: 'Accede a todas tus conversaciones. Busca, filtra y exporta reportes en PDF o CSV.',
  },
  {
    icon: 'ti-chart-bar',
    title: 'Insights en Tiempo Real',
    description: 'Métricas automáticas: tasa de cierre, sentimiento, duración. Alertas sobre clientes en riesgo.',
  },
  {
    icon: 'ti-lock',
    title: 'Privacidad Total',
    description: 'Datos 100% privados. Encriptación AES-256 en tránsito y en reposo. Sin terceros.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-surface-0">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-medium mb-12 text-center">Funcionalidades principales</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-surface-2 border border-line rounded-xl p-8 hover:-translate-y-1 transition-transform">
              <i className={`ti ${feature.icon} text-3xl text-fill-accent mb-4 block`}></i>
              <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 6. **components/Demo.tsx** - Interactivo

```typescript
'use client'

import { useState } from 'react'

export default function Demo() {
  const [activeConv, setActiveConv] = useState(0)
  const [metrics, setMetrics] = useState({ sentiment: 78, closeProb: 82 })

  const conversations = [
    { id: 1, name: 'Cliente #1', time: 'Hace 2 horas' },
    { id: 2, name: 'Cliente #2', time: 'Hace 4 horas' },
    { id: 3, name: 'Cliente #3', time: 'Hace 6 horas' },
  ]

  const handleSelectConv = (idx: number) => {
    setActiveConv(idx)
    setMetrics({
      sentiment: Math.floor(Math.random() * 30) + 65,
      closeProb: Math.floor(Math.random() * 25) + 70,
    })
  }

  return (
    <section id="demo" className="py-20 px-4 bg-surface-1 border-y border-line">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-medium mb-12 text-center">Demo en vivo</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Conversations */}
          <div className="bg-surface-2 border border-line rounded-xl p-6 max-h-96 overflow-y-auto">
            <p className="font-medium text-sm mb-4">Conversaciones recientes</p>
            {conversations.map((conv, idx) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConv(idx)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                  activeConv === idx
                    ? 'bg-bg-accent border border-border-accent'
                    : 'bg-surface-1 border border-border hover:border-border-strong'
                }`}
              >
                <p className="text-sm">{conv.name}</p>
                <p className="text-xs text-text-muted">{conv.time}</p>
              </div>
            ))}
          </div>

          {/* Right: Metrics */}
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-2 border border-line rounded-xl p-4">
                <p className="text-xs text-text-secondary mb-2">Sentimiento</p>
                <p className="text-2xl font-medium text-fill-success">{metrics.sentiment}%</p>
              </div>
              <div className="bg-surface-2 border border-line rounded-xl p-4">
                <p className="text-xs text-text-secondary mb-2">Prob. de cierre</p>
                <p className="text-2xl font-medium text-fill-accent">{metrics.closeProb}%</p>
              </div>
            </div>

            <div className="bg-surface-2 border border-line rounded-xl p-6">
              <h3 className="font-medium text-sm mb-3">Resumen automático</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Cliente mostró alto interés. Preocupación sobre precio resuelta. Solicitó propuesta formal. Siguiente acción: seguimiento en 48 horas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 7. **components/Pricing.tsx**

```typescript
const plans = [
  {
    name: 'Starter',
    subtitle: 'Perfecto para comenzar',
    price: 29,
    features: [
      { text: 'Hasta 1,000 conversaciones/mes', included: true },
      { text: 'Análisis básico', included: true },
      { text: 'Soporte por email', included: true },
      { text: 'Exportación avanzada', included: false },
      { text: 'API', included: false },
    ],
  },
  {
    name: 'Pro',
    subtitle: 'Para equipos en crecimiento',
    price: 99,
    featured: true,
    features: [
      { text: 'Hasta 50,000 conversaciones/mes', included: true },
      { text: 'Análisis avanzado + alertas', included: true },
      { text: 'Exportación PDF/CSV', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'API REST', included: false },
    ],
  },
  {
    name: 'Enterprise',
    subtitle: 'Solución personalizada',
    price: null,
    features: [
      { text: 'Conversaciones ilimitadas', included: true },
      { text: 'API con webhooks', included: true },
      { text: 'Integraciones personalizadas', included: true },
      { text: 'Soporte 24/7 dedicado', included: true },
      { text: 'SLA garantizado', included: true },
    ],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 bg-surface-0">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-medium mb-12 text-center">Planes flexibles</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-8 ${
                plan.featured
                  ? 'bg-surface-2 border-2 border-border-accent relative'
                  : 'bg-surface-2 border border-line'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 right-6 bg-fill-accent text-on-accent px-3 py-1 rounded-md text-xs font-medium">
                  Más popular
                </div>
              )}

              <h3 className="font-medium mb-1">{plan.name}</h3>
              <p className="text-xs text-text-secondary mb-4">{plan.subtitle}</p>

              <div className="mb-6">
                {plan.price !== null ? (
                  <>
                    <p className="text-3xl font-medium">${plan.price}</p>
                    <p className="text-xs text-text-secondary">/mes</p>
                  </>
                ) : (
                  <p className="text-2xl font-medium">Personalizado</p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="text-sm">
                    <span className={feat.included ? 'text-fill-success' : 'text-text-muted'}>
                      {feat.included ? '✓' : '✕'}
                    </span>
                    {' '}
                    <span className={feat.included ? '' : 'opacity-50'}>{feat.text}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 rounded-md font-medium text-sm ${
                  plan.featured
                    ? 'bg-fill-accent text-on-accent hover:opacity-90'
                    : 'border border-border-strong hover:bg-surface-1'
                }`}
              >
                {plan.featured ? 'Comenzar prueba' : 'Empezar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 8. **components/FAQ.tsx**

```typescript
'use client'

import { useState } from 'react'

const faqs = [
  { q: '¿Cómo se protegen mis datos?', a: 'Encriptación AES-256, TLS 1.3, sin terceros.' },
  { q: '¿Puedo integrar con mi CRM?', a: 'Sí, mediante API REST. Soporte dedicado en planes Pro+.' },
  { q: '¿Cuál es el SLA?', a: '99.9% para Pro/Enterprise, 99.5% para Starter.' },
  { q: '¿Hay período de prueba?', a: '14 días gratis para Pro y Enterprise, sin tarjeta.' },
  { q: '¿Qué significa "privado"?', a: 'Solución independiente, no es Anthropic/OpenAI. Control total de tus datos.' },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-4 bg-surface-0">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-medium mb-12 text-center">Preguntas frecuentes</h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="border border-line rounded-xl p-4 cursor-pointer"
              open={openIdx === idx}
            >
              <summary
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="font-medium text-sm flex justify-between items-center"
              >
                {faq.q}
                <i className={`ti ti-chevron-down text-xs transition-transform ${openIdx === idx ? 'rotate-180' : ''}`}></i>
              </summary>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 9. **components/forms/ContactForm.tsx** - Con webhook n8n

```typescript
'use client'

import { useState } from 'react'
import { useN8nWebhook } from '@/hooks/useN8nWebhook'

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { sendData } = useN8nWebhook(process.env.NEXT_PUBLIC_N8N_CONTACT_WEBHOOK!)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await sendData(formData)
      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        type="text"
        placeholder="Tu nombre"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-2 rounded-md border border-line focus:outline-none focus:border-border-accent"
        required
      />

      <input
        type="email"
        placeholder="tu@email.com"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-2 rounded-md border border-line focus:outline-none focus:border-border-accent"
        required
      />

      <textarea
        placeholder="Tu mensaje"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        className="w-full px-4 py-2 rounded-md border border-line focus:outline-none focus:border-border-accent resize-none"
        rows={4}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-fill-accent text-on-accent py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>

      {status === 'success' && <p className="text-sm text-fill-success">Mensaje enviado!</p>}
      {status === 'error' && <p className="text-sm text-fill-danger">Error al enviar.</p>}
    </form>
  )
}
```

### 10. **hooks/useN8nWebhook.ts**

```typescript
export const useN8nWebhook = (webhookUrl: string) => {
  const sendData = async (data: Record<string, string>) => {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Webhook error')
    return await response.json()
  }

  return { sendData }
}
```

---

## Configuración Tailwind

```js
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'fill-accent': 'var(--fill-accent)',
        'fill-success': 'var(--fill-success)',
        'border-accent': 'var(--border-accent)',
      },
      borderColor: {
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Deployment

### Vercel (recomendado)

```bash
npm install -g vercel
vercel login
vercel
```

### AWS EC2 + Nginx

```bash
# En tu EC2 (Ubuntu 22.04)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx

# Clone y build
git clone <tu-repo>
cd sales-ai-landing
npm install
npm run build

# PM2 para mantener el proceso
npm install -g pm2
pm2 start npm --name "nextjs" -- start

# Nginx como proxy reverso
# /etc/nginx/sites-available/default
upstream nextjs {
  server localhost:3000;
}

server {
  listen 80;
  server_name tudominio.com;

  location / {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}

sudo systemctl restart nginx
```

---

## Checklist

- [ ] Crear proyecto Next.js con `create-next-app`
- [ ] Instalar dependencias (tailwind, next-themes)
- [ ] Configurar CDS tokens en `globals.css`
- [ ] Crear componentes principales (Header, Hero, Features, Demo, etc.)
- [ ] Conectar formularios con webhook n8n
- [ ] Configurar `.env.local` con URLs de webhooks
- [ ] Diseñar y ajustar responsive (mobile-first)
- [ ] Setup dark mode con `next-themes`
- [ ] Optimizar performance (images, lazy loading)
- [ ] Testing en dispositivos reales
- [ ] Deploy a Vercel o AWS EC2
- [ ] Configurar SSL/HTTPS
- [ ] Analytics (GA4, Plausible)
- [ ] Documentación de API de n8n

---

## Notas de Diseño

- **Sin animaciones excesivas**: fade-in básicos apenas, hover states sutiles
- **Enfoque privado**: resaltar que no es Anthropic/OpenAI, es solución personal
- **Confianza**: usar CDS tokens y diseño limpio para proyectar profesionalismo
- **Accesibilidad**: semántica HTML correcta, colores con suficiente contraste
- **Performance**: lazy loading de imágenes, code splitting automático de Next.js
- **Dark mode**: toggle automático según preferencia del sistema