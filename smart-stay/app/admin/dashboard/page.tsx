"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
	BarChart2,
	Users,
	Home,
	Calendar,
	DollarSign,
	TrendingUp,
	UserCheck,
	Activity,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import AdminNavbar from "@/components/navbar/AdminNavbar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type StatsResponse = {
	users: number;
	properties: number;
	bookings: number;
};

type TrendPoint = {
	_id: { year: number; month: number };
	count: number;
	revenue: number;
};

type RecentUser = {
	_id: string;
	name: string;
	email: string;
	role?: string;
	createdAt?: string;
};

type AnalyticsResponse = {
	recentUsers: RecentUser[];
	totalRevenue: number;
	bookingTrends: TrendPoint[];
};

export default function AdminDashboard() {
	const { status } = useSession();
	const router = useRouter();

	const [stats, setStats] = useState<StatsResponse>({ users: 0, properties: 0, bookings: 0 });
	const [analytics, setAnalytics] = useState<AnalyticsResponse>({
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
		async function fetchData() {
			try {
				setLoading(true);
				setError("");

				const [statsRes, analyticsRes] = await Promise.all([
					fetch("/api/admin/stats"),
					fetch("/api/admin/analytics"),
				]);

				if (!statsRes.ok || !analyticsRes.ok) {
					throw new Error("Failed to load admin dashboard data");
				}

				const statsData = await statsRes.json();
				const analyticsData = await analyticsRes.json();

				setStats({
					users: Number(statsData?.users || 0),
					properties: Number(statsData?.properties || 0),
					bookings: Number(statsData?.bookings || 0),
				});

				setAnalytics({
					recentUsers: Array.isArray(analyticsData?.recentUsers) ? analyticsData.recentUsers : [],
					totalRevenue: Number(analyticsData?.totalRevenue || 0),
					bookingTrends: Array.isArray(analyticsData?.bookingTrends) ? analyticsData.bookingTrends : [],
				});
			} catch (err: any) {
				setError(err?.message || "Failed to load dashboard");
			} finally {
				setLoading(false);
			}
		}

		if (status === "authenticated") {
			fetchData();
		}

		const interval = setInterval(() => {
			if (status === "authenticated") {
				fetchData();
			}
		}, 60000);

		return () => clearInterval(interval);
	}, [status]);

	if (status === "unauthenticated") {
		return null;
	}

	if (status === "loading" || loading) {
		return (
			<div className="flex min-h-screen bg-gray-50">
				<AdminNavbar />
				<main className="flex-1 p-10 ml-64">
					<div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm text-teal-700 font-semibold">
						Loading admin dashboard...
					</div>
				</main>
			</div>
		);
	}

	const latestTrend = analytics.bookingTrends[analytics.bookingTrends.length - 1];
	const avgBookingValue = stats.bookings > 0 ? analytics.totalRevenue / stats.bookings : 0;
	const trendWindow = analytics.bookingTrends.slice(-6);
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	const bookingChartData = {
		labels: trendWindow.map(
			(trend) => `${monthNames[trend._id.month - 1]} '${String(trend._id.year).slice(-2)}`,
		),
		datasets: [
			{
				label: "Bookings",
				data: trendWindow.map((trend) => trend.count),
				backgroundColor: "rgba(20, 184, 166, 0.75)",
				borderColor: "rgb(13, 148, 136)",
				borderWidth: 1,
				borderRadius: 8,
				maxBarThickness: 44,
			},
		],
	};

	const bookingChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			title: { display: false },
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { color: "#64748b" },
			},
			y: {
				beginAtZero: true,
				grid: { color: "rgba(15, 23, 42, 0.06)" },
				ticks: { precision: 0, color: "#64748b" },
			},
		},
	};

	return (
		<div className="flex min-h-screen bg-gray-50">
			<AdminNavbar />
			<main className="flex-1 p-10 ml-64">
				<div className="mb-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-lg">
					<h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
						Welcome Admin <span className="text-black">👋</span>
					</h1>
					<p className="text-sm text-teal-600 font-medium">Overview of platform health, growth and revenue</p>
				</div>

				{error && (
					<div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<Users className="w-8 h-8 text-teal-500" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Users</div>
							<div className="text-2xl text-teal-700 font-extrabold">{stats.users.toLocaleString()}</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<Home className="w-8 h-8 text-teal-400" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Properties</div>
							<div className="text-2xl text-teal-600 font-extrabold">{stats.properties.toLocaleString()}</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<Calendar className="w-8 h-8 text-teal-300" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Bookings</div>
							<div className="text-2xl text-teal-500 font-extrabold">{stats.bookings.toLocaleString()}</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<DollarSign className="w-8 h-8 text-emerald-500" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Revenue</div>
							<div className="text-2xl text-emerald-600 font-extrabold">
								{analytics.totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 xl:col-span-1">
						<div className="flex items-center gap-3 mb-5">
							<Activity className="w-6 h-6 text-teal-600" />
							<h2 className="text-xl font-bold text-gray-900">Operational Snapshot</h2>
						</div>
						<div className="space-y-4 text-sm">
							<div className="rounded-xl border border-gray-100 p-4">
								<p className="text-gray-500 font-medium">Latest Month Bookings</p>
								<p className="text-2xl font-extrabold text-teal-700 mt-1">{latestTrend?.count || 0}</p>
							</div>
							<div className="rounded-xl border border-gray-100 p-4">
								<p className="text-gray-500 font-medium">Latest Month Revenue</p>
								<p className="text-2xl font-extrabold text-emerald-600 mt-1">
									{(latestTrend?.revenue || 0).toLocaleString("en-US", {
										style: "currency",
										currency: "USD",
									})}
								</p>
							</div>
							<div className="rounded-xl border border-gray-100 p-4">
								<p className="text-gray-500 font-medium">Average Booking Value</p>
								<p className="text-2xl font-extrabold text-blue-600 mt-1">
									{avgBookingValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 xl:col-span-2">
						<div className="flex items-center gap-3 mb-5">
							<BarChart2 className="w-6 h-6 text-teal-600" />
							<h2 className="text-xl font-bold text-gray-900">Booking Trends (Last 6 Months)</h2>
						</div>
						{trendWindow.length === 0 ? (
							<p className="text-sm text-gray-500">No booking trend data available.</p>
						) : (
							<div className="h-72">
								<Bar data={bookingChartData} options={bookingChartOptions} />
							</div>
						)}
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 mt-6">
					<div className="flex items-center gap-3 mb-5">
						<UserCheck className="w-6 h-6 text-teal-600" />
						<h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
					</div>
					{analytics.recentUsers.length === 0 ? (
						<p className="text-sm text-gray-500">No recent users found.</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							{analytics.recentUsers.map((user) => (
								<div key={user._id} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="font-semibold text-gray-900">{user.name || "Unnamed User"}</p>
											<p className="text-xs text-gray-600 break-all">{user.email}</p>
										</div>
										<span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full bg-teal-50 text-teal-700 font-bold">
											{user.role || "guest"}
										</span>
									</div>
									{user.createdAt && (
										<p className="mt-3 text-xs text-gray-500">
											Joined {new Date(user.createdAt).toLocaleDateString()}
										</p>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				<div className="mt-6 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-sm text-gray-500 font-medium">Live refresh</p>
						<p className="text-gray-800 font-semibold">Dashboard auto-refreshes every 60 seconds</p>
					</div>
					<div className="flex items-center gap-2 text-teal-600 font-semibold">
						<TrendingUp className="w-5 h-5" />
						<span>Monitoring Active</span>
					</div>
				</div>
			</main>
		</div>
	);
}
