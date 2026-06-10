# Instituciones Sub-rutas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dividir la página monolítica `/instituciones` en cuatro sub-rutas independientes y reflejar su jerarquía como accordion en la sidebar.

**Architecture:** Cada sub-sección se convierte en una página Astro SSG en `src/pages/instituciones/`. La sidebar recibe lógica condicional que expande sub-items cuando el path comienza con `/instituciones`. El toggle BM/SoFiPOs y su script se eliminan.

**Tech Stack:** Astro 5, React 19, TypeScript strict, Tailwind v4 (`(--color-x)` syntax), Lucide React, nanostores. Trabajar en `/home/pamer/projects/sfm-monitor/app/`.

---

## File map

| Archivo | Acción |
|---|---|
| `src/pages/instituciones.astro` | Eliminar en Task 6 |
| `src/pages/instituciones/index.astro` | Crear en Task 6 — redirect 301 |
| `src/pages/instituciones/tipos.astro` | Crear en Task 1 |
| `src/pages/instituciones/contraste.astro` | Crear en Task 2 |
| `src/pages/instituciones/banca-multiple.astro` | Crear en Task 3 |
| `src/pages/instituciones/sofipos.astro` | Crear en Task 4 |
| `src/components/shell/Sidebar.astro` | Modificar en Task 5 |
| `src/components/shell/SectorToggle.tsx` | Eliminar en Task 6 |

---

### Task 1: Crear `instituciones/tipos.astro`

**Files:**
- Create: `app/src/pages/instituciones/tipos.astro`

Esta página contiene únicamente el diagrama de Venn. No requiere datos de `loadSfmData()`.

- [ ] **Step 1: Crear el archivo**

```astro
---
import Layout from '~/layouts/Layout.astro';
import { datasetJsonLd } from '~/lib/jsonld';
import Header from '~/components/shell/Header.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import Section from '~/components/chrome/Section.astro';
import { SfmVennDiagram } from '~/components/SfmVennDiagram';
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
import { CmdKPalette } from '~/components/shell/CmdKPalette';
import { UpdateToast } from '~/components/shell/UpdateToast';
import { PWAInstallPrompt } from '~/components/shell/PWAInstallPrompt';
import { OnboardingTour } from '~/components/shell/OnboardingTour';
import { SwipeNav } from '~/components/shell/SwipeNav';
import { PullToRefresh } from '~/components/shell/PullToRefresh';
---

<Layout
  title="Tipos de Instituciones"
  description="13 tipos de instituciones del Sistema Financiero Mexicano: regulador, ley aplicable y capacidades de captación, crédito y mercado de valores."
  jsonLd={datasetJsonLd({
    name: 'Mapa del Sistema Financiero Mexicano — Tipos de instituciones',
    description: '13 tipos de instituciones financieras mexicanas clasificadas por capacidades: captar ahorro, otorgar crédito, operar en mercado de valores.',
    path: '/instituciones/tipos',
    keywords: ['banca múltiple', 'SoFiPOs', 'SOFOM', 'CNBV', 'Banxico', 'sistema financiero'],
  })}>
  <Header slot="header" />

  <div class="space-y-6">
    <Section
      id="venn-sfm"
      eyebrow="Mapa del sistema"
      title="¿Qué tipo de institución es esta?"
      description="13 tipos de instituciones del Sistema Financiero Mexicano según sus capacidades: captar ahorro, otorgar crédito y operar en mercado de valores. Toca cualquier nodo para ver regulador, ley aplicable y ejemplos."
      source="CNBV · Banxico · CONSAR · CNSF · Ley Fintech 2018"
      tone="gold">
      <SfmVennDiagram client:visible />
    </Section>
  </div>

  <ChartDrawer slot="drawer" client:idle />
  <CmdKPalette slot="cmdk" client:idle />
  <UpdateToast slot="update-toast" client:idle />
  <PWAInstallPrompt slot="install-prompt" client:idle />
  <OnboardingTour slot="onboarding" client:idle />
  <SwipeNav slot="gestures" client:idle />
  <PullToRefresh slot="gestures" client:idle />
  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 2: Build para verificar que compila**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Esperado: build exitoso. Ambas rutas `/instituciones` y `/instituciones/tipos` existen sin conflicto.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/instituciones/tipos.astro
git commit -m "feat(app): instituciones/tipos — sub-ruta con diagrama de Venn"
```

---

### Task 2: Crear `instituciones/contraste.astro`

**Files:**
- Create: `app/src/pages/instituciones/contraste.astro`

Panel comparativo BM vs SoFiPOs con 3 gráficas históricas. Toda la lógica viene del bloque comparativo de `instituciones.astro` (líneas 111–298).

- [ ] **Step 1: Crear el archivo**

