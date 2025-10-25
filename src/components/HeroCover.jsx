import React from 'react';
import Spline from '@splinetool/react-spline';

export default function HeroCover() {
  return (
    <section className="relative h-[60vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/6tUXqVcUA0xgJugv/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black pointer-events-none" />
      <div className="relative h-full flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-white">
            Turn your files into insights
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto">
            Upload CSV or JSON and get an instant dashboard with summaries and charts. No setup required.
          </p>
        </div>
      </div>
    </section>
  );
}
