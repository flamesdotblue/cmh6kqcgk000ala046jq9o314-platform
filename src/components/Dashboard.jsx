import React, { useMemo } from 'react';

export default function Dashboard({ data, columns, chartType, setChartType, xField, yField, setXField, setYField }) {
  const cols = columns && columns.length ? columns : (data[0] ? Object.keys(data[0]) : []);

  const numericCols = useMemo(() => {
    return cols.filter((c) => data.some((r) => typeof r[c] === 'number' && !Number.isNaN(r[c])));
  }, [data, cols]);

  const categoryCols = useMemo(() => {
    return cols.filter((c) => !numericCols.includes(c));
  }, [cols, numericCols]);

  const stats = useMemo(() => {
    if (!data.length || !numericCols.length) return null;
    const col = yField && numericCols.includes(yField) ? yField : numericCols[0];
    const nums = data.map((r) => r[col]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (!nums.length) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const variance = nums.reduce((s, v) => s + (v - mean) * (v - mean), 0) / nums.length;
    const std = Math.sqrt(variance);
    return { column: col, count: nums.length, mean, min, max, std };
  }, [data, numericCols, yField]);

  const chartData = useMemo(() => {
    if (!data.length) return [];
    const xf = xField || cols[0];
    const yf = yField && (numericCols.includes(yField) || chartType === 'bar') ? yField : numericCols[0];

    if (chartType === 'bar') {
      if (yf && numericCols.includes(yf) && xf && categoryCols.includes(xf)) {
        // aggregate by category: mean of y
        const groups = {};
        for (const row of data) {
          const k = String(row[xf]);
          const v = typeof row[yf] === 'number' ? row[yf] : NaN;
          if (!groups[k]) groups[k] = [];
          if (!Number.isNaN(v)) groups[k].push(v);
        }
        const out = Object.entries(groups).map(([k, arr]) => ({ x: k, y: arr.reduce((a, b) => a + b, 0) / (arr.length || 1) }));
        return out.sort((a, b) => a.x.localeCompare(b.x));
      } else if (xf && numericCols.includes(xf)) {
        // histogram of numeric x
        const nums = data.map((r) => r[xf]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
        if (!nums.length) return [];
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const bins = 12;
        const w = (max - min) / bins || 1;
        const counts = Array.from({ length: bins }, () => 0);
        nums.forEach((v) => {
          let idx = Math.floor((v - min) / w);
          if (idx >= bins) idx = bins - 1;
          if (idx < 0) idx = 0;
          counts[idx]++;
        });
        return counts.map((c, i) => ({ x: `${(min + i * w).toFixed(1)}`, y: c }));
      } else {
        // fallback: category counts
        const xfAll = xf || cols[0];
        const map = {};
        for (const row of data) {
          const k = String(row[xfAll]);
          map[k] = (map[k] || 0) + 1;
        }
        return Object.entries(map).map(([k, v]) => ({ x: k, y: v })).sort((a, b) => a.x.localeCompare(b.x));
      }
    }

    // line chart or scatter: map to pairs
    const xfAll = xField && cols.includes(xField) ? xField : cols[0];
    const yfAll = yField && numericCols.includes(yField) ? yField : numericCols[0];
    if (!yfAll) return [];

    const points = data.map((r, i) => {
      const xValRaw = r[xfAll];
      const yVal = typeof r[yfAll] === 'number' ? r[yfAll] : NaN;
      let xVal = i;
      if (typeof xValRaw === 'number') xVal = xValRaw;
      else if (isParsableDate(xValRaw)) xVal = new Date(xValRaw).getTime();
      return { x: xVal, y: yVal };
    }).filter((p) => !Number.isNaN(p.y));

    return points;
  }, [data, chartType, xField, yField, cols, numericCols, categoryCols]);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Dashboard</h3>
          <p className="text-sm text-zinc-400">Select fields to visualize and explore quick stats.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm">
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="scatter">Scatter</option>
          </select>
          <select value={xField} onChange={(e) => setXField(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm min-w-[8rem]">
            <option value="">X field</option>
            {cols.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select value={yField} onChange={(e) => setYField(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm min-w-[8rem]">
            <option value="">Y field</option>
            {cols.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Column" value={stats.column} />
          <StatCard label="Count" value={stats.count} />
          <StatCard label="Mean" value={formatNum(stats.mean)} />
          <StatCard label="Min" value={formatNum(stats.min)} />
          <StatCard label="Max" value={formatNum(stats.max)} />
        </div>
      )}

      <div className="mt-6">
        <ChartArea type={chartType} data={chartData} />
      </div>

      {!data.length && (
        <div className="mt-6 text-sm text-zinc-400">Upload a dataset to see charts and statistics.</div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-medium text-zinc-100">{value}</div>
    </div>
  );
}

function ChartArea({ type, data }) {
  const height = 280;
  const padding = { left: 40, right: 12, top: 16, bottom: 28 };
  const width = 800; // will scale via viewBox

  if (!data || !data.length) {
    return (
      <div className="h-72 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-500">
        No data to display
      </div>
    );
  }

  if (type === 'bar') return <BarChart data={data} width={width} height={height} padding={padding} />;
  if (type === 'scatter') return <ScatterChart data={data} width={width} height={height} padding={padding} />;
  return <LineChart data={data} width={width} height={height} padding={padding} />;
}

function BarChart({ data, width, height, padding }) {
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxY = Math.max(...data.map((d) => d.y));
  const barW = Math.max(8, innerW / data.length - 8);

  const scaleX = (i) => padding.left + (innerW / data.length) * i + (innerW / data.length - barW) / 2;
  const scaleY = (y) => padding.top + innerH - (y / (maxY || 1)) * innerH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72">
      {/* axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#3f3f46" />
      <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#3f3f46" />
      {data.map((d, i) => (
        <g key={i}>
          <rect x={scaleX(i)} y={scaleY(d.y)} width={barW} height={Math.max(0, padding.top + innerH - scaleY(d.y))} fill="#34d399" opacity={0.9} />
          {data.length <= 30 && (
            <text x={padding.left + (innerW / data.length) * i + (innerW / data.length) / 2} y={padding.top + innerH + 16} textAnchor="middle" fontSize="10" fill="#a1a1aa">{d.x}</text>
          )}
        </g>
      ))}
      {/* y ticks */}
      {Array.from({ length: 5 }, (_, i) => i + 1).map((t) => {
        const y = padding.top + innerH - (t / 5) * innerH;
        const val = ((maxY / 5) * t).toFixed(2).replace(/\.0+$/, '');
        return (
          <g key={t}>
            <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#27272a" />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#a1a1aa">{val}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, width, height, padding }) {
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const minX = Math.min(...data.map((d) => d.x));
  const maxX = Math.max(...data.map((d) => d.x));
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));

  const scaleX = (x) => padding.left + ((x - minX) / ((maxX - minX) || 1)) * innerW;
  const scaleY = (y) => padding.top + innerH - ((y - minY) / ((maxY - minY) || 1)) * innerH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.x)} ${scaleY(d.y)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72">
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#3f3f46" />
      <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#3f3f46" />
      <path d={pathD} fill="none" stroke="#34d399" strokeWidth={2} />
      {data.length <= 120 && data.map((d, i) => (
        <circle key={i} cx={scaleX(d.x)} cy={scaleY(d.y)} r={2} fill="#34d399" />
      ))}
      {Array.from({ length: 5 }, (_, i) => i + 1).map((t) => {
        const y = padding.top + innerH - (t / 5) * innerH;
        const val = (minY + ((maxY - minY) / 5) * t).toFixed(2).replace(/\.0+$/, '');
        return (
          <g key={t}>
            <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#27272a" />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#a1a1aa">{val}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ScatterChart({ data, width, height, padding }) {
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const minX = Math.min(...data.map((d) => d.x));
  const maxX = Math.max(...data.map((d) => d.x));
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));

  const scaleX = (x) => padding.left + ((x - minX) / ((maxX - minX) || 1)) * innerW;
  const scaleY = (y) => padding.top + innerH - ((y - minY) / ((maxY - minY) || 1)) * innerH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72">
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#3f3f46" />
      <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#3f3f46" />
      {data.map((d, i) => (
        <circle key={i} cx={scaleX(d.x)} cy={scaleY(d.y)} r={3} fill="#34d399" opacity={0.9} />
      ))}
      {Array.from({ length: 5 }, (_, i) => i + 1).map((t) => {
        const y = padding.top + innerH - (t / 5) * innerH;
        const val = (minY + ((maxY - minY) / 5) * t).toFixed(2).replace(/\.0+$/, '');
        return (
          <g key={t}>
            <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#27272a" />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#a1a1aa">{val}</text>
          </g>
        );
      })}
    </svg>
  );
}

function isParsableDate(v) {
  if (typeof v !== 'string') return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

function formatNum(v) {
  if (v === null || v === undefined) return '';
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 });
}