```astro
---
import Layout from '~/layouts/Layout.astro';
import { datasetJsonLd } from '~/lib/jsonld';
import Header from '~/components/shell/Header.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import EditorialHeadline from '~/components/chrome/EditorialHeadline.astro';
import { ComparisonChart } from '~/components/charts/ComparisonChart';
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
import { CmdKPalette } from '~/components/shell/CmdKPalette';
import { UpdateToast } from '~/components/shell/UpdateToast';
import { PWAInstallPrompt } from '~/components/shell/PWAInstallPrompt';
import { OnboardingTour } from '~/components/shell/OnboardingTour';
import { SwipeNav } from '~/components/shell/SwipeNav';
import { PullToRefresh } from '~/components/shell/PullToRefresh';
import { loadSfmData } from '~/data/loader';
import { formatPct } from '~/lib/utils';

const data = loadSfmData();
const hpc = data.credito.historico_por_cartera;
const s = data.sofipos;
const ultima = s.ultima!;

const deltaImor  = ultima.imor_total  - data.credito.imor.actual;
const deltaImora = ultima.imora_total - data.credito.imora.actual;
const deltaRoa   = ultima.roa         - data.credito.roa.actual;

function fmtDelta(d: number, inverse = false) {
  const sign = d > 0 ? '+' : '';
  const color = inverse
    ? (d > 0 ? 'text-(--color-green)' : 'text-(--color-red)')
    : (d > 0 ? 'text-(--color-red)'   : 'text-(--color-green)');
  return { text: `${sign}${d.toFixed(2)}pp`, color };
}

const dImor  = fmtDelta(deltaImor);
const dImora = fmtDelta(deltaImora);
const dRoa   = fmtDelta(deltaRoa, true);
---

<Layout
  title="Contraste de Riesgo"
  description="Comparativa de IMOR, IMORA, ROA e ICOR entre Banca Múltiple y SoFiPOs."
  jsonLd={datasetJsonLd({
    name: 'Contraste de Riesgo — Banca Múltiple vs SoFiPOs',
    description: 'Comparativa de indicadores de riesgo y rentabilidad entre Banca Múltiple y SoFiPOs. Fuente: CNBV.',
    path: '/instituciones/contraste',
    keywords: ['IMOR', 'IMORA', 'ROA', 'banca múltiple', 'SoFiPOs', 'comparativa'],
  })}>
  <Header slot="header" />

  <div class="space-y-6">

    <EditorialHeadline
      eyebrow="Instituciones Financieras · Banca Múltiple vs SoFiPOs"
      headline="El sistema bancario mantiene IMOR controlado; el sector popular muestra morosidad ~3× mayor con rentabilidad bajo presión."
    />

    <!-- Panel comparativo BM vs SoFiPOs -->
    <div class="card-surface rounded-xl overflow-hidden">
      <!-- Encabezados de sector -->
      <div class="grid grid-cols-[1fr_auto_1fr] border-b border-(--color-border-soft)">
        <div class="px-5 py-3 flex items-center gap-2">
          <span aria-hidden="true">🏦</span>
          <span class="text-sm font-semibold text-(--color-text)">Banca Múltiple</span>
          <span class="text-[10px] text-(--color-text-mute) ml-auto tabular-nums">{data.credito.imor.fecha}</span>
        </div>
        <div class="px-3 py-3 flex items-center justify-center border-x border-(--color-border-soft)">
          <span class="text-[10px] font-bold text-(--color-text-mute) uppercase tracking-widest">vs</span>
        </div>
        <div class="px-5 py-3 flex items-center gap-2">
          <span aria-hidden="true">🏘️</span>
          <span class="text-sm font-semibold text-(--color-text)">SoFiPOs</span>
          <span class="text-[10px] text-(--color-text-mute) ml-auto tabular-nums">{ultima.fecha}</span>
        </div>
      </div>

      <!-- Filas de indicadores -->
      {[
        {
          label: 'IMOR',
          bmVal: formatPct(data.credito.imor.actual),
          bmTone: 'text-(--color-green)',
          sfVal: formatPct(ultima.imor_total),
          sfTone: 'text-(--color-yellow)',
          delta: dImor,
        },
        {
          label: 'IMORA',
          bmVal: formatPct(data.credito.imora.actual),
          bmTone: 'text-(--color-yellow)',
          sfVal: formatPct(ultima.imora_total),
          sfTone: 'text-(--color-red)',
          delta: dImora,
        },
        {
          label: 'ROA',
          bmVal: formatPct(data.credito.roa.actual),
          bmTone: 'text-(--color-green)',
          sfVal: formatPct(ultima.roa),
          sfTone: 'text-(--color-red)',
          delta: dRoa,
        },
        {
          label: 'ICOR',
          bmVal: `${data.credito.icor.actual.toFixed(2)}×`,
          bmTone: 'text-(--color-green)',
          sfVal: '—',
          sfTone: 'text-(--color-text-mute)',
          delta: null,
        },
      ].map((row) => (
        <div class="grid grid-cols-[1fr_auto_1fr] border-b border-(--color-border-soft) last:border-0 hover:bg-white/[0.02] transition-colors">
          <div class="px-5 py-3.5 flex items-baseline justify-between gap-4">
            <span class="text-[11px] font-medium text-(--color-text-mute) uppercase tracking-wider">{row.label}</span>
            <span class={`serif text-xl font-semibold tabular-nums ${row.bmTone}`}>{row.bmVal}</span>
          </div>
          <div class="px-3 flex items-center justify-center border-x border-(--color-border-soft) min-w-[72px]">
            {row.delta
              ? <span class={`text-[10px] font-semibold tabular-nums ${row.delta.color}`}>{row.delta.text}</span>
              : <span class="text-[10px] text-(--color-border-soft)">—</span>
            }
          </div>
          <div class="px-5 py-3.5 flex items-baseline justify-between gap-4">
            <span class="text-[11px] font-medium text-(--color-text-mute) uppercase tracking-wider">{row.label}</span>
            <span class={`serif text-xl font-semibold tabular-nums ${row.sfTone}`}>{row.sfVal}</span>
          </div>
        </div>
      ))}
    </div>

    <!-- Gráficas comparativas históricas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card-surface rounded-xl p-4">
        <div class="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-mute) mb-3">IMOR · histórico</div>
        <ComparisonChart
          fechasBm={hpc.fechas}
          valuesBm={hpc.imor_total}
          fechasSf={s.fechas}
          valuesSf={s.imor_total}
          client:visible
        />
      </div>
      <div class="card-surface rounded-xl p-4">
        <div class="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-mute) mb-3">IMORA · histórico</div>
        <ComparisonChart
          fechasBm={hpc.fechas}
          valuesBm={hpc.imora_total}
          fechasSf={s.fechas}
          valuesSf={s.imora_total}
          client:visible
        />
      </div>
      <div class="card-surface rounded-xl p-4">
        <div class="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-mute) mb-3">ROA · histórico</div>
        <ComparisonChart
          fechasBm={hpc.fechas}
          valuesBm={hpc.roa}
          fechasSf={s.fechas}
          valuesSf={s.roa}
          allowNegative={true}
          client:visible
        />
      </div>
    </div>

  </div>

  <ChartDrawer slot="drawer" client:idle />
  <CmdKPalette slot="cmdk" client:idle />
  <UpdateToast slot="update-toast" client:idle />
  <PWAInstallPrompt slot="install-prompt" client:idle />
  <OnboardingTour slot="onboarding" client:idle />
  <SwipeNav slot="gestures" client:idle />
  <PullToRefresh slot="gestures" client:idle />
  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 2: Build**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Esperado: build exitoso.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/instituciones/contraste.astro
git commit -m "feat(app): instituciones/contraste — panel comparativo BM vs SoFiPOs"
```

