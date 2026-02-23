"use client";

import React, { useEffect, useState } from "react";
import AdminNavbar from "@/components/navbar/AdminNavbar";

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    async function fetchProperties() {
      const res = await fetch("/api/guest/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    }
    fetchProperties();
  }, []);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <AdminNavbar />
      <main className="flex-1 p-10 ml-64">
        <h2 className="text-2xl font-bold text-teal-700 mb-4">Properties</h2>
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="bg-teal-100 text-teal-700">
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">City</th>
              <th className="px-3 py-2 text-left">Country</th>
              <th className="px-3 py-2 text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            {properties.length === 0 && <tr><td colSpan={4}>No properties found.</td></tr>}
            {properties.map((property: any) => (
              <tr key={property._id}>
                <td className="px-3 py-2">{property.title}</td>
                <td className="px-3 py-2">{property.city}</td>
                <td className="px-3 py-2">{property.country}</td>
                <td className="px-3 py-2">${property.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default PropertiesPage;
