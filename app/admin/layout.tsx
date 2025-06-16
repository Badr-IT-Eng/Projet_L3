"use client";
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  LogOut,
  Settings
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.role !== 'ROLE_ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Users className="w-5 h-5 mr-3" />
            Users
          </Link>
          <Link href="/admin/objects" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Package className="w-5 h-5 mr-3" />
            Objects
          </Link>
          <Link href="/admin/settings" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              router.push('/auth/signin');
            }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 