---

### Task 3: Crear `instituciones/banca-multiple.astro`

**Files:**
- Create: `app/src/pages/instituciones/banca-multiple.astro`

Todas las secciones de Banca Múltiple del archivo original (líneas 306–466) más 4 KPI cards nuevas al inicio.

- [ ] **Step 1: Crear el archivo**

```astro
---
import Layout from '~/layouts/Layout.astro';
import { datasetJsonLd } from '~/lib/jsonld';
import Header from '~/components/shell/Header.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import Section from '~/components/chrome/Section.astro';
import EditorialHeadline from '~/components/chrome/EditorialHeadline.astro';
import { KpiCard } from '~/components/kpi/KpiCard';
import { ImorSegPivotChart } from '~/components/charts/ImorSegPivotChart';
import { ImoraChart } from '~/components/charts/ImoraChart';
import { IcorChart } from '~/components/charts/IcorChart';
import { RoaRoeChart } from '~/components/charts/RoaRoeChart';
import { MifChart } from '~/components/charts/MifChart';
import { QuitasChart } from '~/components/charts/QuitasChart';
import { EprcChart } from '~/components/charts/EprcChart';
import { Ifrs9Chart } from '~/components/charts/Ifrs9Chart';
import { BancosTable } from '~/components/tables/BancosTable';
import { MetricTooltip } from '~/components/MetricTooltip';
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
import { CmdKPalette } from '~/components/shell/CmdKPalette';
import { UpdateToast } from '~/components/shell/UpdateToast';
import { PWAInstallPrompt } from '~/components/shell/PWAInstallPrompt';
import { OnboardingTour } from '~/components/shell/OnboardingTour';
import { SwipeNav } from '~/components/shell/SwipeNav';
import { PullToRefresh } from '~/components/shell/PullToRefresh';
import { loadSfmData } from '~/data/loader';
import { formatPct } from '~/lib/utils';

const data = loadSfmData();
const hpc = data.credito.historico_por_cartera;
const ifrs = data.ifrs9;
const hpb = data.credito.historico_por_banco;

const bancosArr = hpb
  ? Object.values(hpb.bancos).map((b) => ({
      id: b.id,
      nombre: b.nombre,
      imor_total: b.imor_total,
      ...(b.imor_comercial != null ? { imor_comercial: b.imor_comercial } : {}),
      ...(b.imor_consumo   != null ? { imor_consumo:   b.imor_consumo   } : {}),
      ...(b.imor_vivienda  != null ? { imor_vivienda:  b.imor_vivienda  } : {}),
      ...(b.imor_tarjeta   != null ? { imor_tarjeta:   b.imor_tarjeta   } : {}),
    }))
  : [];

const bancosRoaArr = hpb
  ? Object.values(hpb.bancos)
      .filter((b) => b.roa?.some((v) => v !== null))
      .map((b) => ({ id: b.id, nombre: b.nombre, roa: b.roa ?? [], roe: b.roe ?? [] }))
  : [];

const bancosImoraArr = hpb
  ? Object.values(hpb.bancos)
      .filter((b) => b.imora_total?.some((v) => v !== null))
      .map((b) => ({ id: b.id, nombre: b.nombre, values: b.imora_total ?? [] }))
  : [];

const bancosIcorArr = hpb
  ? Object.values(hpb.bancos)
      .filter((b) => b.icor_total?.some((v) => v !== null))
      .map((b) => ({ id: b.id, nombre: b.nombre, values: b.icor_total ?? [] }))
  : [];

const bmPivot = {
  fechas: hpc.fechas,
  cartera: {
    total: hpc.imor_total,
    comercial: hpc.imor_comercial,
    consumo: hpc.imor_consumo,
    vivienda: hpc.imor_vivienda,
    tarjeta: hpc.imor_tarjeta,
    consumo_norev: hpc.imor_consumo_norev,
  },
  bancos: bancosArr,
};

const latest_date = hpb?.fechas?.slice(-1)[0] ?? '';
---

<Layout
  title="Banca Múltiple"
  description="IMOR, IMORA, ICOR, IFRS9, ROA/ROE y Margen de Intermediación de Banca Múltiple. Fuente: CNBV Sector 40."
  jsonLd={datasetJsonLd({
    name: 'Banca Múltiple — Indicadores de riesgo y rentabilidad',
    description: 'IMOR, IMORA, ICOR, IFRS 9 y rentabilidad de Banca Múltiple. Fuente: CNBV Portafolio de Información Sector 40.',
    path: '/instituciones/banca-multiple',
    keywords: ['IMOR', 'IMORA', 'ICOR', 'IFRS 9', 'banca múltiple', 'CNBV'],
  })}>
  <Header slot="header" />

  <div class="space-y-6">

    <EditorialHeadline
      eyebrow={`Banca Múltiple · CNBV Sector 40 · ${data.credito.imor.fecha}`}
      headline="IMOR controlado. Cobertura sobre cartera vencida superior al 100%."
    />

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        label="IMOR"
        value={formatPct(data.credito.imor.actual)}
        asOf={data.credito.imor.fecha}
        iconName="Activity"
        tone="green"
        indicatorId="bm-imor"
        client:visible
      />
      <KpiCard
        label="IMORA"
        value={formatPct(data.credito.imora.actual)}
        asOf={data.credito.imor.fecha}
        iconName="Percent"
        tone="yellow"
        indicatorId="bm-imora"
        client:visible
      />
      <KpiCard
        label="ICOR"
        value={`${data.credito.icor.actual.toFixed(2)}×`}
        asOf={data.credito.imor.fecha}
        iconName="Shield"
        tone="green"
        indicatorId="bm-icor"
        client:visible
      />
      <KpiCard
        label="ROA"
        value={formatPct(data.credito.roa.actual)}
        asOf={data.credito.imor.fecha}
        iconName="TrendingUp"
        tone="green"
        indicatorId="bm-roa"
        client:visible
      />
    </div>

    <Section
      id="imor-pivot"
      eyebrow="Explorador interactivo"
      title="IMOR por banco / cartera"
      description="Vista Sistema o por banco individual. Selecciona cartera: total, comercial, consumo, vivienda, tarjeta o consumo no revolvente."
      source="CNBV Sector 40 (Banca Múltiple)"
      metricSlug="imor"
      tone="gold">
      <p class="text-xs text-(--color-text-mute) mb-3">
        <MetricTooltip slug="imor" client:visible>IMOR</MetricTooltip>: indice de morosidad — cartera vencida / cartera total.
      </p>
      <ImorSegPivotChart bm={bmPivot} showSofipos={false} client:visible />
    </Section>

    <Section
      id="bancos-table"
      eyebrow="Riesgo por institución"
      title="IMOR por banco"
      description={`Índice de morosidad por institución. Ordenable por IMOR actual, variación anual o nombre. CNBV Sector 40, 2000–${latest_date}.`}
      source="CNBV Sector 40 (sh_datos_40.csv)"
      tone="gold">
      {hpb ? (
        <BancosTable
          fechas={hpb.fechas}
          bancos={hpb.bancos as Record<string, import('../../components/tables/BancosTable').BancoEntry>}
          client:visible
        />
      ) : (
        <p class="text-sm text-(--color-text-mute)">Sin datos por institución disponibles.</p>
      )}
    </Section>

    <Section
      id="imora"
      eyebrow="Morosidad ajustada"
      title="IMORA — Índice de Morosidad Ajustado"
      description="Incluye cartera vencida más castigos contables acumulados en los últimos 12 meses."
      source="CNBV Sector 40"
      metricSlug="imora"
      tone="yellow">
      <ImoraChart
        fechas={hpc.fechas}
        values={hpc.imora_total}
        bancos={bancosImoraArr}
        {...(hpc.tda ? { tda: hpc.tda } : {})}
        client:visible
      />
    </Section>

    {hpc.quitas_castigos && (
      <Section
        id="quitas"
        eyebrow="Flujo de deterioro"
        title="Quitas y castigos"
        description="Flujo acumulado de los últimos 12 meses de quitas y castigos contables de la cartera de Banca Múltiple. Las quitas son el componente adicional que diferencia IMORA de IMOR: la morosidad ajustada incorpora estos castigos para reflejar el deterioro real de la cartera."
        source="CNBV Sector 40 — concepto 40200193"
        tone="yellow">
        <QuitasChart
          fechas={hpc.fechas}
          valores={hpc.quitas_castigos}
          client:visible
        />
      </Section>
    )}

    <Section
      id="icor"
      eyebrow="Cobertura de cartera"
      title="ICOR — Índice de Cobertura"
      description="Razón entre reservas preventivas y cartera vencida. Un valor > 1 indica cobertura igual o superior al 100%."
      source="CNBV Sector 40"
      metricSlug="icor"
      tone="green">
      <IcorChart fechas={hpc.fechas} values={hpc.icor_total} bancos={bancosIcorArr} client:visible />
    </Section>

    {hpc.eprc_cartera && (
      <Section
        id="eprc"
        eyebrow="Cobertura de cartera"
        title="EPRC / Cartera total"
        description="Estimaciones Preventivas para Riesgos Crediticios como porcentaje de la cartera total. Complementa el ICOR: mientras el ICOR mide cuántas veces las reservas cubren la cartera vencida, esta métrica muestra la carga de reservas sobre el portafolio completo."
        source="CNBV Sector 40 — concepto 40200118"
        tone="green">
        <EprcChart
          fechas={hpc.fechas}
          eprcCartera={hpc.eprc_cartera}
          client:visible
        />
      </Section>
    )}

    <Section
      id="roa-roe"
      eyebrow="Rentabilidad"
      title="ROA y ROE"
      description="Retorno sobre activos (eje izquierdo) y retorno sobre capital (eje derecho). Banca Múltiple consolidado."
      source="CNBV Sector 40"
      metricSlug="roa"
      tone="green">
      <RoaRoeChart fechas={hpc.fechas} roa={hpc.roa} roe={hpc.roe} bancos={bancosRoaArr} client:visible />
    </Section>

    {hpc.mif && hpc.tasa_activa && hpc.tasa_pasiva && (
      <Section
        id="mif"
        eyebrow="Intermediación financiera"
        title="MIF — Margen de Intermediación"
        description="Diferencia entre la tasa activa implícita (rendimiento de la cartera) y la tasa pasiva implícita (costo de fondeo). El MIF mide la rentabilidad estructural del negocio bancario."
        source="CNBV Sector 40 — conceptos 40200162, 40200037, 40200218"
        tone="green">
        <MifChart
          fechas={hpc.fechas}
          tasaActiva={hpc.tasa_activa}
          tasaPasiva={hpc.tasa_pasiva}
          mif={hpc.mif}
          tasaBanxico={data.tasa_banxico?.historico}
          client:visible
        />
      </Section>
    )}

    <Section
      id="ifrs9"
      eyebrow="Estándares contables"
      title="IFRS 9 — Stages 1/2/3"
      description="Distribución porcentual de la cartera por stage de riesgo crediticio. Stage 1: riesgo bajo; Stage 2: aumento significativo; Stage 3: deteriorada."
      source="CNBV Reporte R12A"
      metricSlug="ifrs9"
      tone="yellow">
      {ifrs.ultima && (
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="card-surface p-4 text-center">
            <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute) mb-1">Stage 1</div>
            <div class="serif text-2xl font-semibold text-(--color-green)">{formatPct(ifrs.ultima.etapa1)}</div>
          </div>
          <div class="card-surface p-4 text-center">
            <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute) mb-1">Stage 2</div>
            <div class="serif text-2xl font-semibold text-(--color-yellow)">{formatPct(ifrs.ultima.etapa2)}</div>
          </div>
          <div class="card-surface p-4 text-center">
            <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute) mb-1">Stage 3</div>
            <div class="serif text-2xl font-semibold text-(--color-red)">{formatPct(ifrs.ultima.etapa3)}</div>
          </div>
        </div>
      )}
      <Ifrs9Chart
        fechas={ifrs.fechas}
        etapa1={ifrs.etapa1_pct}
        etapa2={ifrs.etapa2_pct}
        etapa3={ifrs.etapa3_pct}
        {...(ifrs.por_segmento ? { porSegmento: ifrs.por_segmento } : {})}
        {...(ifrs.por_banco ? { porBanco: ifrs.por_banco } : {})}
        client:visible
      />
    </Section>

  </div>

  <ChartDrawer slot="drawer" client:idle />
  <CmdKPalette slot="cmdk" client:idle />
  <UpdateToast slot="update-toast" client:idle />
  <PWAInstallPrompt slot="install-prompt" client:idle />
  <OnboardingTour slot="onboarding" client:idle />
  <SwipeNav slot="gestures" client:idle />
  <PullToRefresh slot="gestures" client:idle />
  <BottomNav slot="bottom-nav" />
</Layout>
```

