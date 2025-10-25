import React, { useMemo, useState } from 'react';

export default function DataPreview({ data, columns }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const total = data?.length || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (data || []).slice(start, start + pageSize);
  }, [data, page]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-zinc-400">
        Your data preview will appear here after upload.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Data preview</h3>
        <div className="text-sm text-zinc-400">Rows: {total}</div>
      </div>
      <div className="mt-4 overflow-auto rounded-lg border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-800/60">
            <tr>
              {(columns && columns.length ? columns : Object.keys(pageData[0] || {})).map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-zinc-300 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => (
              <tr key={idx} className="odd:bg-zinc-900/40 even:bg-zinc-900/20">
                {(columns && columns.length ? columns : Object.keys(row)).map((col) => (
                  <td key={col} className="px-3 py-2 text-zinc-300 whitespace-nowrap max-w-[16rem] overflow-hidden text-ellipsis">{formatCell(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-zinc-400">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1.5 rounded-md border ${page <= 1 ? 'border-zinc-800 text-zinc-600' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'}`}>Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1.5 rounded-md border ${page >= totalPages ? 'border-zinc-800 text-zinc-600' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'}`}>Next</button>
        </div>
      </div>
    </div>
  );
}

function formatCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isInteger(v) ? v : v.toFixed(3).replace(/\.0+$/, '');
  if (typeof v === 'string' && v.length > 80) return v.slice(0, 77) + '...';
  return String(v);
}
