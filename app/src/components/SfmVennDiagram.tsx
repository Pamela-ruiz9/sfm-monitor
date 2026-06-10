import { useState } from 'react';

// ── Data ────────────────────────────────────────────────────────────────────

interface CardData {
  name: string;
  figure: string;
  color: string;
  capta: boolean;
  credito: boolean;
  mercado: boolean;
  regulador: string;
  ley: string;
  proteccion: string;
  descripcion: string;
  ejemplos: string[];
}

const CARDS: Record<string, CardData> = {
  banco: {
    name: 'Banco Múltiple',
    figure: 'Institución de Crédito',
    color: '#ff9f43',
    capta: true, credito: true, mercado: true,
    regulador: 'CNBV + Banxico',
    ley: 'Ley de Instituciones de Crédito',
    proteccion: 'IPAB (hasta 400K UDIs)',
    descripcion: 'Figura más completa del sistema. Puede captar depósitos, otorgar crédito, ofrecer inversiones, cambio de divisas y más.',
    ejemplos: ['BBVA', 'Santander', 'Banorte', 'HSBC', 'Citibanamex', 'Scotiabank'],
  },
  bancadesarrollo: {
    name: 'Banca de Desarrollo',
    figure: 'Institución de Crédito (pública)',
    color: '#ff9f43',
    capta: true, credito: true, mercado: false,
    regulador: 'CNBV + SHCP',
    ley: 'Leyes orgánicas individuales',
    proteccion: 'Gobierno Federal',
    descripcion: 'Bancos del Estado con mandato social: financiar sectores estratégicos como infraestructura, PyMEs, exportaciones y vivienda.',
    ejemplos: ['NAFIN', 'Banobras', 'Bancomext', 'Banjército', 'SHF'],
  },
  sofipo: {
    name: 'SOFIPO',
    figure: 'Sociedad Financiera Popular',
    color: '#ff6b6b',
    capta: true, credito: true, mercado: false,
    regulador: 'CNBV',
    ley: 'Ley de Ahorro y Crédito Popular',
    proteccion: 'PROSOFIPO (25,000 UDIs)',
    descripcion: 'Microfinanzas orientadas a sectores populares. Puede captar ahorro, dar crédito y emitir tarjetas. Muchas fintech digitales operan bajo esta figura.',
    ejemplos: ['Nu México', 'Stori', 'Klar', 'Finsus', 'Libertad SF', 'Fincomún'],
  },
  socap: {
    name: 'SOCAP',
    figure: 'Sociedad Cooperativa de Ahorro y Préstamo',
    color: '#ff6b6b',
    capta: true, credito: true, mercado: false,
    regulador: 'CNBV',
    ley: 'Ley para Regular las SOCAP',
    proteccion: 'Fondo de Protección (~25K UDIs)',
    descripcion: 'Modelo cooperativo: los usuarios son socios. Una de las figuras con más arraigo social en México, especialmente en comunidades rurales.',
    ejemplos: ['Caja Popular Mexicana', 'COOPDESARROLLO', 'Caja Real del Potosí', 'Caja Sureste'],
  },
  sofomer: {
    name: 'SOFOM ER',
    figure: 'Soc. Financiera de Objeto Múltiple — Regulada',
    color: '#4ecdc4',
    capta: false, credito: true, mercado: false,
    regulador: 'CNBV',
    ley: 'Ley General de Org. y Act. Auxiliares del Crédito',
    proteccion: 'No aplica',
    descripcion: 'Otorga crédito pero NO puede captar depósitos. "Regulada" porque tiene vínculos con un banco o grupo financiero. Supervisada directamente por CNBV.',
    ejemplos: ['AyF Banorte', 'Crédito Familiar', 'Financiera Bajío'],
  },
  sofomenr: {
    name: 'SOFOM ENR',
    figure: 'Soc. Financiera de Objeto Múltiple — No Regulada',
    color: '#4ecdc4',
    capta: false, credito: true, mercado: false,
    regulador: 'CONDUSEF (solo registro)',
    ley: 'Ley General de Org. y Act. Auxiliares del Crédito',
    proteccion: 'No aplica',
    descripcion: 'Otorga crédito sin estar supervisada por CNBV. No requiere autorización previa. Es la figura más fácil y económica de constituir para dar crédito.',
    ejemplos: ['GM Financial', 'Ford Credit MX', 'Cetelem', 'muchas fintechs de crédito'],
  },
  ifc: {
    name: 'IFC',
    figure: 'Institución de Financiamiento Colectivo (ITF)',
    color: '#a29bfe',
    capta: false, credito: true, mercado: false,
    regulador: 'CNBV',
    ley: 'Ley Fintech (2018)',
    proteccion: 'No aplica',
    descripcion: 'Plataforma de crowdfunding regulada. Conecta inversionistas con proyectos (deuda, capital o copropiedad). Es una figura de la Ley Fintech.',
    ejemplos: ['Prestadero', 'Yotepresto', 'Doopla', 'M2Crowd', 'Inverspot'],
  },
  ifpe: {
    name: 'IFPE',
    figure: 'Institución de Fondos de Pago Electrónico (ITF)',
    color: '#a29bfe',
    capta: false, credito: false, mercado: false,
    regulador: 'CNBV + Banxico',
    ley: 'Ley Fintech (2018)',
    proteccion: 'No aplica (fondos en custodia)',
    descripcion: 'Monedero electrónico. Gestiona pagos y transferencias digitales. No puede captar como banco ni dar crédito. Es la otra figura de la Ley Fintech.',
    ejemplos: ['Clip', 'varios wallets digitales', 'plataformas de pago B2B'],
  },
  casabolsa: {
    name: 'Casa de Bolsa',
    figure: 'Intermediario Bursátil',
    color: '#ffd93d',
    capta: false, credito: false, mercado: true,
    regulador: 'CNBV',
    ley: 'Ley del Mercado de Valores',
    proteccion: 'No aplica (riesgo de mercado)',
    descripcion: 'Intermediaria en el mercado de valores. Ejecuta órdenes de compra/venta de acciones, bonos y otros instrumentos en la bolsa.',
    ejemplos: ['GBM', 'Actinver', 'Vector', 'BBVA Bancomer CB', 'Monexcb'],
  },
  socinversion: {
    name: 'Sociedad de Inversión',
    figure: 'Fondo de Inversión',
    color: '#ffd93d',
    capta: false, credito: false, mercado: true,
    regulador: 'CNBV',
    ley: 'Ley de Fondos de Inversión',
    proteccion: 'No aplica (riesgo de mercado)',
    descripcion: 'Fondos que agrupan el dinero de múltiples inversionistas para invertirlo en un portafolio diversificado de instrumentos financieros.',
    ejemplos: ['BlackRock MX', 'Franklin Templeton', 'SURA Fondos', 'BBVA Asset Mgmt'],
  },
  afore: {
    name: 'AFORE',
    figure: 'Administradora de Fondos para el Retiro',
    color: '#fd79a8',
    capta: false, credito: false, mercado: false,
    regulador: 'CONSAR',
    ley: 'Ley de los SAR',
    proteccion: 'CONSAR (Gobierno Federal)',
    descripcion: 'Administra las cuentas individuales de ahorro para el retiro. Los fondos se invierten a través de SIEFOREs. Regulada por CONSAR, no por CNBV.',
    ejemplos: ['AFORE XXI Banorte', 'SURA', 'Citibanamex AFORE', 'Coppel AFORE', 'Principal'],
  },
  aseguradora: {
    name: 'Aseguradora / Afianzadora',
    figure: 'Institución de Seguros y Fianzas',
    color: '#6c5ce7',
    capta: false, credito: false, mercado: false,
    regulador: 'CNSF',
    ley: 'Ley de Instituciones de Seguros y Fianzas',
    proteccion: 'Fondo de Garantía (CNSF)',
    descripcion: 'Transfiere riesgos mediante primas. Las aseguradoras cubren siniestros (vida, auto, salud). Las afianzadoras garantizan el cumplimiento de obligaciones.',
    ejemplos: ['GNP', 'MetLife', 'Mapfre', 'Quálitas', 'AXA', 'HDI Seguros'],
  },
  cambiario: {
    name: 'Centro Cambiario / Transmisor',
    figure: 'Organización Auxiliar del Crédito',
    color: '#00b894',
    capta: false, credito: false, mercado: false,
    regulador: 'CNBV + SAT',
    ley: 'Ley General de Org. y Act. Auxiliares del Crédito',
    proteccion: 'No aplica',
    descripcion: 'Realizan cambio de divisas y/o transmisión de remesas. No captan depósitos ni dan crédito. Muy importantes por el volumen de remesas que recibe México.',
    ejemplos: ['Western Union', 'MoneyGram', 'Intermex', 'Multiva Casa de Cambio'],
  },
};