**Nota sobre el import de BancosTable:** La ruta relativa cambia porque el archivo ahora está un nivel más profundo. Usar:
```astro
bancos={hpb.bancos as Record<string, import('../../components/tables/BancosTable').BancoEntry>}
```
(dos niveles `../..` en lugar de uno `..`).

- [ ] **Step 2: Build**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Esperado: build exitoso. Si hay error de tipos en `BancosTable`, ajustar la ruta del import type.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/instituciones/banca-multiple.astro
git commit -m "feat(app): instituciones/banca-multiple — sub-ruta con todas las gráficas BM"
```

---

### Task 4: Crear `instituciones/sofipos.astro`

**Files:**
- Create: `app/src/pages/instituciones/sofipos.astro`

Todas las secciones SoFiPOs del archivo original (líneas 468–562) sin la lógica de toggle.

- [ ] **Step 1: Crear el archivo**

```astro
---
import Layout from '~/layouts/Layout.astro';
import { datasetJsonLd } from '~/lib/jsonld';
import Header from '~/components/shell/Header.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import Section from '~/components/chrome/Section.astro';
import EditorialHeadline from '~/components/chrome/EditorialHeadline.astro';
import { KpiCard } from '~/components/kpi/KpiCard';
import { SofiposSegmentChart } from '~/components/charts/SofiposSegmentChart';
import { SofiposEntidadesChart } from '~/components/charts/SofiposEntidadesChart';
import { SofiposImoraRoaChart } from '~/components/charts/SofiposImoraRoaChart';
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
import { CmdKPalette } from '~/components/shell/CmdKPalette';
import { UpdateToast } from '~/components/shell/UpdateToast';
import { PWAInstallPrompt } from '~/components/shell/PWAInstallPrompt';
import { OnboardingTour } from '~/components/shell/OnboardingTour';
import { SwipeNav } from '~/components/shell/SwipeNav';
import { PullToRefresh } from '~/components/shell/PullToRefresh';
import { loadSfmData } from '~/data/loader';
import { formatPct } from '~/lib/utils';

