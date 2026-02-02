import { useState } from "react";
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
} from "lucide-react";

const statsCards = [
  {
    title: "Total Reports",
    value: "2,547",
    change: "+12%",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Pending",
    value: "127",
    change: "-8%",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "In Progress",
    value: "89",
    change: "+5%",
    icon: Wrench,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Resolved",
    value: "2,331",
    change: "+15%",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const reportsData = [
  {
    id: "SMC-2026-001234",
    type: "Pothole",
    location: "MG Road, Near City Mall",
    ward: "Ward 12",
    severity: "Critical",
    status: "In Progress",
    reportedAt: "Jan 30, 2026",
    assignedTo: "Team Alpha",
  },
  {
    id: "SMC-2026-001233",
    type: "Surface Crack",
    location: "Railway Station Road",
    ward: "Ward 8",
    severity: "Moderate",
    status: "Assigned",
    reportedAt: "Jan 30, 2026",
    assignedTo: "Team Beta",
  },
  {
    id: "SMC-2026-001232",
    type: "Road Cave-in",
    location: "Industrial Area, Sector 5",
    ward: "Ward 15",
    severity: "Critical",
    status: "Under Review",
    reportedAt: "Jan 30, 2026",
    assignedTo: "-",
  },
  {
    id: "SMC-2026-001231",
    type: "Pothole",
    location: "Gandhi Chowk",
    ward: "Ward 3",
    severity: "Low",
    status: "Resolved",
    reportedAt: "Jan 29, 2026",
    assignedTo: "Team Gamma",
  },
  {
    id: "SMC-2026-001230",
    type: "Waterlogging",
    location: "Bus Stand Road",
    ward: "Ward 5",
    severity: "Moderate",
    status: "In Progress",
    reportedAt: "Jan 29, 2026",
    assignedTo: "Team Alpha",
  },
  {
    id: "SMC-2026-001229",
    type: "Edge Erosion",
    location: "University Road",
    ward: "Ward 18",
    severity: "Low",
    status: "Pending",
    reportedAt: "Jan 29, 2026",
    assignedTo: "-",
  },
];

const wardStats = [
  { ward: "Ward 12", reports: 45, resolved: 38, pending: 7 },
  { ward: "Ward 8", reports: 38, resolved: 32, pending: 6 },
  { ward: "Ward 15", reports: 35, resolved: 28, pending: 7 },
  { ward: "Ward 3", reports: 32, resolved: 30, pending: 2 },
  { ward: "Ward 5", reports: 28, resolved: 22, pending: 6 },
];

const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case "Critical":
      return "destructive";
    case "Moderate":
      return "default";
    case "Low":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Resolved":
      return "text-success bg-success/10";
    case "In Progress":
      return "text-primary bg-primary/10";
    case "Assigned":
      return "text-accent bg-accent/10";
    case "Under Review":
      return "text-warning bg-warning/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredReports = reportsData.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || report.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

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
                  Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground">
                Monitor and manage road damage reports across Solapur
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last updated: Jan 31, 2026, 10:00 AM
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statsCards.map((stat, index) => (
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
                      <p className={`text-xs mt-1 ${stat.color}`}>{stat.change} this month</p>
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
              <TabsTrigger value="wards" className="gap-2">
                <MapPin className="h-4 w-4" />
                Ward Stats
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
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Assigned">Assigned</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severity</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden md:table-cell">Location</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-sm font-medium">
                            {report.id}
                          </TableCell>
                          <TableCell>{report.type}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {report.location}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityVariant(report.severity)}>
                              {report.severity}
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
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {report.assignedTo}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reports by Type</CardTitle>
                    <CardDescription>Distribution of road damage types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { type: "Pothole", count: 1250, percentage: 49 },
                        { type: "Surface Crack", count: 650, percentage: 26 },
                        { type: "Waterlogging", count: 350, percentage: 14 },
                        { type: "Edge Erosion", count: 180, percentage: 7 },
                        { type: "Road Cave-in", count: 117, percentage: 4 },
                      ].map((item) => (
                        <div key={item.type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{item.type}</span>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Trends</CardTitle>
                    <CardDescription>Reports received vs resolved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { month: "October", reported: 420, resolved: 398 },
                        { month: "November", reported: 380, resolved: 365 },
                        { month: "December", reported: 450, resolved: 420 },
                        { month: "January", reported: 520, resolved: 485 },
                      ].map((item) => (
                        <div key={item.month} className="flex items-center gap-4">
                          <span className="w-20 text-sm text-muted-foreground">{item.month}</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-3 rounded-full bg-primary/20 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(item.resolved / item.reported) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-20">
                              {item.resolved}/{item.reported}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Ward Stats Tab */}
            <TabsContent value="wards">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Ward-wise Performance
                  </CardTitle>
                  <CardDescription>
                    Report statistics for top 5 wards by volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ward</TableHead>
                        <TableHead>Total Reports</TableHead>
                        <TableHead>Resolved</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Resolution Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wardStats.map((ward) => (
                        <TableRow key={ward.ward}>
                          <TableCell className="font-medium">{ward.ward}</TableCell>
                          <TableCell>{ward.reports}</TableCell>
                          <TableCell className="text-success">{ward.resolved}</TableCell>
                          <TableCell className="text-warning">{ward.pending}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-success rounded-full"
                                  style={{
                                    width: `${(ward.resolved / ward.reports) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Math.round((ward.resolved / ward.reports) * 100)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

export default Dashboard;