// ── Panel ─────────────────────────────────────────────────────────────────────

function Pill({ yes, label }: { yes: boolean; label: string }) {
  const color = yes ? '#3fb950' : '#f85149';
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span
        className="inline-block font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}`, color }}
      >
        {yes ? '✓ SÍ' : '✗ NO'}
      </span>
      <span className="text-[11px] text-(--color-text-mute)">{label}</span>
    </div>
  );
}

function DetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const d = CARDS[id];
  if (!d) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-(--color-text)">{d.name}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest mt-0.5" style={{ color: d.color }}>
            {d.figure}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-(--color-text-mute) hover:text-(--color-text) text-base leading-none mt-0.5 shrink-0"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="border-t border-(--color-border-soft) pt-3 space-y-0.5">
        <Pill yes={d.capta}   label="Capta ahorro del público" />
        <Pill yes={d.credito} label="Otorga crédito" />
        <Pill yes={d.mercado} label="Mercado de valores" />
      </div>

      <div className="border-t border-(--color-border-soft) pt-3 space-y-1.5">
        <div className="flex gap-2 text-[11px]">
          <span className="text-(--color-text-mute) shrink-0">Regulador:</span>
          <span className="font-semibold text-(--color-text)">{d.regulador}</span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="text-(--color-text-mute) shrink-0">Ley:</span>
          <span className="text-(--color-text) leading-relaxed">{d.ley}</span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="text-(--color-text-mute) shrink-0">Protección:</span>
          <span className="text-(--color-text)">{d.proteccion}</span>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-(--color-text-dim) border-t border-(--color-border-soft) pt-3">
        {d.descripcion}
      </p>

      <div className="border-t border-(--color-border-soft) pt-3">
        <div className="text-[9px] font-mono uppercase tracking-widest text-(--color-text-mute) mb-2">Ejemplos</div>
        <div className="flex flex-wrap gap-1">
          {d.ejemplos.map((e) => (
            <span
              key={e}
              className="bg-(--color-border-soft) text-(--color-text-dim) font-mono text-[10px] px-2 py-0.5 rounded"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// SVG text with a dark stroke "halo" so labels are readable on colored zones
const HALO: React.SVGProps<SVGTextElement> = {
  stroke: '#0d1117',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  paintOrder: 'stroke',
};

// Node with precisely-controlled label placement
interface NodeProps {
  cx: number;
  cy: number;
  r?: number;
  fill: string;
  stroke: string;
  /** Lines of label text */
  lines: string[];
  /** 'above' | 'below' | 'left' | 'right' | 'inside' */
  labelDir: 'above' | 'below' | 'left' | 'right' | 'inside';
  /** Secondary small text (e.g. "(Fintech)") shown after main lines */
  sub?: string;
  subColor?: string;
  nodeId: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

function Node({
  cx, cy, r = 10, fill, stroke,
  lines, labelDir, sub, subColor,
  nodeId, selected, onSelect,
}: NodeProps) {
  const rr = selected ? r + 2 : r;
  const GAP = 4;
  const LINE_H = 10;

  let textX = cx;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  let firstY = cy;

  if (labelDir === 'above') {
    firstY = cy - rr - GAP - (lines.length - 1) * LINE_H;
    textAnchor = 'middle';
  } else if (labelDir === 'below') {
    firstY = cy + rr + GAP + LINE_H;
    textAnchor = 'middle';
  } else if (labelDir === 'left') {
    textX = cx - rr - GAP;
    firstY = cy + 3 - ((lines.length - 1) * LINE_H) / 2;
    textAnchor = 'end';
  } else if (labelDir === 'right') {
    textX = cx + rr + GAP;
    firstY = cy + 3 - ((lines.length - 1) * LINE_H) / 2;
    textAnchor = 'start';
  }
  // 'inside': text centered inside the circle (handled separately)

  return (
    <g
      onClick={() => onSelect(nodeId)}
      className="cursor-pointer"
      role="button"
      aria-label={lines.join(' ')}
    >
      <circle
        cx={cx} cy={cy} r={rr}
        fill={fill} stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
      />
      {labelDir === 'inside' ? (
        lines.map((line, i) => (
          <text
            key={i}
            x={cx} y={cy + 3 + (i - (lines.length - 1) / 2) * LINE_H}
            textAnchor="middle"
            fill="#fff"
            fontSize={8}
            fontWeight="bold"
            fontFamily="monospace"
            {...HALO}
          >
            {line}
          </text>
        ))
      ) : (
        <>
          {lines.map((line, i) => (
            <text
              key={i}
              x={textX} y={firstY + i * LINE_H}
              textAnchor={textAnchor}
              fill="#e6edf3"
              fontSize={8}
              fontFamily="monospace"
              {...HALO}
            >
              {line}
            </text>
          ))}
          {sub && (
            <text
              x={textX}
              y={firstY + lines.length * LINE_H}
              textAnchor={textAnchor}
              fill={subColor ?? '#a29bfe'}
              fontSize={7}
              fontFamily="monospace"
              {...HALO}
            >
              {sub}
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SfmVennDiagram() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">

      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
        {[
          {
            color: '#ff6b6b',
            icon: '🏛️',
            title: '¿Capta ahorro?',
            body: 'Solo las instituciones autorizadas pueden recibir depósitos del público: bancos, SOFIPO, SOCAP y banca de desarrollo.',
          },
          {
            color: '#4ecdc4',
            icon: '💳',
            title: '¿Otorga crédito?',
            body: 'Pueden dar préstamos: bancos, SOFOM, IFC (crowdfunding), SOFIPO, SOCAP y banca de desarrollo.',
          },
          {
            color: '#ffd93d',
            icon: '📈',
            title: '¿Opera en bolsa?',
            body: 'Las casas de bolsa y sociedades de inversión intermedian en mercados de valores. Los bancos también pueden.',
          },
        ].map(({ color, icon, title, body }) => (
          <div
            key={title}
            className="card-surface rounded-lg p-3 flex gap-2.5"
            style={{ borderColor: `${color}44` }}
          >
            <span className="text-base shrink-0 mt-0.5">{icon}</span>
            <div>
              <div className="font-semibold text-(--color-text) mb-1" style={{ color }}>{title}</div>
              <p className="text-(--color-text-mute) leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SVG + Panel ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* SVG Venn */}
        <div className="flex-1 min-w-0">
          <svg
            viewBox="0 0 660 548"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
            aria-label="Diagrama de Venn del Sistema Financiero Mexicano"
          >
            <defs>
              <filter id="sfm-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Zone circles ── */}

            {/* A: CAPTA AHORRO — upper-left */}
            <circle cx={235} cy={228} r={168} fill="#ff6b6b" stroke="#ff6b6b" strokeWidth={1.5} fillOpacity={0.12} />

            {/* B: OTORGA CRÉDITO — upper-right */}
            <circle cx={395} cy={228} r={168} fill="#4ecdc4" stroke="#4ecdc4" strokeWidth={1.5} fillOpacity={0.12} />

            {/* C: MERCADO VALORES — bottom-center (cy=400 → top edge at y=270, below A∩B nodes) */}
            <circle cx={312} cy={400} r={130} fill="#ffd93d" stroke="#ffd93d" strokeWidth={1.5} fillOpacity={0.12} />

            {/* ── Zone labels: positioned in uncluttered areas ── */}

            {/* Zone A label — left side of circle, between SOCAP (y≈312) and AFORE (y≈418) */}
            <text x={78} y={348} textAnchor="middle" fill="#ff6b6b" fontSize={12} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.85} {...HALO}>CAPTA</text>
            <text x={78} y={362} textAnchor="middle" fill="#ff6b6b" fontSize={12} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.85} {...HALO}>AHORRO</text>
            <text x={78} y={374} textAnchor="middle" fill="#ff6b6b" fontSize={8} fontFamily="monospace" fillOpacity={0.5}>depósitos del público</text>

            {/* Zone B label — right side of circle, below SOFOM ENR (y≈244) */}
            <text x={546} y={310} textAnchor="middle" fill="#4ecdc4" fontSize={12} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.85} {...HALO}>OTORGA</text>
            <text x={546} y={324} textAnchor="middle" fill="#4ecdc4" fontSize={12} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.85} {...HALO}>CRÉDITO</text>
            <text x={546} y={336} textAnchor="middle" fill="#4ecdc4" fontSize={8} fontFamily="monospace" fillOpacity={0.5}>préstamos y financiamiento</text>

            {/* Zone C label — below circle (cy=400+r=130 → bottom at y=530) */}
            <text x={312} y={522} textAnchor="middle" fill="#ffd93d" fontSize={12} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.85} {...HALO}>MERCADO DE VALORES</text>
            <text x={312} y={535} textAnchor="middle" fill="#ffd93d" fontSize={8} fontFamily="monospace" fillOpacity={0.5}>inversión · bolsa · fondos</text>

            {/* ── Nodes ── */}

            {/* BANCO — center of all three zones (cy=290: in A∩B∩C), glow effect */}
            <g
              onClick={() => handleSelect('banco')}
              className="cursor-pointer"
              filter="url(#sfm-glow)"
              role="button"
              aria-label="Banco Múltiple"
            >
              <circle
                cx={312} cy={290} r={selected === 'banco' ? 17 : 15}
                fill="#ff9f43" stroke="#ffcc80"
                strokeWidth={selected === 'banco' ? 2.5 : 1.5}
                style={{ transition: 'r 0.15s' }}
              />
              <text x={312} y={294} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold" fontFamily="monospace" {...HALO}>
                BANCO
              </text>
            </g>

            {/* BANCA DESARROLLO — A∩B overlap, above BANCO */}
            <Node cx={312} cy={186} nodeId="bancadesarrollo" selected={selected === 'bancadesarrollo'} onSelect={handleSelect}
              fill="#ff9f43" stroke="#ffcc80"
              lines={['BANCA', 'DESARROLLO']} labelDir="above" />

            {/* SOFIPO — A∩B overlap, above zone-C edge (cy=248 < 270=top of C) */}
            <Node cx={265} cy={248} nodeId="sofipo" selected={selected === 'sofipo'} onSelect={handleSelect}
              fill="#ff6b6b" stroke="#ffaaaa"
              lines={['SOFIPO']} labelDir="left" />

            {/* SOCAP — A∩B overlap, above zone-C edge (cy=266 < 270=top of C) */}
            <Node cx={248} cy={266} nodeId="socap" selected={selected === 'socap'} onSelect={handleSelect}
              fill="#ff6b6b" stroke="#ffaaaa"
              lines={['SOCAP']} labelDir="left" />

            {/* SOFOM ER — B only, right side */}
            <Node cx={454} cy={192} nodeId="sofomer" selected={selected === 'sofomer'} onSelect={handleSelect}
              fill="#4ecdc4" stroke="#80eeea"
              lines={['SOFOM ER']} labelDir="right" />

            {/* SOFOM ENR — B only, right side below ER */}
            <Node cx={476} cy={244} nodeId="sofomenr" selected={selected === 'sofomenr'} onSelect={handleSelect}
              fill="#4ecdc4" stroke="#80eeea"
              lines={['SOFOM ENR']} labelDir="right" />

            {/* IFC — B fintech, upper right of circle */}
            <Node cx={456} cy={144} nodeId="ifc" selected={selected === 'ifc'} onSelect={handleSelect}
              fill="#a29bfe" stroke="#d0c8ff"
              lines={['IFC']} labelDir="above" sub="(Fintech)" subColor="#a29bfe" />

            {/* IFPE — outside all zones, upper right corner */}
            <Node cx={576} cy={96} nodeId="ifpe" selected={selected === 'ifpe'} onSelect={handleSelect}
              fill="#a29bfe" stroke="#d0c8ff"
              lines={['IFPE']} labelDir="below" sub="(Fintech)" subColor="#a29bfe" />

            {/* Casa de Bolsa — C only, lower-left (circle C cy=400,r=130 → bottom at 530) */}
            <Node cx={258} cy={452} nodeId="casabolsa" selected={selected === 'casabolsa'} onSelect={handleSelect}
              fill="#ffd93d" stroke="#ffe98a"
              lines={['CASA', 'BOLSA']} labelDir="left" />

            {/* Sociedad de Inversión — C only, lower-right */}
            <Node cx={366} cy={458} nodeId="socinversion" selected={selected === 'socinversion'} onSelect={handleSelect}
              fill="#ffd93d" stroke="#ffe98a"
              lines={['SOC.', 'INVERSIÓN']} labelDir="right" />

            {/* AFORE — outside, lower-left corner */}
            <Node cx={52} cy={416} nodeId="afore" selected={selected === 'afore'} onSelect={handleSelect}
              fill="#fd79a8" stroke="#ffb3cc"
              lines={['AFORE']} labelDir="above" sub="(retiro)" subColor="#fd79a8" />

            {/* Aseguradora — outside, upper-left (far from zone A label) */}
            <Node cx={52} cy={116} nodeId="aseguradora" selected={selected === 'aseguradora'} onSelect={handleSelect}
              fill="#6c5ce7" stroke="#b2a4ff"
              lines={['ASEGURADORA']} labelDir="below" />

            {/* Centro Cambiario — outside, right side */}
            <Node cx={622} cy={374} nodeId="cambiario" selected={selected === 'cambiario'} onSelect={handleSelect}
              fill="#00b894" stroke="#55efc4"
              lines={['CENTRO', 'CAMBIARIO']} labelDir="above" />

          </svg>
        </div>

        {/* Detail panel */}
        <div className="w-full md:w-[272px] shrink-0">
          <div className="card-surface rounded-xl p-4 min-h-[200px] md:sticky md:top-4">
            {selected ? (
              <DetailPanel id={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-(--color-text-mute) text-center py-8">
                <div className="text-3xl opacity-40">⬡</div>
                <p className="text-xs leading-relaxed">
                  Toca cualquier nodo<br />para ver sus detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center pt-1">
        {[
          { color: '#ff6b6b', label: 'Capta ahorro del público' },
          { color: '#4ecdc4', label: 'Otorga crédito' },
          { color: '#ffd93d', label: 'Mercado de valores' },
          { color: '#ff9f43', label: 'Todas las funciones (banco)' },
          { color: '#a29bfe', label: 'Fintech (ITF)' },
          { color: '#fd79a8', label: 'Ahorro para el retiro' },
          { color: '#6c5ce7', label: 'Seguros y fianzas' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 border-2"
              style={{ background: `${color}33`, borderColor: color }}
            />
            <span className="text-[10px] font-mono text-(--color-text-mute)">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Regulators bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 justify-center pt-1">
        {[
          { key: 'SHCP',     desc: 'política financiera' },
          { key: 'CNBV',     desc: 'banca · bolsa · SOFOM · SOFIPO · ITF' },
          { key: 'Banxico',  desc: 'pagos · emisión' },
          { key: 'CONSAR',   desc: 'AFORE · SIEFORE' },
          { key: 'CNSF',     desc: 'seguros · fianzas' },
          { key: 'CONDUSEF', desc: 'defensa del usuario' },
        ].map(({ key, desc }) => (
          <div key={key} className="card-surface rounded-lg px-3 py-1.5 text-[10px] font-mono text-(--color-text-mute)">
            <span className="text-(--color-text) font-bold">{key}</span> — {desc}
          </div>
        ))}
      </div>
    </div>
  );
}
