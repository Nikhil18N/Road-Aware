import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Calendar,
  BarChart3,
  Users,
  Wrench,
  Download,
} from "lucide-react";
import { getAllComplaints, Complaint, getDepartmentAnalytics, DepartmentStats } from "@/services/api";
import { DepartmentStatsView } from "@/components/dashboard/DepartmentStats";
import { AssignDepartmentDialog } from "@/components/dashboard/AssignDepartmentDialog";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch all complaints (admin sees everything)
  const { data: complaintsData, isLoading, refetch } = useQuery({
    queryKey: ['complaints', 'all', statusFilter, severityFilter],
    queryFn: async () => {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (severityFilter !== 'all') filters.severity = severityFilter;

      const response = await getAllComplaints(filters);
      if (!response.success) throw new Error(response.message);
      return response.data;
    }
  });

  const complaints = complaintsData?.complaints || [];

  const filteredReports = complaints.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.image_url && report.image_url.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || report.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Calculate stats
  const stats = [
    {
      title: "Total Reports",
      value: complaints.length.toString(),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending",
      value: complaints.filter(c => c.status === 'pending' || c.status === 'processing').length.toString(),
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "In Progress",
      value: complaints.filter(c => c.status === 'in_progress' || c.status === 'analyzed').length.toString(),
      icon: Wrench,
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

  const exportToCSV = () => {
    if (!complaintsData?.data?.length) return;
    
    // Create CSV header
    const headers = ['ID', 'Date', 'Status', 'Severity', 'Location', 'Description', 'Pothole Count'];
    
    // Create CSV rows
    const rows = complaintsData.data.map((report: Complaint) => [
      report.id.substring(0, 8),
      new Date(report.created_at).toLocaleDateString(),
      report.status,
      report.severity || 'N/A',
      `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`,
      `"${(report.description || '').replace(/"/g, '""')}"`, // escape quotes
      report.potholes_detected || 0
    ]);
    
    // Combine header and rows
    const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
    
    // Create and download the blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `road-aware-reports-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground">
                Manage all road damage reports and monitor system performance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={exportToCSV}
                disabled={!complaintsData?.data.length}
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
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
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="reports" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                All Reports
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="departments" className="gap-2">
                <Users className="h-4 w-4" />
                Departments
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID or location..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="analyzed">Analyzed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severity</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Table */}
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading reports...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead className="hidden md:table-cell">Location</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Reported At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.length > 0 ? (
                          filteredReports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-mono text-sm font-medium">
                                {report.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-primary" />
                                  <span className="text-sm text-muted-foreground">
                                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getSeverityVariant(report.severity)}>
                                  {report.severity || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                    report.status
                                  )}`}
                                >
                                  {report.status}
                                </span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                {new Date(report.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedComplaint(report);
                                    setShowAssignDialog(true);
                                  }}
                                >
                                  Manage
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No complaints found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reports by Status</CardTitle>
                    <CardDescription>Distribution of complaint statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { status: "Resolved", count: complaints.filter(c => c.status === 'resolved').length },
                        { status: "In Progress", count: complaints.filter(c => c.status === 'in_progress').length },
                        { status: "Processing", count: complaints.filter(c => c.status === 'processing').length },
                        { status: "Pending", count: complaints.filter(c => c.status === 'pending').length },
                      ].map((item) => (
                        <div key={item.status} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{item.status}</span>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${complaints.length > 0 ? (item.count / complaints.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reports by Severity</CardTitle>
                    <CardDescription>Severity distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { severity: "Critical", count: complaints.filter(c => c.severity === 'Critical').length },
                        { severity: "High", count: complaints.filter(c => c.severity === 'High').length },
                        { severity: "Medium", count: complaints.filter(c => c.severity === 'Medium').length },
                        { severity: "Low", count: complaints.filter(c => c.severity === 'Low').length },
                      ].map((item) => (
                        <div key={item.severity} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{item.severity}</span>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${complaints.length > 0 ? (item.count / complaints.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments">
              <DepartmentStatsView />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {selectedComplaint && (
        <AssignDepartmentDialog
          complaint={selectedComplaint}
          isOpen={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          onSuccess={() => {
            refetch();
            setShowAssignDialog(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;
