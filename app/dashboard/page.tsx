"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Package,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  Activity,
  Calendar,
  Award,
  Bell,
  Settings,
  Filter,
  Download,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAuthenticatedApi } from "@/hooks/use-api"

interface DashboardData {
  totalReportedItems: number;
  totalClaimedItems: number;
  totalLostItems: number;
  totalFoundItems: number;
  successRate: number;
  recentItems: Array<{
    id: number;
    name: string;
    status: string;
    category: string;
    location: string;
    imageUrl?: string;
    createdAt: string;
  }>;
  claimedItems: Array<{
    id: number;
    name: string;
    status: string;
    category: string;
    location: string;
    imageUrl?: string;
    claimedAt: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    itemName: string;
    itemId: number;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { apiCall } = useAuthenticatedApi();
  const [activeTab, setActiveTab] = useState("overview")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!session) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiCall("/api/user/dashboard");
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [session, apiCall]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} jour${days === 1 ? "" : "s"}`;
    if (hours > 0) return `${hours} heure${hours === 1 ? "" : "s"}`;
    if (minutes > 0) return `${minutes} min`;
    return "À l'instant";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "REPORTED": return <Plus className="h-4 w-4 text-green-600" />;
      case "CLAIMED": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "UPDATED": return <Settings className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "found":
        return <Badge variant="default" className="bg-green-100 text-green-800">Trouvé</Badge>;
      case "lost":
        return <Badge variant="destructive">Perdu</Badge>;
      case "claimed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Réclamé</Badge>;
      case "returned":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Rendu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-lg">Chargement du tableau de bord...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session?.user?.name}! Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button asChild>
            <Link href="/report">
              <Plus className="h-4 w-4 mr-2" />
              Signaler un objet
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="my-items">Mes objets</TabsTrigger>
          <TabsTrigger value="claimed">Réclamés</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Objets signalés</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalReportedItems}</div>
                <p className="text-xs text-muted-foreground">
                  Total d'objets que vous avez signalés
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Objets réclamés</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalClaimedItems}</div>
                <p className="text-xs text-muted-foreground">
                  Objets que vous avez réclamés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.successRate}%</div>
                <Progress value={data.successRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Objets signalés qui ont été réclamés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Objets trouvés</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalFoundItems}</div>
                <p className="text-xs text-muted-foreground">
                  Objets trouvés que vous avez signalés
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités les plus utilisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button asChild className="h-20 flex flex-col space-y-2">
                  <Link href="/report">
                    <Plus className="h-6 w-6" />
                    <span>Signaler un objet trouvé</span>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-20 flex flex-col space-y-2">
                  <Link href="/search">
                    <Search className="h-6 w-6" />
                    <span>Rechercher des objets</span>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-20 flex flex-col space-y-2">
                  <Link href="/map">
                    <MapPin className="h-6 w-6" />
                    <span>Voir la carte</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune activité récente
                  </p>
                ) : (
                  data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.itemName}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes objets signalés</CardTitle>
              <CardDescription>
                Objets que vous avez signalés comme trouvés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.recentItems.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun objet signalé</p>
                    <Button asChild className="mt-4">
                      <Link href="/report">Signaler un objet</Link>
                    </Button>
                  </div>
                ) : (
                  data.recentItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          {getStatusBadge(item.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claimed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Objets réclamés</CardTitle>
              <CardDescription>
                Objets que vous avez réclamés auprès d'autres utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.claimedItems.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun objet réclamé</p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/search">Rechercher des objets</Link>
                    </Button>
                  </div>
                ) : (
                  data.claimedItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          {getStatusBadge(item.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.claimedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique d'activité</CardTitle>
              <CardDescription>
                Chronologie complète de vos actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune activité pour le moment</p>
                  </div>
                ) : (
                  data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                      <div className="mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-muted-foreground">{activity.itemName}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(activity.timestamp).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}