const data = loadSfmData();
const s = data.sofipos;
const ultima = s.ultima!;

const SOFIPOS_PRIORITY: string[] = [
  '027014', '027046', '027033', '027032', '027009',
  '027035', '027047', '027001', '027029', '027036',
  '027045', '027008', '027026', '027031', '027011',
];
const priorityIndex = (id: string) => {
  const i = SOFIPOS_PRIORITY.indexOf(id);
  return i === -1 ? SOFIPOS_PRIORITY.length : i;
};

const ents = Object.values(s.historico_por_entidad?.entidades ?? {}) as Array<{
  id: string; nombre: string; imor: (number | null)[];
  imora?: (number | null)[];
  imor_comercial?: (number | null)[]; imor_consumo?: (number | null)[]; imor_vivienda?: (number | null)[];
  cartera_total?: number | null;
}>;

const top15 = [...ents]
  .filter((e) => e.imor.length > 0)
  .sort((a, b) => {
    const ai = priorityIndex(a.id);
    const bi = priorityIndex(b.id);
    if (ai !== bi) return ai - bi;
    const aC = a.cartera_total ?? null;
    const bC = b.cartera_total ?? null;
    if (aC !== null && bC !== null) return bC - aC;
    return (b.imor[b.imor.length - 1] ?? 0) - (a.imor[a.imor.length - 1] ?? 0);
  })
  .slice(0, 15);
