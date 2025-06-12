"use client";
import React, { useEffect, useState } from "react";

interface LostObject {
  id: number;
  name: string;
  status: string;
}

const API_BASE = "http://localhost:8080";

export default function AdminObjectsPage() {
  const [objects, setObjects] = useState<LostObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/items`)
      .then(res => {
        if (!res.ok) throw new Error("Failed fetch objects");
        return res.json();
      })
      .then(data => {
        setObjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleValidate(id: number) {
    setError(""); setSuccess("");
    fetch(`${API_BASE}/admin/items/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "validated" }) })
      .then(res => {
        if (!res.ok) throw new Error("Failed update object");
        return res.json();
      })
      .then(updated => {
        setObjects(objs => objs.map(obj => (obj.id === id ? updated : obj)));
        setSuccess("Object validated successfully");
      })
      .catch(err => setError(err.message));
  }

  function handleDelete(id: number) {
    setError(""); setSuccess("");
    fetch(`${API_BASE}/admin/items/${id}`, { method: "DELETE" })
      .then(res => {
        if (!res.ok) throw new Error("Failed delete object");
        setObjects(objs => objs.filter(obj => obj.id !== id));
        setSuccess("Object deleted successfully");
      })
      .catch(err => setError(err.message));
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Object Management</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? <p>Loading objects...</p> : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => (
              <tr key={obj.id}>
                <td className="px-4 py-2 border">{obj.name}</td>
                <td className="px-4 py-2 border">{obj.status}</td>
                <td className="px-4 py-2 border space-x-2">
                  {obj.status !== "validated" && (
                    <button onClick={() => handleValidate(obj.id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Validate</button>
                  )}
                  <button onClick={() => handleDelete(obj.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
} 