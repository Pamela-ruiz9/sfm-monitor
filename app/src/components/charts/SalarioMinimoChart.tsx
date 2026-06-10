import { Bar } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface SalarioPoint {
  fecha: string; // YYYY-MM-DD — cambia en enero de cada año
  valor: number; // MXN/día
}

interface Props {
  series: SalarioPoint[];
}

export function SalarioMinimoChart({ series }: Props) {
  // Una barra por entrada — el pipeline ya captura solo los cambios (paso anual)
  const sorted = [...series].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const labels = sorted.map((p) => p.fecha.slice(0, 4)); // año
  const values = sorted.map((p) => p.valor);

  const data = {
    labels,
    datasets: [
      {
        label: 'Salario mínimo general (MXN/día)',
        data: values,
        backgroundColor: 'rgba(245, 121, 60, 0.75)',
        borderColor: '#f5793c',
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Salario mínimo">
      <div className="h-56 md:h-64 -mx-1">
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const v = ctx.parsed.y;
                    return v == null ? '—' : `$${v.toFixed(2)} MXN/día`;
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: { color: '#94a3b8', font: { size: 11 } },
                grid: { display: false },
              },
              y: {
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `$${Number(v).toFixed(0)}`,
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