---

<Layout
  title="SoFiPOs"
  description="IMOR, IMORA y ROA de Sociedades Financieras Populares. Comparativa por cartera y top 15 entidades. Fuente: CNBV Sector 27."
  jsonLd={datasetJsonLd({
    name: 'SoFiPOs — Indicadores de riesgo y rentabilidad',
    description: 'IMOR, IMORA y ROA de Sociedades Financieras Populares (SoFiPOs). Fuente: CNBV Sector 27.',
    path: '/instituciones/sofipos',
    keywords: ['SoFiPOs', 'IMOR', 'IMORA', 'ROA', 'CNBV', 'sector popular'],
  })}>
  <Header slot="header" />

  <div class="space-y-6">

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        label="IMOR Total"
        value={formatPct(ultima.imor_total)}
        asOf={ultima.fecha}
        iconName="Activity"
        tone="yellow"
        indicatorId="sofipos-imor"
        client:visible
      />
      <KpiCard
        label="IMOR Vivienda"
        value={formatPct(ultima.imor_vivienda)}
        asOf={ultima.fecha}
        iconName="TrendingDown"
        tone="red"
        indicatorId="sofipos-imor-vivienda"
        client:visible
      />
      <KpiCard
        label="IMORA"
        value={formatPct(ultima.imora_total)}
        asOf={ultima.fecha}
        iconName="Percent"
        tone="yellow"
        indicatorId="sofipos-imora"
        client:visible
      />
      <KpiCard
        label="ROA"
        value={formatPct(ultima.roa)}
        asOf={ultima.fecha}
        iconName="TrendingUp"
        tone="red"
        indicatorId="sofipos-roa"
        client:visible
      />
    </div>

    <EditorialHeadline
      eyebrow={`SoFiPOs · Sociedades Financieras Populares · ${ultima.fecha}`}
      headline="Morosidad ~3× la de Banca Múltiple. Vivienda supera el 31% y rentabilidad bajo presión."
    />

    <Section
      id="sofipos-imor-cartera"
      eyebrow="Morosidad por cartera"
      title="IMOR por cartera"
      description="Índice de Morosidad por tipo de cartera. Vivienda supera sistemáticamente el 25%."
      source="CNBV Sector 27 (SoFiPOs)"
      metricSlug="imor"
      tone="yellow">
      <SofiposSegmentChart
        fechas={s.fechas}
        total={s.imor_total}
        comercial={s.imor_comercial}
        consumo={s.imor_consumo}
        vivienda={s.imor_vivienda}
        client:visible
      />
    </Section>

    <Section
      id="sofipos-top15"
      eyebrow="Entidades individuales"
      title="Top 15 entidades más reconocidas"
      description="Las 15 SoFiPOs con mayor presencia: cooperativas líderes, fintechs y microfinancieras."
      source="CNBV Sector 27 — histórico por entidad"
      tone="red">
      <SofiposEntidadesChart
        fechas={s.historico_por_entidad?.fechas ?? s.fechas}
        entidades={top15}
        client:visible
      />
    </Section>

    <Section
      id="sofipos-imora-roa"
      eyebrow="Calidad y rentabilidad"
      title="IMOR + ROA dual"
      description="IMOR total (eje izquierdo) y ROA del sector (eje derecho). ROA negativo señala rentabilidad por debajo del costo de capital."
      source="CNBV Sector 27 (SoFiPOs)"
      tone="yellow">
      <SofiposImoraRoaChart
        fechas={s.fechas}
        imor={s.imor_total}
        roa={s.roa}
        client:visible
      />
    </Section>

  </div>

  <ChartDrawer slot="drawer" client:idle />
  <CmdKPalette slot="cmdk" client:idle />
  <UpdateToast slot="update-toast" client:idle />
  <PWAInstallPrompt slot="install-prompt" client:idle />
  <OnboardingTour slot="onboarding" client:idle />
  <SwipeNav slot="gestures" client:idle />
  <PullToRefresh slot="gestures" client:idle />
  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 2: Build**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Esperado: build exitoso.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/instituciones/sofipos.astro
