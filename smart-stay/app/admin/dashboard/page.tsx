"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart2, Users, Home, Calendar, DollarSign } from "lucide-react";
import React, { useEffect, useState } from "react";
import AdminNavbar from "@/components/navbar/AdminNavbar";


export default function AdminDashboard() {
	const { status, data } = useSession();
	const router = useRouter();
	const [stats, setStats] = useState({ users: "--", properties: "--", bookings: "--" });
	const [analytics, setAnalytics] = useState({ recentUsers: [], totalRevenue: 0, bookingTrends: [] });

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/auth/login");
		}
	}, [status, router]);


	useEffect(() => {
		async function fetchStats() {
			const res = await fetch("/api/admin/stats");
			if (res.ok) {
				const data = await res.json();
				setStats(data);
			}
		}
		fetchStats();

		async function fetchAnalytics() {
			const res = await fetch("/api/admin/analytics");
			if (res.ok) {
				const data = await res.json();
				setAnalytics(data);
			}
		}
		fetchAnalytics();
	}, []);

	if (status === "unauthenticated") {
		return null;
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<AdminNavbar />
			<main className="flex-1 p-10 ml-64">
				<div className="mb-8 rounded-2xl border border-teal-100 bg-white p-6 shadow-lg">
					<h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
						Welcome Admin <span className="text-black">👋</span>
					</h1>
					<p className="text-teal-600 font-medium">Overview of platform stats and analytics</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<Users className="w-8 h-8 text-teal-500" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Users</div>
							<div className="text-2xl text-teal-700 font-extrabold">{stats.users}</div>
						</div>
					</div>
					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<Home className="w-8 h-8 text-teal-400" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Properties</div>
							<div className="text-2xl text-teal-600 font-extrabold">{stats.properties}</div>
						</div>
					</div>
					<div className="bg-white rounded-2xl shadow-lg p-6 border border-teal-100 flex items-center gap-4">
						<Calendar className="w-8 h-8 text-teal-300" />
						<div>
							<div className="text-lg font-bold text-gray-900">Total Bookings</div>
							<div className="text-2xl text-teal-500 font-extrabold">{stats.bookings}</div>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-lg p-8 border border-teal-100 mt-8">
					<div className="flex items-center gap-3 mb-6">
						<BarChart2 className="w-7 h-7 text-teal-600" />
						<h2 className="text-2xl font-bold text-gray-900">Analytics & Revenue</h2>
					</div>
					<div className="mb-6">
						<div className="text-lg font-semibold text-gray-800 mb-2">Recent Users</div>
						<ul className="text-gray-700 text-sm">
							{analytics.recentUsers.length === 0 && <li>No recent users.</li>}
							{analytics.recentUsers.map((user: any) => (
								<li key={user._id} className="mb-1">
									<span className="font-medium">{user.name}</span> &lt;{user.email}&gt;
								</li>
							))}
						</ul>
					</div>
					<div className="mb-6">
						<div className="text-lg font-semibold text-gray-800 mb-2">Total Revenue</div>
						<div className="text-2xl text-teal-700 font-extrabold flex items-center gap-2">
							<DollarSign className="w-5 h-5 inline-block text-teal-500" />
							{analytics.totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
						</div>
					</div>
					<div>
						<div className="text-lg font-semibold text-gray-800 mb-2">Booking Trends (Last 6 Months)</div>
						<div className="overflow-x-auto">
							<table className="min-w-[300px] text-sm">
								<thead>
									<tr className="text-teal-700">
										<th className="px-2 py-1 text-left">Month</th>
										<th className="px-2 py-1 text-left">Bookings</th>
									</tr>
								</thead>
								<tbody>
									{analytics.bookingTrends.length === 0 && (
										<tr><td colSpan={2}>No data</td></tr>
									)}
									{analytics.bookingTrends.map((trend: any) => (
										<tr key={trend._id.year + '-' + trend._id.month}>
											<td className="px-2 py-1">{trend._id.month}/{trend._id.year}</td>
											<td className="px-2 py-1">{trend.count}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
