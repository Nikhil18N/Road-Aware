import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Calendar,
  Navigation,
} from "lucide-react";
import { getAllComplaints, Complaint, updateComplaintStatus } from "@/services/api";
import ComplaintMap from "@/components/map/ComplaintMap";
import { useToast } from "@/hooks/use-toast";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch complaints assigned to this worker
  const { data: complaintsData, isLoading, refetch } = useQuery({
    queryKey: ['complaints', 'assigned', user?.id, statusFilter],
    queryFn: async () => {
      const filters: any = {
        assigned_to: user?.id,
      };
      if (statusFilter !== 'all') filters.status = statusFilter;

      const response = await getAllComplaints(filters);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const complaints = complaintsData?.complaints || [];

  // Filter by status
  const filteredComplaints = statusFilter === 'all'
    ? complaints
    : complaints.filter(c => c.status === statusFilter);

  // Calculate stats
  const stats = [
    {
      title: "Assigned Reports",
      value: complaints.length.toString(),
      icon: AlertTriangle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "In Progress",
      value: complaints.filter(c => c.status === 'in_progress').length.toString(),
      icon: Wrench,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Completed",
      value: complaints.filter(c => c.status === 'resolved').length.toString(),
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending",
      value: complaints.filter(c => c.status === 'pending' || c.status === 'analyzed').length.toString(),
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      setUpdatingId(complaintId);
      const result = await updateComplaintStatus(complaintId, newStatus);

      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Complaint status updated to ${newStatus}`,
        });
        refetch();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

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
        return "text-primary bg-primary/10";
      case "analyzed":
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
                  Worker Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground">
                Your assigned road repair tasks and work progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
          <Tabs defaultValue="assigned" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="assigned" className="gap-2">
                <Navigation className="h-4 w-4" />
                My Tasks
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <MapPin className="h-4 w-4" />
                Task Locations
              </TabsTrigger>
            </TabsList>

            {/* My Tasks Tab */}
            <TabsContent value="assigned" className="space-y-4">
              {/* Status Filter */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="analyzed">Ready to Work</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks Table */}
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading your tasks...</div>
                  ) : filteredComplaints.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reported</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredComplaints.map((complaint) => (
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
                              {complaint.status !== 'resolved' ? (
                                <Select
                                  value={complaint.status}
                                  onValueChange={(newStatus) => handleStatusUpdate(complaint.id, newStatus)}
                                  disabled={updatingId === complaint.id}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {complaint.status === 'analyzed' && (
                                      <SelectItem value="in_progress">Start Work</SelectItem>
                                    )}
                                    {complaint.status === 'in_progress' && (
                                      <SelectItem value="resolved">Mark Complete</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="default">Completed</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No tasks assigned yet</p>
                      <p className="text-sm mt-2">Check back soon for new work assignments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map">
              <Card>
                <CardHeader>
                  <CardTitle>Task Locations</CardTitle>
                  <CardDescription>Map of your assigned work locations with navigation</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-[500px] bg-gray-100">
                      <p className="text-muted-foreground">Loading map...</p>
                    </div>
                  ) : filteredComplaints.length > 0 ? (
                    <ComplaintMap
                      complaints={filteredComplaints}
                      center={
                        filteredComplaints[0]?.latitude && filteredComplaints[0]?.longitude
                          ? [filteredComplaints[0].latitude, filteredComplaints[0].longitude]
                          : [17.6599, 75.9064] // Solapur default
                      }
                      zoom={13}
                      showHeatmap={false}
                      showNavigation={true}
                    />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No assigned tasks to display on map</p>
                    </div>
                  )}
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

export default WorkerDashboard;