git commit -m "feat(app): instituciones/sofipos — sub-ruta con gráficas SoFiPOs"
```

---

### Task 5: Actualizar `Sidebar.astro` con accordion sub-nav

**Files:**
- Modify: `app/src/components/shell/Sidebar.astro`

Dos cambios: (1) agregar `SUBNAV` + `isInstituciones` al frontmatter, (2) modificar el `nav` para inyectar sub-items debajo de "Instituciones" y actualizar el `href` + `sub` de esa entrada.

- [ ] **Step 1: Reemplazar el bloque frontmatter de Sidebar.astro**

Leer `app/src/components/shell/Sidebar.astro` primero. Luego reemplazar el bloque frontmatter completo (entre `---`) con:

```ts
import { Home, Thermometer, Building2, TrendingUp, BookOpen } from 'lucide-react';
import SfmLogo from '~/components/shell/SfmLogo.astro';
import { SidebarToggle } from '~/components/shell/SidebarToggle';
import { DataFreshnessBadge } from '~/components/DataFreshnessBadge';
import { loadSfmData } from '~/data/loader';

const data = loadSfmData();
const lastUpdated = data.ultima_actualizacion;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const path = Astro.url.pathname;

const TABS = [
  {
    href: `${base}/`,
    label: 'Resumen',
    sub: 'FX · Tasas',
    match: new RegExp(`^${base}\\/?$`),
    Icon: Home,
  },
  {
    href: `${base}/riesgo`,
    label: 'Riesgo Sistémico',
    sub: 'Heatmap',
    match: new RegExp(`^${base}/riesgo`),
    Icon: Thermometer,
  },
  {
    href: `${base}/instituciones/tipos`,
    label: 'Instituciones',
    sub: undefined,
    match: new RegExp(`^${base}/instituciones`),
    Icon: Building2,
  },
  {
    href: `${base}/macro`,
    label: 'Macro',
    sub: 'PIB · IGAE',
    match: new RegExp(`^${base}/macro`),
    Icon: TrendingUp,
  },
  {
    href: `${base}/metodologia`,
    label: 'Metodología',
    sub: undefined,
    match: new RegExp(`^${base}/metodologia`),
    Icon: BookOpen,
  },
] as const;

const isInstituciones = path.startsWith(`${base}/instituciones`);

const SUBNAV = [
  {
    href: `${base}/instituciones/tipos`,
    label: 'Tipos de inst.',
    group: 'overview' as const,
    match: new RegExp(`^${base}/instituciones/tipos`),
  },
  {
    href: `${base}/instituciones/contraste`,
    label: 'Contraste de riesgo',
    group: 'overview' as const,
    match: new RegExp(`^${base}/instituciones/contraste`),
  },
  {
    href: `${base}/instituciones/banca-multiple`,
    label: 'Banca Múltiple',
    group: 'inst' as const,
    match: new RegExp(`^${base}/instituciones/banca-multiple`),
  },
  {
    href: `${base}/instituciones/sofipos`,
    label: 'SoFiPOs',
    group: 'inst' as const,
    match: new RegExp(`^${base}/instituciones/sofipos`),
  },
];
```

- [ ] **Step 2: Actualizar el `<nav>` para inyectar sub-items después de Instituciones**

En el bloque `<nav>`, reemplazar el `.map()` actual con este (agrega el Fragment con sub-nav condicional):

```astro
<nav aria-label="Secciones del dashboard" class="flex-1 py-2">
  {
    TABS.map(({ href, label, sub, match, Icon }) => {
      const active = match.test(path);
      const isInstEntry = href.includes('/instituciones');
      return (
        <>
          <a
            href={href}
            data-astro-prefetch
            aria-current={active ? 'page' : undefined}
            class:list={[
              'nav-link flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md transition-colors group relative',
              active
                ? 'bg-(--color-bg-elev) text-(--color-text) font-medium sidebar-active'
                : 'text-(--color-text-mute) hover:text-(--color-text) hover:bg-(--color-bg-elev)',
            ]}
            title={label}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span class="sidebar-label flex flex-col leading-tight min-w-0">
              <span class="truncate text-sm">{label}</span>
              {sub && (
                <span class="sidebar-subnav text-[10px] font-normal text-(--color-text-mute) truncate">
                  {sub}
                </span>
              )}
            </span>
          </a>
          {isInstEntry && isInstituciones && (
            <div class="instituciones-subnav mx-1 mb-1">
              {SUBNAV.map((item, i) => {
                const subActive = item.match.test(path);
                const prevGroup = i > 0 ? SUBNAV[i - 1]?.group : undefined;
                const showGroupLabel = item.group === 'inst' && prevGroup === 'overview';
                return (
                  <>
                    {showGroupLabel && (
                      <div class="subnav-group-label">Por institución</div>
                    )}
                    <a
                      href={item.href}
                      data-astro-prefetch
                      aria-current={subActive ? 'page' : undefined}
                      class:list={[
                        'subnav-item',
                        subActive && 'subnav-active',
                      ]}
                    >
                      <span class="subnav-dot" aria-hidden="true" />
                      {item.label}
                    </a>
                  </>
                );
              })}
            </div>
          )}
        </>
      );
    })
  }
