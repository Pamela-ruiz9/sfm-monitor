import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $onboardingDone } from '~/stores/onboarding';

export function OnboardingTour() {
  const done = useStore($onboardingDone);

  useEffect(() => {
    if (done === 'true') return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    Promise.all([import('driver.js'), import('driver.js/dist/driver.css')]).then(
      ([{ driver }]) => {
        if (cancelled) return;
        const d = driver({
          showProgress: true,
          allowClose: true,
          nextBtnText: 'Siguiente',
          prevBtnText: 'Atrás',
          doneBtnText: 'Listo',
          steps: [
            {
              element: 'h1',
              popover: {
                title: 'Bienvenido a SFM Monitor',
                description:
                  'Dashboard del riesgo del Sistema Financiero Mexicano. Datos oficiales, actualización diaria.',
              },
            },
            {
              element: '[data-tone="gold"]',
              popover: {
                title: 'KPIs principales',
                description:
                  'Cada tarjeta muestra el valor actual y el cambio vs el período anterior. Toca para ver el chart completo y la metodología.',
              },
            },
            {
              element: '[role="tab"][aria-selected="true"]',
              popover: {
                title: 'Navegación por secciones',
                description:
                  'Cinco tabs: Resumen, Mercado, Crédito, SoFiPOs, Macro. En móvil aparecen abajo.',
              },
            },
            {
              element: '[data-cmdk-trigger]',
              popover: {
                title: 'Búsqueda rápida',
                description:
                  'Presiona ⌘K (Ctrl+K) para buscar cualquier indicador por nombre, alias o código de serie (ej. SF43718).',
              },
            },
          ],
          onDestroyed: () => {
            $onboardingDone.set('true');
          },
        });
        d.drive();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [done]);

  return null;
}
