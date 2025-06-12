"use client";
import React, { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
}

const API_BASE = "http://localhost:8080";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/users`)
      .then(res => {
        if (!res.ok) throw new Error("Failed fetch users");
        return res.json();
      })
      .then(data => {
         // Assume backend returns a list of UserDto (with keys id, username, email)
         setUsers(data);
         setLoading(false);
      })
      .catch(err => {
         setError(err.message);
         setLoading(false);
      });
  }, []);

  function handleDelete(id: number) {
    setError(""); setSuccess("");
    fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE" })
      .then(res => {
         if (!res.ok) throw new Error("Failed delete user");
         setUsers(users => users.filter(u => u.id !== id));
         setSuccess("User deleted successfully");
      })
      .catch(err => setError(err.message));
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? <p>Loading users...</p> : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-2 border">{user.username}</td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">
                  <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
} 