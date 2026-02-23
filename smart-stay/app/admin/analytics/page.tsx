"use client";

import React, { useEffect, useState } from "react";
import AdminNavbar from "@/components/navbar/AdminNavbar";

const AnalyticsPage = () => {
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    async function fetchTrends() {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setTrends(data.bookingTrends || []);
      }
    }
    fetchTrends();
  }, []);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <AdminNavbar />
      <main className="flex-1 p-10 ml-64">
        <h2 className="text-2xl font-bold text-teal-700 mb-4">Booking Trends</h2>
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="bg-teal-100 text-teal-700">
              <th className="px-3 py-2 text-left">Month</th>
              <th className="px-3 py-2 text-left">Bookings</th>
            </tr>
          </thead>
          <tbody>
            {trends.length === 0 && <tr><td colSpan={2}>No data</td></tr>}
            {trends.map((trend: any) => (
              <tr key={trend._id.year + '-' + trend._id.month}>
                <td className="px-3 py-2">{trend._id.month}/{trend._id.year}</td>
                <td className="px-3 py-2">{trend.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AnalyticsPage;
