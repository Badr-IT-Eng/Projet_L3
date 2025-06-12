"use client";
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isAdmin') !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-6 space-y-4">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          <Link href="/admin" className="hover:bg-gray-800 rounded px-3 py-2">Dashboard</Link>
          <Link href="/admin/users" className="hover:bg-gray-800 rounded px-3 py-2">Users</Link>
          <Link href="/admin/objects" className="hover:bg-gray-800 rounded px-3 py-2">Objects</Link>
          <button onClick={() => { localStorage.removeItem('isAdmin'); router.push('/admin/login'); }} className="hover:bg-gray-800 rounded px-3 py-2 mt-8 text-left">Logout</button>
        </nav>
      </aside>
      <section className="flex-1 bg-gray-50">
        {children}
      </section>
    </div>
  );
} 