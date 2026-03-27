'use client';

import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

export function MermaidBlock({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

    setSvg('');
    setError(false);

    mermaid
      .render(`mermaid-${id}`, chart)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="mermaid mermaid-fallback" role="img" aria-label="Mermaid source fallback">
        <p className="muted">Diagram preview unavailable. Showing Mermaid source.</p>
        <pre>{chart}</pre>
      </div>
    );
  }

  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}
