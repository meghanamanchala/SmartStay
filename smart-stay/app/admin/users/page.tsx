"use client";

import React, { useEffect, useState } from "react";
import AdminNavbar from "@/components/navbar/AdminNavbar";

const UsersPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.recentUsers || []);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <AdminNavbar />
      <main className="flex-1 p-10 ml-64">
        <h2 className="text-2xl font-bold text-teal-700 mb-4">Users</h2>
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="bg-teal-100 text-teal-700">
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={3}>No users found.</td></tr>}
            {users.map((user: any) => (
              <tr key={user._id}>
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.role || "guest"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default UsersPage;
