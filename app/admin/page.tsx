"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuthenticatedApi } from "@/hooks/use-api";

interface DashboardStats {
  totalItems: number;
  totalUsers: number;
  totalAbandoned: number;
  totalClaimed: number;
  totalReturned: number;
  recentItems: Array<{
    id: number;
    name: string;
    status: string;
    category: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: number;
    username: string;
    email: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalUsers: 0,
    totalAbandoned: 0,
    totalClaimed: 0,
    totalReturned: 0,
    recentItems: [],
    recentUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { apiCall } = useAuthenticatedApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiCall("http://localhost:8082/api/admin/dashboard");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [apiCall]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your lost and found system
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/users">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/objects">
            <Button variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Manage Objects
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Total items in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandoned Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbandoned}</div>
            <p className="text-xs text-muted-foreground">
              Items waiting to be claimed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned Items</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReturned}</div>
            <p className="text-xs text-muted-foreground">
              Successfully returned items
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'LOST' ? 'bg-red-100 text-red-800' : 
                      item.status === 'FOUND' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 