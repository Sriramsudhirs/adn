"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
  createdAt: string;
}

interface Image {
  id: string;
  userId: string;
  originalUrl: string;
  processedUrl: string | null;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, imagesRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/images"),
        ]);

        const usersData = await usersRes.json();
        const imagesData = await imagesRes.json();

        setUsers(usersData);
        setImages(imagesData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{users.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Images</h3>
          <p className="text-3xl font-bold">{images.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Processing Success Rate</h3>
          <p className="text-3xl font-bold">
            {images.length > 0
              ? Math.round(
                  (images.filter((img) => img.status === "COMPLETED").length /
                    images.length) *
                    100
                )
              : 0}
            %
          </p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.credits}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Images</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    {image.processedUrl && (
                      <img
                        src={image.processedUrl}
                        alt="Processed"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {users.find((u) => u.id === image.userId)?.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        image.status === "COMPLETED"
                          ? "success"
                          : image.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {image.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(image.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}