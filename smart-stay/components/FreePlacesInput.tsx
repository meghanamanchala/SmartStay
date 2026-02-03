"use client";

import { useEffect, useState } from "react";

export default function FreePlacesInput({ value, onChange, className = "" }: any) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

    useEffect(() => {
      if (!query) {
        setResults([]);
        setOpen(false);
        return;
      }

      if (query.length < 3) return;

      const timer = setTimeout(async () => {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await res.json();
        setResults(data.features || []);
        // Only open if not an exact match
        if (!isQueryInResults()) setOpen(true);
      }, 400);

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Helper to check if query matches a suggestion
  function isQueryInResults() {
    return results.some(r => {
      const label = `${r.properties.name}, ${r.properties.city || ""}, ${r.properties.country || ""}`;
      return label === query;
    });
  }

  return (
    <div className="relative w-full">
      <input
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          // Only open dropdown if not an exact match to a suggestion
          if (val === "") {
            setOpen(false);
            onChange("");
          } else if (!isQueryInResults()) {
            setOpen(true);
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search your city"
        className={`w-full border rounded px-10 py-2 h-11 ${className}`}
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <ul className="absolute z-50 bg-white border w-full mt-1 rounded shadow max-h-60 overflow-auto">
          {results.map((r, i) => {
            const label = `${r.properties.name}, ${r.properties.city || ""}, ${r.properties.country || ""}`;
            return (
              <li
                key={i}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setQuery(label);
                  onChange(label);
                  setOpen(false);
                }}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
