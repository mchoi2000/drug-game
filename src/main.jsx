import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotateCcw, Sparkles, CheckCircle2, Search, Trophy } from 'lucide-react';
import './index.css';

import neurological from './data/neurological.json';
import respiratory from './data/respiratory.json';
import infectious from './data/infectious.json';
import inflammation from './data/inflammation.json';
import endocrine from './data/endocrine_gu.json';
import cardiovascular from './data/cardiovascular.json';
import giMisc from './data/gi_misc.json';

const DATASETS = [
  { category: 'Neurological', color: 'from-indigo-500 to-violet-500', drugs: neurological },
  { category: 'Respiratory', color: 'from-sky-500 to-cyan-500', drugs: respiratory },
  { category: 'Infectious Disease', color: 'from-rose-500 to-orange-500', drugs: infectious },
  { category: 'Inflammation & Immunology', color: 'from-amber-500 to-yellow-500', drugs: inflammation },
  { category: 'Endocrine & GU', color: 'from-emerald-500 to-teal-500', drugs: endocrine },
  { category: 'Cardiovascular', color: 'from-red-500 to-pink-500', drugs: cardiovascular },
  { category: 'GI / Misc', color: 'from-slate-500 to-gray-500', drugs: giMisc },
];

const buildDrugs = () =>
  DATASETS.flatMap(ds =>
    ds.drugs.map((d, i) => ({
      ...d,
      number: Number(d.number ?? d.no ?? d.id ?? i + 1),
      id: `${ds.category}-${d.brand}-${d.number ?? d.no ?? i + 1}`,
      category: ds.category,
      key: `${ds.category}__${d.section}`,
    }))
  );

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function DrugCard({ drug, flipped, onFlip, draggable = false }) {
  return (
    <div
      draggable={draggable}
      onDragStart={e => {
        e.dataTransfer.setData('drugId', drug.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onFlip}
      className={`
        cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:shadow-md
        ${flipped ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white'}
      `}
    >
      <div className="font-bold text-slate-900">
        {flipped ? drug.generic : drug.brand}
      </div>
    </div>
  );
}

function App() {
  const allDrugs = useMemo(() => shuffle(buildDrugs()), []);

  const sections = useMemo(
    () =>
      DATASETS.flatMap(ds =>
        [...new Set(ds.drugs.map(d => d.section))].map(section => ({
          key: `${ds.category}__${section}`,
          section,
          category: ds.category,
          color: ds.color,
        }))
      ),
    []
  );

  const categories = useMemo(() => DATASETS.map(ds => ds.category), []);

  const [selectedCategories, setSelectedCategories] = useState(['Neurological']);
  const [placed, setPlaced] = useState({});
  const [flipped, setFlipped] = useState({});
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const visibleDrugs = allDrugs.filter(d => selectedCategories.includes(d.category));
  const visibleSections = sections.filter(s => selectedCategories.includes(s.category));

  const visibleDrugIds = new Set(visibleDrugs.map(d => d.id));
  const placedIds = new Set(Object.values(placed).flat());

  const visiblePlacedCount = [...placedIds].filter(id => visibleDrugIds.has(id)).length;

  const leftDrugs = visibleDrugs.filter(
    d =>
      !placedIds.has(d.id) &&
      d.brand.toLowerCase().includes(query.toLowerCase())
  );

  const categoryColorMap = useMemo(() => {
    const map = {};
    DATASETS.forEach(ds => {
      map[ds.category] = ds.color;
    });
    return map;
  }, []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 1200);
  }

  function toggleCategory(category) {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }

  function selectAllCategories() {
    setSelectedCategories(categories);
  }

  function placeDrug(drugId, sectionKey) {
    const drug = allDrugs.find(d => d.id === drugId);
    if (!drug) return;

    if (drug.key !== sectionKey) {
      setPlaced(prev =>
        Object.fromEntries(
          Object.entries(prev).map(([k, ids]) => [
            k,
            ids.filter(id => id !== drugId),
          ])
        )
      );
      flash(`Try again: ${drug.brand} returned to the left list.`);
      return;
    }

    setPlaced(prev => {
      const cleared = Object.fromEntries(
        Object.entries(prev).map(([k, ids]) => [
          k,
          ids.filter(id => id !== drugId),
        ])
      );

      return {
        ...cleared,
        [sectionKey]: [...(cleared[sectionKey] || []), drugId],
      };
    });
  }

function placeSection(sectionKey) {
  const ids = getSectionIdsInNumberOrder(sectionKey);

  setPlaced(prev => {
    const cleaned = Object.fromEntries(
      Object.entries(prev).map(([k, existingIds]) => [
        k,
        existingIds.filter(id => !ids.includes(id)),
      ])
    );

    return {
      ...cleaned,
      [sectionKey]: ids,
    };
  });
}

  function clearSection(sectionKey) {
    setPlaced(prev => ({
      ...prev,
      [sectionKey]: [],
    }));
  }

function placeAll() {
  setPlaced(prev => {
    const next = { ...prev };

    visibleSections.forEach(s => {
      next[s.key] = getSectionIdsInNumberOrder(s.key);
    });

    return next;
  });
}

  function getSectionIdsInNumberOrder(sectionKey) {
  return allDrugs
    .filter(d => d.key === sectionKey)
    .sort((a, b) => a.number - b.number)
    .map(d => d.id);
}

  function clearAll() {
    setPlaced({});
    setFlipped({});
    setQuery('');
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_28%),radial-gradient(circle_at_top_right,#fce7f3,transparent_26%),#f8fafc]">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-teal-600">
              <Sparkles size={15} /> PTCB Drug Sense Lab
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Top 200 Drugs
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              <b>{visiblePlacedCount}</b> / {visibleDrugs.length} placed
            </div>

            <button
              onClick={placeAll}
              className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-500"
            >
              Place All
            </button>

            <button
              onClick={clearAll}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RotateCcw className="mr-1 inline" size={15} />
              Clear All
            </button>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-[1800px] flex-wrap gap-2">
          {categories.map(category => {
            const active = selectedCategories.includes(category);
            const color = categoryColorMap[category];

            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`
                  rounded-full px-4 py-2 text-xs font-bold transition
                  ${
                    active
                      ? `bg-gradient-to-r ${color} text-white shadow`
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                {category}
              </button>
            );
          })}

          <button
            onClick={selectAllCategories}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategories([])}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            None
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed right-5 top-28 z-30 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      <main className="mx-auto grid max-w-[1400px] min-w-[1000px] grid-cols-[280px_1fr] gap-4 overflow-x-auto p-3 sm:p-4 lg:p-5">
        <aside className="rounded-[1.5rem] border border-white bg-white/85 p-3 shadow-xl shadow-slate-200/70 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black text-slate-900">Drug Bank</h2>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-600">
              {leftDrugs.length} left
            </span>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search brand name..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="thin-scroll grid max-h-[calc(100vh-360px)] min-h-[280px] grid-cols-1 gap-2 overflow-y-auto overflow-x-hidden pr-1">
            {leftDrugs.map(drug => (
              <DrugCard
                key={drug.id}
                drug={drug}
                draggable
                flipped={!!flipped[drug.id]}
                onFlip={() =>
                  setFlipped(f => ({
                    ...f,
                    [drug.id]: !f[drug.id],
                  }))
                }
              />
            ))}
          </div>
        </aside>

        <section className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
          {visibleSections.map(s => {
            const ids = placed[s.key] || [];
            const sectionDrugs = ids
              .map(id => allDrugs.find(d => d.id === id))
              .filter(Boolean);

            const total = allDrugs.filter(d => d.key === s.key).length;

            return (
              <div
                key={s.key}
                onDragOver={e => e.preventDefault()}
                onDrop={e => placeDrug(e.dataTransfer.getData('drugId'), s.key)}
                className="drop-zone rounded-[2rem] border border-white bg-white/80 p-4 shadow-lg shadow-slate-200/60 transition hover:bg-white"
              >
                <div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${s.color}`} />

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">{s.section}</h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {s.category} · {ids.length}/{total}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => placeSection(s.key)}
                      className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white hover:bg-teal-500"
                    >
                      Place
                    </button>

                    <button
                      onClick={() => clearSection(s.key)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {sectionDrugs.map(drug => (
                    <div key={drug.id} className="relative">
                      <DrugCard
                        drug={drug}
                        draggable
                        flipped={!!flipped[drug.id]}
                        onFlip={() =>
                          setFlipped(f => ({
                            ...f,
                            [drug.id]: !f[drug.id],
                          }))
                        }
                      />
                      <CheckCircle2
                        size={16}
                        className="absolute right-2 top-2 text-emerald-500"
                      />
                    </div>
                  ))}

                  {!sectionDrugs.length && (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                      Drop matching drugs here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);