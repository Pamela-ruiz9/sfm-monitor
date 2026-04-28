import { Component, type PropsWithChildren, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface State {
  error: Error | null;
}

export class ChartErrorBoundary extends Component<
  PropsWithChildren<{ chartName?: string }>,
  State
> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    console.error('[ChartErrorBoundary]', this.props.chartName, error);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 h-64 text-[--color-text-mute] gap-2">
          <AlertTriangle className="size-5 text-[--color-yellow]" aria-hidden="true" />
          <p className="text-xs">
            No se pudo renderizar este gráfico
            {this.props.chartName ? ` (${this.props.chartName})` : ''}.
          </p>
          <a
            href="https://pamela-ruiz9.github.io/sfm-monitor/"
            className="text-xs text-[--color-gold] hover:underline">
            Ver en dashboard estable ↗
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
