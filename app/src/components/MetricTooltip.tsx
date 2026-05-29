import { useState, useId } from 'react';
import { GLOSSARY } from '~/data/glossary';

interface Props {
  slug: string;
  children: React.ReactNode;
}

export function MetricTooltip({ slug, children }: Props) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const entry = GLOSSARY[slug];

  if (!entry) {
    return <>{children}</>;
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Trigger */}
      <span
        role="button"
        tabIndex={0}
        aria-describedby={tooltipId}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: 'var(--color-gold)',
          cursor: 'help',
        }}
      >
        {children}
      </span>

      {/* Tooltip */}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            minWidth: '220px',
            maxWidth: '320px',
            padding: '8px 12px',
            background: 'var(--color-bg-elev)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            lineHeight: '1.4',
          }}
        >
          <span
            style={{
              display: 'block',
              fontWeight: 700,
              fontSize: '12px',
              color: 'var(--color-text)',
              marginBottom: '4px',
            }}
          >
            {entry.term}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--color-text-dim)',
            }}
          >
            {entry.short}
          </span>
        </span>
      )}
    </span>
  );
}
