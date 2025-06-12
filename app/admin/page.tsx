"use client";
import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ totalItems: number; totalUsers: number; totalAbandoned: number; totalClaimed: number; totalReturned: number }>({ totalItems: 0, totalUsers: 0, totalAbandoned: 0, totalClaimed: 0, totalReturned: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/dashboard`)
      .then(res => {
        if (!res.ok) throw new Error("Failed fetch dashboard stats");
        return res.json();
      })
      .then(data => {
         // Assume backend returns AdminDashboardDto (with keys totalItems, totalUsers, totalAbandoned, totalClaimed, totalReturned)
         setStats({ totalItems: data.totalItems, totalUsers: data.totalUsers, totalAbandoned: data.totalAbandoned, totalClaimed: data.totalClaimed, totalReturned: data.totalReturned });
         setLoading(false);
      })
      .catch(err => {
         setError(err.message);
         setLoading(false);
      });
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome to the admin panel. Use the sidebar to manage users, objects, and more.</p>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
      <div className="mt-8">
        {loading ? <p>Loading stats...</p> : (
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <div className="text-gray-600">Total Items</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-gray-600">Total Users</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.totalAbandoned}</div>
              <div className="text-gray-600">Total Abandoned</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.totalClaimed}</div>
              <div className="text-gray-600">Total Claimed</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.totalReturned}</div>
              <div className="text-gray-600">Total Returned</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 