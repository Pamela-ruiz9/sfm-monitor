# SFM Risk Monitor 📊
**Monitor de Riesgo del Sistema Financiero Mexicano**

Dashboard público de riesgo financiero para México — datos reales de CNBV y Banxico.

🔗 **Live:** [pamela-ruiz9.github.io/sfm-monitor](https://pamela-ruiz9.github.io/sfm-monitor)
📋 **Roadmap:** [pamela-ruiz9.github.io/sfm-monitor/roadmap.html](https://pamela-ruiz9.github.io/sfm-monitor/roadmap.html)

---

## 🎯 Qué hace

Agrega indicadores de riesgo del sistema financiero mexicano en un solo dashboard:

- **Riesgo de Crédito** — IMOR, IMORA, Cobertura (ICOR), IFRS9 etapas 1/2/3
- **Riesgo de Mercado** — Tipo de cambio FIX, Tasa de referencia Banxico, TIIE 28d
- **Contexto Macro** — Inflación (INPC), PIB, Reservas internacionales
- **Comparativo sectorial** — Banca Múltiple vs Sociedades Financieras Populares (SoFiPOs)

---

## 📡 Fuentes de datos

| Indicador | Fuente | Frecuencia | Método |
|---|---|---|---|
| IMOR, ICOR, IMORA, ROA, ROE | CNBV — Portafolio de Información (Sector 40) | Mensual | Archivo CSV procesado |
| IFRS9 Etapas 1/2/3 | CNBV — Reporte R12A | Mensual | Archivo CSV procesado |
| SoFiPOs IMOR | CNBV — Portafolio de Información | Mensual | Archivo Excel procesado |
| Tipo de cambio FIX | Banxico SIE — Serie SF43718 | Diaria | API automática |
| Tasa objetivo Banxico | Banxico SIE — Serie SF61745 | Por decisión | API automática |
| TIIE 28 días | Banxico SIE — Serie SF43783 | Diaria | API automática |
| Inflación (INPC) | Banxico SIE — Serie SP74625 | Mensual | API automática |

**Token Banxico SIE:** guardado en `credentials/banxico.env` (límite 10K consultas/día)

---

## 🏗️ Arquitectura

```
sfm-monitor/
├── index.html          — Dashboard principal (HTML/CSS/JS auto-contenido)
├── roadmap.html        — Cuaderno de trabajo interactivo
├── data/
│   └── sfm-data.json   — Todos los datos históricos procesados
├── raw-data/           — Archivos originales de CNBV (.gitignored por tamaño)
│   ├── cnbv_indicadores.json  — IMOR histórico por banco y segmento
│   ├── sofipos_catalogo.xlsx  — Datos SoFiPOs por cartera
│   └── ifrs9_bm.zip           — Datos IFRS9 Banca Múltiple
└── .github/
    └── workflows/
        └── update-data.yml    — GitHub Actions: actualización diaria Banxico
```

---

## ⚡ Actualización automática

**GitHub Actions** corre lunes a viernes a las **8:00 AM CDMX** y actualiza:
- Tipo de cambio FIX del día (Banxico SF43718)
- Tasa objetivo Banxico (SF61745)
- TIIE 28 días (SF43783)
- Inflación anual calculada del INPC (SP74625)

Los datos de CNBV (IMOR, ICOR, IFRS9) se actualizan **manualmente** cuando CNBV publica el nuevo mes (~30 días de rezago).

---

## 📊 Indicadores disponibles

### Riesgo de Crédito — Banca Múltiple (desde dic 2000)
- **IMOR total** — 2.20% (feb 2026) 🟢
- **IMOR por segmento** — Comercial 1.45% | Consumo 3.44% | Vivienda 3.06% | Tarjeta 3.43%
- **IMOR por banco G-7** — BBVA 1.61% | Inbursa 0.95% | Scotiabank 4.18% (feb 2026)
- **IMORA** — 4.31% (ajustado por reestructuras)
- **ICOR** — 148.6% (cobertura de reservas)
- **ROA** — 1.97% | **ROE** — 17.0%

### IFRS 9 — Etapas de riesgo (desde ene 2022)
- **Etapa 1** (performing): 95.7%
- **Etapa 2** (watch/alerta): 2.1% ⚠️ en tendencia ascendente desde 1.8% en 2022
- **Etapa 3** (default): 2.2%

### SoFiPOs (desde ene 2016)
- **IMOR total**: 9.91% (dic 2025) — 4.5x mayor que Banca Múltiple
- **IMOR Vivienda**: 31.1% — el segmento más deteriorado
- **ROA**: -1.21% — sector operando con pérdidas
- **IMORA**: 21.36%

### Mercado y Macro
- **FX MXN/USD**: $17.40 (24 abr 2026) | histórico desde 1994
- **Tasa Banxico**: 6.75% (ciclo de recortes en curso)
- **TIIE 28d**: 7.02%
- **Inflación anual**: 4.45% (mar 2026) — por encima del objetivo 3% ±1%

---

## 🗺️ Roadmap

| Fase | Estado | Descripción |
|---|---|---|
| **Fase 1** | ✅ Completada | Dashboard base con 4 módulos, deploy en GitHub Pages |
| **Fase 2** | ✅ Completada | Datos reales de Banxico, GitHub Actions diario, JSON de datos |
| **Fase 3** | 🔄 En progreso | Datos CNBV reales, IFRS9, SoFiPOs, semáforo calculado |
| **Fase 4** | 📋 Pendiente | Banca de Desarrollo, spread soberano, comparación internacional |

Ver roadmap interactivo en [roadmap.html](https://pamela-ruiz9.github.io/sfm-monitor/roadmap.html)

---

## 🛠️ Stack técnico

- **Frontend**: HTML/CSS/JS puro — sin frameworks
- **Charts**: Chart.js 4 + chartjs-plugin-annotation
- **Datos**: JSON estático servido con GitHub Pages
- **CI/CD**: GitHub Actions para actualización automática
- **Hosting**: GitHub Pages (gratuito)

---

## 👩‍💻 Autora

**Pame Ruiz** — Científica de datos, BBVA México
Proyecto personal para monitoreo del Sistema Financiero Mexicano.

_Datos de fuentes públicas oficiales. No constituye asesoría financiera._
