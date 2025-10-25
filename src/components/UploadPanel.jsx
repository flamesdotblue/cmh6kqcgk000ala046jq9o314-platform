import React, { useRef, useState } from 'react';

export default function UploadPanel({ onDataLoaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    setError('');
    const file = files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const name = file.name.toLowerCase();
      if (name.endsWith('.csv')) {
        const rows = parseCSV(text);
        onDataLoaded(rows);
      } else if (name.endsWith('.json')) {
        const json = JSON.parse(text);
        const rows = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
        if (!Array.isArray(rows)) throw new Error('JSON must be an array of objects');
        onDataLoaded(rows);
      } else if (name.endsWith('.tsv')) {
        const rows = parseCSV(text, '\t');
        onDataLoaded(rows);
      } else {
        throw new Error('Unsupported file type. Use CSV, TSV, or JSON.');
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to parse file');
    }
  };

  const parseCSV = (text, forcedDelimiter) => {
    const delimiter = forcedDelimiter || detectDelimiter(text);
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
    if (lines.length === 0) return [];

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];
        if (char === '"') {
          if (inQuotes && next === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const header = parseLine(lines[0]).map((h, idx) => h?.trim() || `col_${idx + 1}`);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseLine(lines[i]);
      if (fields.length === 1 && fields[0] === '') continue;
      const obj = {};
      for (let c = 0; c < header.length; c++) {
        obj[header[c]] = fields[c] !== undefined ? coerceType(fields[c]) : '';
      }
      rows.push(obj);
    }
    return rows;
  };

  const detectDelimiter = (text) => {
    const sample = text.split(/\r?\n/).slice(0, 5);
    const candidates = [',', '\t', ';', '|'];
    let best = ',';
    let bestScore = -Infinity;
    for (const d of candidates) {
      const counts = sample.map((l) => l.split(d).length);
      const variance = varianceOf(counts);
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const score = mean - variance; // prefer consistent, higher splits
      if (score > bestScore) {
        bestScore = score;
        best = d;
      }
    }
    return best;
  };

  const varianceOf = (arr) => {
    if (arr.length === 0) return 0;
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length;
  };

  const coerceType = (v) => {
    const trimmed = typeof v === 'string' ? v.trim() : v;
    if (trimmed === '') return '';
    const num = Number(trimmed);
    if (!Number.isNaN(num) && trimmed.match(/^[-+]?\d*(?:\.\d+)?(?:[eE][-+]?\d+)?$/)) return num;
    // attempt ISO date
    const d = new Date(trimmed);
    if (!isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed; // keep as string date
    return trimmed;
  };

  const loadSample = () => {
    const sample = `date,category,value\n2025-01-01,A,10\n2025-01-02,A,15\n2025-01-03,B,7\n2025-01-04,B,12\n2025-01-05,C,5\n2025-01-06,A,20\n2025-01-07,C,9`;
    const rows = parseCSV(sample, ',');
    onDataLoaded(rows);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Upload your data</h2>
      <p className="text-sm text-zinc-400 mt-1">CSV, TSV, or JSON. Drag & drop or click to browse.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mt-4 flex items-center justify-center h-40 rounded-lg border-2 border-dashed transition-colors ${dragOver ? 'border-emerald-400 bg-emerald-400/10' : 'border-zinc-700 hover:border-zinc-600'}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.json,application/json,text/csv,text/tab-separated-values"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-center">
          <div className="text-sm text-zinc-300">Drop file here or click to upload</div>
          <div className="text-xs text-zinc-500 mt-1">Max ~5MB recommended</div>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

      <div className="mt-4 flex gap-2">
        <button onClick={loadSample} className="px-3 py-2 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-sm">Load sample</button>
        <button onClick={() => onDataLoaded([])} className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm">Clear</button>
      </div>
    </div>
  );
}
