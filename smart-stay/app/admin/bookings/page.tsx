"use client";

import React, { useEffect, useState } from "react";
import AdminNavbar from "@/components/navbar/AdminNavbar";

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function fetchBookings() {
      const res = await fetch("/api/guest/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    }
    fetchBookings();
  }, []);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <AdminNavbar />
      <main className="flex-1 p-10 ml-64">
        <h2 className="text-2xl font-bold text-teal-700 mb-4">Bookings</h2>
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="bg-teal-100 text-teal-700">
              <th className="px-3 py-2 text-left">Guest</th>
              <th className="px-3 py-2 text-left">Property</th>
              <th className="px-3 py-2 text-left">Check In</th>
              <th className="px-3 py-2 text-left">Check Out</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan={5}>No bookings found.</td></tr>}
            {bookings.map((booking: any) => (
              <tr key={booking._id}>
                <td className="px-3 py-2">{booking.guest?.name || booking.guest}</td>
                <td className="px-3 py-2">{booking.property?.title || booking.property}</td>
                <td className="px-3 py-2">{new Date(booking.checkIn).toLocaleDateString()}</td>
                <td className="px-3 py-2">{new Date(booking.checkOut).toLocaleDateString()}</td>
                <td className="px-3 py-2">{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AdminBookingsPage;
