"use client";

import React, { useEffect, useState } from "react";
import AdminNavbar from "@/components/navbar/AdminNavbar";

const RevenuePage = () => {
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    async function fetchRevenue() {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setRevenue(data.totalRevenue || 0);
      }
    }
    fetchRevenue();
  }, []);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <AdminNavbar />
      <main className="flex-1 p-10 ml-64">
        <h2 className="text-2xl font-bold text-teal-700 mb-4">Revenue</h2>
        <div className="bg-white rounded shadow p-6 text-3xl text-teal-700 font-extrabold">
          {revenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
      </main>
    </div>
  );
};

export default RevenuePage;
