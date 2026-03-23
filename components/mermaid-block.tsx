'use client';

import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

export function MermaidBlock({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    mermaid.render(`mermaid-${id}`, chart).then(({ svg }) => setSvg(svg)).catch(() => {
      setSvg(`<pre>${chart}</pre>`);
    });
  }, [chart, id]);

  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}
