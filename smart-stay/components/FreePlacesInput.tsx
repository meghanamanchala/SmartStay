"use client";
import { useEffect, useState } from "react";

export default function FreePlacesInput({ value, onChange, className = "" }: any) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      onChange(""); 
      return;
    }

    if (query.length < 3) return;

    const timer = setTimeout(async () => {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();
      setResults(data.features || []);
      setOpen(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          setOpen(true);

          if (val === "") {
            onChange(""); // 👈 clear parent state
          }
        }}
        placeholder="Search your city"
        className={`w-full border rounded px-10 py-2 h-11 ${className}`}
      />

      {open && results.length > 0 && (
        <ul className="absolute z-50 bg-white border w-full mt-1 rounded shadow max-h-60 overflow-auto">
          {results.map((r, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                const label = `${r.properties.name}, ${r.properties.city || ""}, ${r.properties.country || ""}`;
                setQuery(label);
                onChange(label); // 👈 save real value
                setOpen(false);
              }}
            >
              {r.properties.name}, {r.properties.city}, {r.properties.country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
