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

// ── Panel ────────────────────────────────────────────────────────────────────

function Pill({ yes, label }: { yes: boolean; label: string }) {
  const color = yes ? '#3fb950' : '#f85149';
  const text = yes ? '✓ SÍ' : '✗ NO';
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span
        className="inline-block font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}`, color }}
      >
        {text}
      </span>
      <span className="text-[11px] text-[--color-text-mute]">{label}</span>
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
          <div className="text-sm font-semibold text-[--color-text]">{d.name}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest mt-0.5" style={{ color: d.color }}>
            {d.figure}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[--color-text-mute] hover:text-[--color-text] text-base leading-none mt-0.5 shrink-0"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="border-t border-[--color-border-soft] pt-3 space-y-0.5">
        <Pill yes={d.capta}   label="Capta ahorro del público" />
        <Pill yes={d.credito} label="Otorga crédito" />
        <Pill yes={d.mercado} label="Mercado de valores" />
      </div>

      <div className="border-t border-[--color-border-soft] pt-3 space-y-1.5">
        <div className="flex gap-2 text-[11px]">
          <span className="text-[--color-text-mute] shrink-0">Regulador:</span>
          <span className="font-semibold text-[--color-text]">{d.regulador}</span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="text-[--color-text-mute] shrink-0">Ley:</span>
          <span className="text-[--color-text] leading-relaxed">{d.ley}</span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="text-[--color-text-mute] shrink-0">Protección:</span>
          <span className="text-[--color-text]">{d.proteccion}</span>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[--color-text-dim] border-t border-[--color-border-soft] pt-3">
        {d.descripcion}
      </p>

      <div className="border-t border-[--color-border-soft] pt-3">
        <div className="text-[9px] font-mono uppercase tracking-widest text-[--color-text-mute] mb-2">Ejemplos</div>
        <div className="flex flex-wrap gap-1">
          {d.ejemplos.map((e) => (
            <span
              key={e}
              className="bg-[--color-border-soft] text-[--color-text-dim] font-mono text-[10px] px-2 py-0.5 rounded"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SVG Venn ─────────────────────────────────────────────────────────────────

function NodeDot({
  cx, cy, r = 10, fill, stroke, label, label2, labelColor, labelDark = false, nodeId, selected, onSelect,
}: {
  cx: number; cy: number; r?: number;
  fill: string; stroke: string;
  label: string; label2?: string;
  labelColor?: string; labelDark?: boolean;
  nodeId: string; selected: boolean;
  onSelect: (id: string) => void;
}) {
  const textFill = labelDark ? '#1a1a1a' : '#e6edf3';
  const labelY = cy - r - (label2 ? 18 : 12);
  return (
    <g
      onClick={() => onSelect(nodeId)}
      className="cursor-pointer"
      role="button"
      aria-label={label}
    >
      <circle
        cx={cx} cy={cy} r={selected ? r + 2 : r}
        fill={fill} stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        fillOpacity={selected ? 1 : 0.85}
        style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
      />
      {label2 ? (
        <>
          <text x={cx} y={labelY}       textAnchor="middle" fill={textFill} fontSize={8} fontFamily="monospace">{label}</text>
          <text x={cx} y={labelY + 10} textAnchor="middle" fill={textFill} fontSize={8} fontFamily="monospace">{label2}</text>
        </>
      ) : (
        <text x={cx} y={labelY} textAnchor="middle" fill={textFill} fontSize={8} fontFamily="monospace">{label}</text>
      )}
      {labelColor && (
        <text x={cx} y={labelY + (label2 ? 20 : 10)} textAnchor="middle" fill={labelColor} fontSize={7} fontFamily="monospace">
          {label2 ? '(Fintech)' : ''}
        </text>
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
      {/* Main layout: SVG + panel */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* SVG Venn */}
        <div className="flex-1 min-w-0">
          <svg
            viewBox="0 0 620 520"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
            aria-label="Diagrama de Venn del Sistema Financiero Mexicano"
          >
            <defs>
              <filter id="sfm-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Zone A: Capta Ahorro */}
            <g>
              <circle cx={230} cy={230} r={170} fill="#ff6b6b" stroke="#ff6b6b" strokeWidth={1.5} fillOpacity={0.13} />
              <text fill="#ff6b6b" x={100} y={120} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.9}>CAPTA</text>
              <text fill="#ff6b6b" x={100} y={137} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.9}>AHORRO</text>
              <text fill="#ff6b6b" x={100} y={152} textAnchor="middle" fontSize={9} fontFamily="monospace" fillOpacity={0.55}>depósitos del público</text>
            </g>

            {/* Zone B: Otorga Crédito */}
            <g>
              <circle cx={390} cy={230} r={170} fill="#4ecdc4" stroke="#4ecdc4" strokeWidth={1.5} fillOpacity={0.13} />
              <text fill="#4ecdc4" x={530} y={120} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.9}>OTORGA</text>
              <text fill="#4ecdc4" x={530} y={137} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.9}>CRÉDITO</text>
              <text fill="#4ecdc4" x={530} y={152} textAnchor="middle" fontSize={9} fontFamily="monospace" fillOpacity={0.55}>préstamos y financiamiento</text>
            </g>

            {/* Zone C: Mercado de Valores */}
            <g>
              <circle cx={310} cy={370} r={130} fill="#ffd93d" stroke="#ffd93d" strokeWidth={1.5} fillOpacity={0.13} />
              <text fill="#ffd93d" x={310} y={490} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="sans-serif" fillOpacity={0.9}>MERCADO DE VALORES</text>
              <text fill="#ffd93d" x={310} y={505} textAnchor="middle" fontSize={9} fontFamily="monospace" fillOpacity={0.55}>inversión · bolsa · fondos</text>
            </g>

            {/* Banco Múltiple — center, all 3 zones */}
            <g onClick={() => handleSelect('banco')} className="cursor-pointer" filter="url(#sfm-glow)" role="button" aria-label="Banco Múltiple">
              <circle cx={310} cy={230} r={selected === 'banco' ? 16 : 14} fill="#ff9f43" stroke="#ffcc80" strokeWidth={selected === 'banco' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#fff" x={310} y={234} textAnchor="middle" fontSize={8} fontWeight="bold" fontFamily="monospace">BANCO</text>
            </g>

            {/* Banca Desarrollo — capta + crédito */}
            <NodeDot cx={310} cy={195} nodeId="bancadesarrollo" selected={selected === 'bancadesarrollo'} onSelect={handleSelect}
              fill="#ff9f43" stroke="#ffcc80" label="BANCA" label2="DESARROLLO" />

            {/* SOFIPO — capta + crédito */}
            <NodeDot cx={278} cy={260} nodeId="sofipo" selected={selected === 'sofipo'} onSelect={handleSelect}
              fill="#ff6b6b" stroke="#ffaaaa" label="SOFIPO" />

            {/* SOCAP — capta + crédito */}
            <NodeDot cx={278} cy={295} nodeId="socap" selected={selected === 'socap'} onSelect={handleSelect}
              fill="#ff6b6b" stroke="#ffaaaa" label="SOCAP" />

            {/* SOFOM ER — solo crédito */}
            <NodeDot cx={430} cy={210} nodeId="sofomer" selected={selected === 'sofomer'} onSelect={handleSelect}
              fill="#4ecdc4" stroke="#80eeea" label="SOFOM ER" />

            {/* SOFOM ENR — solo crédito */}
            <NodeDot cx={458} cy={240} nodeId="sofomenr" selected={selected === 'sofomenr'} onSelect={handleSelect}
              fill="#4ecdc4" stroke="#80eeea" label="SOFOM ENR" />

            {/* IFC Fintech — crédito */}
            <g onClick={() => handleSelect('ifc')} className="cursor-pointer" role="button" aria-label="IFC Fintech">
              <circle cx={445} cy={170} r={selected === 'ifc' ? 12 : 10} fill="#a29bfe" stroke="#d0c8ff" strokeWidth={selected === 'ifc' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#e6edf3" x={460} y={158} textAnchor="middle" fontSize={8} fontFamily="monospace">IFC</text>
              <text fill="#a29bfe" x={460} y={148} textAnchor="middle" fontSize={7} fontFamily="monospace">(Fintech)</text>
            </g>

            {/* IFPE Fintech — fuera */}
            <g onClick={() => handleSelect('ifpe')} className="cursor-pointer" role="button" aria-label="IFPE Fintech">
              <circle cx={520} cy={130} r={selected === 'ifpe' ? 12 : 10} fill="#a29bfe" stroke="#d0c8ff" strokeWidth={selected === 'ifpe' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#e6edf3" x={535} y={118} textAnchor="middle" fontSize={8} fontFamily="monospace">IFPE</text>
              <text fill="#a29bfe" x={535} y={108} textAnchor="middle" fontSize={7} fontFamily="monospace">(Fintech)</text>
            </g>

            {/* Casa de Bolsa — mercado */}
            <g onClick={() => handleSelect('casabolsa')} className="cursor-pointer" role="button" aria-label="Casa de Bolsa">
              <circle cx={270} cy={420} r={selected === 'casabolsa' ? 12 : 10} fill="#ffd93d" stroke="#ffe98a" strokeWidth={selected === 'casabolsa' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#1a1a1a" x={258} y={408} textAnchor="middle" fontSize={8} fontFamily="monospace">CASA</text>
              <text fill="#1a1a1a" x={258} y={398} textAnchor="middle" fontSize={8} fontFamily="monospace">BOLSA</text>
            </g>

            {/* Sociedad de Inversión — mercado */}
            <g onClick={() => handleSelect('socinversion')} className="cursor-pointer" role="button" aria-label="Sociedad de Inversión">
              <circle cx={350} cy={430} r={selected === 'socinversion' ? 12 : 10} fill="#ffd93d" stroke="#ffe98a" strokeWidth={selected === 'socinversion' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#1a1a1a" x={365} y={418} textAnchor="middle" fontSize={8} fontFamily="monospace">SOC.</text>
              <text fill="#1a1a1a" x={365} y={408} textAnchor="middle" fontSize={8} fontFamily="monospace">INVERSIÓN</text>
            </g>

            {/* AFORE — fuera */}
            <g onClick={() => handleSelect('afore')} className="cursor-pointer" role="button" aria-label="AFORE">
              <circle cx={80} cy={390} r={selected === 'afore' ? 12 : 10} fill="#fd79a8" stroke="#ffb3cc" strokeWidth={selected === 'afore' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#e6edf3" x={80} y={378} textAnchor="middle" fontSize={8} fontFamily="monospace">AFORE</text>
              <text fill="#fd79a8" x={80} y={368} textAnchor="middle" fontSize={7} fontFamily="monospace">(retiro)</text>
            </g>

            {/* Aseguradora — fuera */}
            <g onClick={() => handleSelect('aseguradora')} className="cursor-pointer" role="button" aria-label="Aseguradora">
              <circle cx={80} cy={130} r={selected === 'aseguradora' ? 12 : 10} fill="#6c5ce7" stroke="#b2a4ff" strokeWidth={selected === 'aseguradora' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#e6edf3" x={80} y={118} textAnchor="middle" fontSize={8} fontFamily="monospace">ASEGURADORA</text>
            </g>

            {/* Centro Cambiario — fuera */}
            <g onClick={() => handleSelect('cambiario')} className="cursor-pointer" role="button" aria-label="Centro Cambiario">
              <circle cx={545} cy={370} r={selected === 'cambiario' ? 12 : 10} fill="#00b894" stroke="#55efc4" strokeWidth={selected === 'cambiario' ? 2.5 : 1.5} style={{ transition: 'r 0.15s' }} />
              <text fill="#e6edf3" x={545} y={358} textAnchor="middle" fontSize={8} fontFamily="monospace">CENTRO</text>
              <text fill="#e6edf3" x={545} y={348} textAnchor="middle" fontSize={8} fontFamily="monospace">CAMBIARIO</text>
            </g>
          </svg>
        </div>

        {/* Detail panel */}
        <div className="w-full md:w-[280px] shrink-0">
          <div className="card-surface rounded-xl p-4 min-h-[200px] md:sticky md:top-4">
            {selected ? (
              <DetailPanel id={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[--color-text-mute] text-center py-8">
                <div className="text-3xl opacity-40">⬡</div>
                <p className="text-xs leading-relaxed">
                  Toca cualquier nodo<br />para ver sus detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center pt-2">
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
            <span className="text-[10px] font-mono text-[--color-text-mute]">{label}</span>
          </div>
        ))}
      </div>

      {/* Regulators bar */}
      <div className="flex flex-wrap gap-2 justify-center pt-1">
        {[
          { key: 'SHCP',     desc: 'política financiera' },
          { key: 'CNBV',     desc: 'banca · bolsa · SOFOM · SOFIPO · ITF' },
          { key: 'Banxico',  desc: 'pagos · emisión' },
          { key: 'CONSAR',   desc: 'AFORE · SIEFORE' },
          { key: 'CNSF',     desc: 'seguros · fianzas' },
          { key: 'CONDUSEF', desc: 'defensa del usuario' },
        ].map(({ key, desc }) => (
          <div key={key} className="card-surface rounded-lg px-3 py-1.5 text-[10px] font-mono text-[--color-text-mute]">
            <span className="text-[--color-text] font-bold">{key}</span> — {desc}
          </div>
        ))}
      </div>
    </div>
  );
}
