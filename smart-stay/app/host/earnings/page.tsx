"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useSession } from "next-auth/react";
import HostNavbar from "@/components/navbar/HostNavbar";
import {
  User,
  Home,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

/* ================= TYPES ================= */

type Summary = {
  totalEarnings: number;
  thisMonth: number;
  pending: number;
  avgBooking: number;
};

type Monthly = {
  month: string;
  amount: number;
};

type Transaction = {
  guest: string;
  property: string;
  date: string;
  amount: number;
  status: string;
};

/* ================= PAGE ================= */

export default function HostEarningsPage() {
  const { status } = useSession();

  const [summary, setSummary] = useState<Summary>({
    totalEarnings: 0,
    thisMonth: 0,
    pending: 0,
    avgBooking: 0,
  });

  const [monthly, setMonthly] = useState<Monthly[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        setLoading(true);
        const res = await fetch("/api/host/earnings");
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();

        setSummary({
          totalEarnings: data.totalEarnings,
          thisMonth: data.thisMonth,
          pending: data.pending,
          avgBooking: data.avgBooking,
        });

        setMonthly(data.monthlyEarnings || []);
        setTransactions(data.transactions || []);
        setError(null);
      } catch {
        setError("Failed to fetch earnings");
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-lg text-gray-600 font-medium">
          Loading earnings...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to log in to view earnings.</p>
          <a href="/auth/login" className="text-teal-600 font-semibold hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: "Earnings",
        data: monthly.map((m) => m.amount),
        borderColor: "rgb(13,148,136)",
        backgroundColor: "rgba(13,148,136,0.12)",
        pointBackgroundColor: "rgb(13,148,136)",
        pointBorderWidth: 2,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HostNavbar />

      <main className="flex-1 ml-64 p-10">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Earnings
          </h1>
          <p className="mt-2 text-gray-600 font-medium">
            Track payouts, monthly growth, and transaction status.
          </p>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <SummaryCard title="Total Earnings" value={summary.totalEarnings} />
          <SummaryCard title="This Month" value={summary.thisMonth} />
          <SummaryCard title="Pending" value={summary.pending} />
          <SummaryCard title="Average / Booking" value={summary.avgBooking} />
        </div>

        {/* ===== CHART ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Earnings Overview</h2>
          <div className="h-72">
            {loading ? (
              <span className="text-gray-400">Loading chart...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              <div className="flex justify-center h-full">
                <div className="w-full max-w-4xl">
                  <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== TRANSACTIONS TABLE ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-400">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="p-6 text-gray-400">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-600">
                    <TableHead icon={<User size={16} />} label="Guest" />
                    <TableHead icon={<Home size={16} />} label="Property" />
                    <TableHead icon={<Calendar size={16} />} label="Date" />
                    <TableHead icon={<DollarSign size={16} />} label="Amount" />
                    <TableHead icon={<Clock size={16} />} label="Status" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-teal-50/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{t.guest}</td>
                      <td className="px-6 py-4 text-teal-700 hover:underline cursor-pointer">{t.property || "-"}</td>
                      <td className="px-6 py-4 text-gray-500">{t.date}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        ${t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 hover:shadow-lg transition-shadow">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-extrabold text-gray-900">${value.toLocaleString()}</p>
    </div>
  );
}

function TableHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <th className="px-6 py-3 text-left font-semibold">
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-yellow-700 bg-yellow-100">
        <Clock size={14} /> Pending
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-700 bg-red-100">
        <XCircle size={14} /> Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-100">
      <CheckCircle size={14} /> Completed
    </span>
  );
}