</nav>
```

- [ ] **Step 3: Agregar CSS de sub-items al bloque `<style is:global>`**

Al final del bloque `<style is:global>` existente (después de la última regla), agregar:

```css
  /* Instituciones sub-nav */
  .subnav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px 5px 26px;
    border-radius: 6px;
    font-size: 0.6875rem;
    color: var(--color-text-mute);
    transition: color 150ms, background 150ms;
    text-decoration: none;
  }
  .subnav-item:hover {
    color: var(--color-text);
    background: var(--color-bg-elev);
  }
  .subnav-item.subnav-active {
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    font-weight: 600;
  }
  .subnav-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
    opacity: 0.5;
  }
  .subnav-item.subnav-active .subnav-dot {
    opacity: 1;
  }
  .subnav-group-label {
    padding: 6px 10px 3px 26px;
    font-size: 0.5625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-mute);
    opacity: 0.5;
  }
  [data-sidebar][data-collapsed="true"] .instituciones-subnav {
    display: none;
  }
```

- [ ] **Step 4: Build**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Esperado: build exitoso. Si hay error sobre `SUBNAV[i - 1]` siendo potencialmente undefined (TypeScript strict `noUncheckedIndexedAccess`), cambiar a `SUBNAV.at(i - 1)?.group`.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/shell/Sidebar.astro
git commit -m "feat(app): Sidebar — accordion sub-nav para Instituciones"
```

---

### Task 6: Eliminar `instituciones.astro`, crear redirect, limpiar y CHANGELOG

**Files:**
- Delete: `app/src/pages/instituciones.astro`
- Delete: `app/src/components/shell/SectorToggle.tsx`
- Create: `app/src/pages/instituciones/index.astro`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Eliminar archivos obsoletos**

```bash
rm /home/pamer/projects/sfm-monitor/app/src/pages/instituciones.astro
rm /home/pamer/projects/sfm-monitor/app/src/components/shell/SectorToggle.tsx
```

- [ ] **Step 2: Crear redirect `instituciones/index.astro`**

Crear `app/src/pages/instituciones/index.astro`:

```astro
---
return Astro.redirect(
  `${import.meta.env.BASE_URL}instituciones/tipos`,
  301,
);
---
```

Si el build falla con "cannot use Astro.redirect in a prerendered page", usar la alternativa: añadir en `app/astro.config.mjs` dentro de `defineConfig({...})`:
```js
redirects: {
  '/instituciones': '/instituciones/tipos',
},
```
Y dejar `instituciones/index.astro` vacío o eliminarlo.

- [ ] **Step 3: Build final**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Esperado: build exitoso, 12 páginas generadas (8 originales − 1 `instituciones` + 5 nuevas sub-páginas = 12). No debe haber referencias rotas a `SectorToggle`.

Si el build falla por `SectorToggle` referenciado en otro archivo, buscar con:
```bash
grep -r "SectorToggle" /home/pamer/projects/sfm-monitor/app/src/
```
y eliminar los imports restantes.

- [ ] **Step 4: Correr tests**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run test
```

Esperado: todos los tests pasan (los tests existentes no tocan páginas directamente).

- [ ] **Step 5: Actualizar CHANGELOG**

En `/home/pamer/projects/sfm-monitor/CHANGELOG.md`, bajo `[Sin publicar]` añadir:

```markdown
### Añadido
- Sub-rutas de Instituciones: `/instituciones/tipos`, `/instituciones/contraste`, `/instituciones/banca-multiple`, `/instituciones/sofipos`
- Accordion sub-nav en sidebar para sección Instituciones (grupo "Por institución" extensible)
- KPI cards (IMOR, IMORA, ICOR, ROA) en sub-página Banca Múltiple
- Redirect 301 de `/instituciones` a `/instituciones/tipos`

### Eliminado
- `SectorToggle` y script `sfm:sector-change` — reemplazados por rutas separadas
- Página monolítica `instituciones.astro` — dividida en 4 sub-páginas
```

- [ ] **Step 6: Commit final**

```bash
git add app/src/pages/instituciones/index.astro CHANGELOG.md
git rm app/src/pages/instituciones.astro
git rm app/src/components/shell/SectorToggle.tsx
git commit -m "refactor(app): instituciones — rutas separadas, elimina toggle monolítico"
```

---

## Notas para el implementador

- **Tailwind v4**: usar `(--color-x)` NO `[--color-x]` en clases Tailwind. Ej: `text-(--color-accent)`, no `text-[--color-accent]`.
- **`noUncheckedIndexedAccess`**: el proyecto tiene esta opción activa. Accesos a arrays con índice (`arr[i]`) pueden devolver `T | undefined`. Usar `.at()` o guardar en variable antes de usar.
- **Fragment en Astro**: `<>...</>` funciona como Fragment en templates `.astro`. Úsalo para devolver múltiples elementos en el `.map()`.
- **Import type relativo en sub-páginas**: los archivos en `instituciones/` están un nivel más profundo que los de `pages/`. El import type de `BancosTable` usa `../../components/...` en lugar de `../components/...`.
- **Build es el test principal**: las páginas Astro no tienen unit tests propios. El build con `astro check` valida tipos y templates.
