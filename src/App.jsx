import React, { useMemo, useState } from 'react';
import HeroCover from './components/HeroCover';
import UploadPanel from './components/UploadPanel';
import DataPreview from './components/DataPreview';
import Dashboard from './components/Dashboard';

export default function App() {
  const [data, setData] = useState([]); // array of objects
  const [columns, setColumns] = useState([]); // array of column names
  const [chartType, setChartType] = useState('bar');
  const [xField, setXField] = useState('');
  const [yField, setYField] = useState('');

  const numericColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const keys = columns.length ? columns : Object.keys(data[0] || {});
    return keys.filter((k) => data.some((row) => typeof toNumber(row[k]) === 'number' && !Number.isNaN(toNumber(row[k]))));
  }, [data, columns]);

  function toNumber(v) {
    if (v === null || v === undefined) return NaN;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
    // try date to timestamp? leave numeric only
    return NaN;
  }

  const handleDataset = (rows) => {
    setData(rows);
    const cols = rows.length ? Object.keys(rows[0]) : [];
    setColumns(cols);
    // auto-select fields
    const numCols = cols.filter((c) => rows.some((r) => !Number.isNaN(Number(r[c]))));
    setXField(numCols[0] || cols[0] || '');
    setYField(numCols[1] || numCols[0] || '');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroCover />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UploadPanel onDataLoaded={handleDataset} />
          </div>
          <div className="lg:col-span-2">
            <Dashboard
              data={data}
              columns={columns}
              chartType={chartType}
              setChartType={setChartType}
              xField={xField}
              yField={yField}
              setXField={setXField}
              setYField={setYField}
            />
          </div>
        </section>

        <section className="mt-8">
          <DataPreview data={data} columns={columns} />
        </section>
      </main>

      <footer className="mt-16 py-8 text-center text-sm text-zinc-400">
        Built for data analysts • Upload CSV or JSON to explore your data instantly
      </footer>
    </div>
  );
}
