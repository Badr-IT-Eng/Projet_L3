"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, Package, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useAuthenticatedApi } from "@/hooks/use-api";

interface LostObject {
  id: number;
  name: string;
  status: string;
  description?: string;
  location?: string;
  category?: string;
  imageUrl?: string;
  reportedAt?: string;
  reportedByUsername?: string;
  claimedAt?: string;
  claimedByUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminObjectsPage() {
  const [objects, setObjects] = useState<LostObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObject, setSelectedObject] = useState<LostObject | null>(null);
  const { toast } = useToast();
  const { apiCall } = useAuthenticatedApi();

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const response = await apiCall("http://localhost:8082/api/items");
      const data = await response.json();
      setObjects(data.items || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({
        title: "Error",
        description: "Failed to fetch objects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await apiCall(`http://localhost:8082/api/admin/items/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "validated" }),
      });

      setObjects(objects.map(obj => 
        obj.id === id ? { ...obj, status: "validated" } : obj
      ));
      toast({
        title: "Success",
        description: "Object validated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to validate object",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this object?")) return;

    try {
      await apiCall(`http://localhost:8082/api/admin/items/${id}`, {
        method: "DELETE",
      });

      setObjects(objects.filter(obj => obj.id !== id));
      toast({
        title: "Success",
        description: "Object deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete object",
        variant: "destructive",
      });
    }
  };

  const filteredObjects = objects.filter(obj =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Objects</h1>
          <p className="text-muted-foreground">
            Manage lost and found objects
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Object Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search objects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Reported At</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObjects.map((obj) => (
                  <TableRow key={obj.id}>
                    <TableCell className="font-medium">{obj.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        obj.status === 'LOST' ? 'destructive' :
                        obj.status === 'FOUND' ? 'default' :
                        'secondary'
                      }>
                        {obj.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{obj.category}</TableCell>
                    <TableCell>{obj.location || 'N/A'}</TableCell>
                    <TableCell>{obj.reportedByUsername || 'Anonymous'}</TableCell>
                    <TableCell>{new Date(obj.reportedAt || obj.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedObject(obj)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {obj.status !== "validated" && (
                            <DropdownMenuItem onClick={() => handleValidate(obj.id)}>
                              Validate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(obj.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedObject} onOpenChange={() => setSelectedObject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedObject?.name}</DialogTitle>
            <DialogDescription>
              Object details and history
            </DialogDescription>
          </DialogHeader>
          {selectedObject && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedObject.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Category</h4>
                  <p className="text-sm text-muted-foreground">{selectedObject.category}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <p className="text-sm text-muted-foreground">{selectedObject.location}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge variant={
                    selectedObject.status === 'LOST' ? 'destructive' :
                    selectedObject.status === 'FOUND' ? 'default' :
                    'secondary'
                  }>
                    {selectedObject.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Reported By</h4>
                  <p className="text-sm text-muted-foreground">{selectedObject.reportedByUsername || 'Anonymous'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Reported At</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedObject.reportedAt || selectedObject.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedObject.claimedByUsername && (
                  <>
                    <div>
                      <h4 className="font-medium mb-1">Claimed By</h4>
                      <p className="text-sm text-muted-foreground">{selectedObject.claimedByUsername}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Claimed At</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedObject.claimedAt!).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
                {selectedObject.imageUrl && (
                  <div>
                    <h4 className="font-medium mb-1">Image</h4>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={selectedObject.imageUrl}
                        alt={selectedObject.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 