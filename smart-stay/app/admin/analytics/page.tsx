"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/navbar/AdminNavbar";
import { BarChart2, TrendingUp, Users, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import { useNotification } from "@/context/NotificationContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  totalRevenue: number;
  bookingTrends: Array<{
    _id: { year: number; month: number };
    count: number;
    revenue: number;
  }>;
}

const AnalyticsPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { addNotification } = useNotification();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    recentUsers: [],
    totalRevenue: 0,
    bookingTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
          addNotification({
            type: 'success',
            title: 'Analytics Loaded',
            message: 'Successfully loaded analytics data'
          });
        } else {
          setError("Failed to fetch analytics");
          addNotification({
            type: 'error',
            title: 'Failed to Load Analytics',
            message: 'Unable to fetch analytics data from the server'
          });
        }
      } catch (err) {
        setError("Error loading analytics");
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'An error occurred while loading analytics'
        });
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status, addNotification]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const maxCount = Math.max(...analytics.bookingTrends.map(t => t.count), 1);
  const maxRevenue = Math.max(...analytics.bookingTrends.map(t => t.revenue || 0), 1);
  
  // Calculate growth percentage
  const getCurrentMonthRevenue = () => {
    if (analytics.bookingTrends.length === 0) return 0;
    return analytics.bookingTrends[analytics.bookingTrends.length - 1]?.revenue || 0;
  };
  
  const getPreviousMonthRevenue = () => {
    if (analytics.bookingTrends.length < 2) return 0;
    return analytics.bookingTrends[analytics.bookingTrends.length - 2]?.revenue || 0;
  };
  
  const getGrowthPercentage = () => {
    const current = getCurrentMonthRevenue();
    const previous = getPreviousMonthRevenue();
    if (previous === 0) return "0";
    return ((current - previous) / previous * 100).toFixed(1);
  };
  
  const totalBookings = analytics.bookingTrends.reduce((sum, t) => sum + t.count, 0);
  const avgBookingValue = totalBookings > 0 ? Math.round(analytics.totalRevenue / totalBookings) : 0;
  const growthPercentage = parseFloat(getGrowthPercentage());

  // Chart.js Configurations
  const bookingChartData = {
    labels: analytics.bookingTrends.map((trend) => `${monthNames[trend._id.month - 1]} '${String(trend._id.year).slice(-2)}`),
    datasets: [
      {
        label: "Bookings",
        data: analytics.bookingTrends.map((trend) => trend.count),
        borderColor: "rgb(20, 184, 166)",
        backgroundColor: "rgba(20, 184, 166, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueChartData = {
    labels: analytics.bookingTrends.map((trend) => `${monthNames[trend._id.month - 1]} '${String(trend._id.year).slice(-2)}`),
    datasets: [
      {
        label: "Revenue",
        data: analytics.bookingTrends.map((trend) => trend.revenue || 0),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminNavbar />
        <main className="flex-1 p-8 ml-64">
          <div className="text-teal-600 text-lg font-semibold animate-pulse">Loading analytics...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics & Revenue</h1>
          <p className="text-slate-600">Platform insights, booking trends, and financial performance</p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
        ) : (
          <>
            {/* Revenue Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${analytics.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* This Month Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  {growthPercentage !== 0 && (
                    <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                      growthPercentage > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {growthPercentage > 0 ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(growthPercentage)}%
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">This Month</p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${getCurrentMonthRevenue().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BarChart2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalBookings.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Average Booking Value */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Avg. Booking Value</p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${avgBookingValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Trends Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Booking Trends (Last 12 Months)
                </h2>
                
                {analytics.bookingTrends.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">No booking data available</div>
                ) : (
                  <div className="h-64">
                    <Line data={bookingChartData} options={lineChartOptions} />
                  </div>
                )}
              </div>

              {/* Revenue Trends Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                  Revenue Trends (Last 12 Months)
                </h2>
                
                {analytics.bookingTrends.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">No revenue data available</div>
                ) : (
                  <div className="h-64">
                    <Line data={revenueChartData} options={lineChartOptions} />
                  </div>
                )}
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Recent Users
                </h2>
                
                {analytics.recentUsers.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">No recent users</div>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div>
                          <div className="font-medium text-slate-800">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin" ? "bg-red-100 text-red-700" :
                          user.role === "host" ? "bg-teal-100 text-teal-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role || "guest"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Breakdown Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-teal-600" />
                  Monthly Breakdown
                </h2>
                
                {analytics.bookingTrends.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">No data available</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Period</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Bookings</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Revenue</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg. Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.bookingTrends.map((trend) => {
                          const avgValue = trend.count > 0 ? Math.round((trend.revenue || 0) / trend.count) : 0;
                          return (
                            <tr key={`table-${trend._id.year}-${trend._id.month}`} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-3">
                                <span className="font-medium text-slate-800">
                                  {monthNames[trend._id.month - 1]} {trend._id.year}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                  {trend.count}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="font-semibold text-teal-600">
                                  ${(trend.revenue || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-slate-600">
                                  ${avgValue.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;
