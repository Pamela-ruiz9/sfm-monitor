/**
 * Centralized Chart.js registration.
 * Import this file once — all charts share the same ChartJS singleton.
 * Registering plugins multiple times causes "Cannot read properties of
 * undefined (reading 'listened')" at runtime (chartjs-plugin-annotation bug).
 */
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  annotationPlugin,
);

export { ChartJS };
