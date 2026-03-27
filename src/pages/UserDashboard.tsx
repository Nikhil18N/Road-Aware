import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LayoutDashboard,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { getAllComplaints } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch complaints submitted by this user
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['complaints', 'my', user?.id],
    queryFn: async () => {
      const filters = {
        my: true,
      };

      const response = await getAllComplaints(filters);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const complaints = complaintsData?.complaints || [];

  // Calculate stats
  const stats = [
    {
      title: "Total Reports",
      value: complaints.length.toString(),
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "In Progress",
      value: complaints.filter(c => c.status === 'in_progress' || c.status === 'analyzed').length.toString(),
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Resolved",
      value: complaints.filter(c => c.status === 'resolved').length.toString(),
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  const getSeverityVariant = (severity?: string) => {
    switch (severity) {
      case "High":
      case "Critical":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-success bg-success/10";
      case "in_progress":
      case "analyzed":
        return "text-primary bg-primary/10";
      case "processing":
        return "text-accent bg-accent/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8 bg-secondary/30">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slide-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  My Reports
                </h1>
              </div>
              <p className="text-muted-foreground">
                Track and manage your submitted road damage complaints
              </p>
            </div>
            <Button onClick={() => navigate('/report')}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report New Issue
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {stats.map((stat, index) => (
              <Card
                key={stat.title}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="all" className="gap-2">
                <FileText className="h-4 w-4" />
                All Reports
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Resolved
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* All Reports Tab */}
            <TabsContent value="all">
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading your reports...</div>
                  ) : complaints.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-mono text-sm">
                              {complaint.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-primary" />
                                <span className="text-sm">
                                  {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(complaint.severity)}>
                                {complaint.severity || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  complaint.status
                                )}`}
                              >
                                {complaint.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/track?id=${complaint.id}`)}
                              >
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">No reports submitted yet</p>
                      <Button onClick={() => navigate('/report')}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Report Your First Issue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* In Progress Tab */}
            <TabsContent value="progress">
              <Card>
                <CardContent className="p-0">
                  {complaints.filter(c => c.status === 'in_progress' || c.status === 'analyzed').length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complaints
                          .filter(c => c.status === 'in_progress' || c.status === 'analyzed')
                          .map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-mono text-sm">
                              {complaint.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-primary" />
                                <span className="text-sm">
                                  {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  complaint.status
                                )}`}
                              >
                                {complaint.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/track?id=${complaint.id}`)}
                              >
                                Track
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No reports in progress
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resolved Tab */}
            <TabsContent value="resolved">
              <Card>
                <CardContent className="p-0">
                  {complaints.filter(c => c.status === 'resolved').length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Resolved On</TableHead>
                          <TableHead className="text-right">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complaints
                          .filter(c => c.status === 'resolved')
                          .map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-mono text-sm">
                              {complaint.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-success" />
                                <span className="text-sm">
                                  {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {complaint.resolved_at
                                ? new Date(complaint.resolved_at).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/track?id=${complaint.id}`)}
                              >
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No resolved reports yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Profile & Settings</CardTitle>
                  <CardDescription>Manage your contact details and notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 max-w-md">
                    <div className="grid gap-2">
                      <h3 className="text-sm font-medium">Contact Information</h3>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                        <p><strong>Role:</strong> {user?.user_metadata?.role || 'User'}</p>
                      </div>
                    </div>
                    {/* Feature placeholder for future detailed profile edit */}
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => alert('Profile editing coming soon!')}>
                      Edit Profile Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;
