import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllComplaints, Complaint } from '@/services/api';
import ComplaintMap from '@/components/map/ComplaintMap';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PublicMap = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [showMyComplaints, setShowMyComplaints] = useState(false);
  
  const role = user?.user_metadata?.role || 'user';
  const isWorker = role === 'admin' || role === 'worker';

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', 'all', statusFilter, severityFilter, assignedToMe, showMyComplaints],
    queryFn: async () => {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (severityFilter !== 'all') filters.severity = severityFilter;
      if (assignedToMe && user) filters.assigned_to = user.id;
      if (showMyComplaints && user) filters.my = true;
      
      const response = await getAllComplaints(filters);
      if (!response.success) throw new Error(response.message);
      return response.data;
    }
  });

  const complaints = data?.complaints || [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Complaint Map</h1>
              <p className="text-muted-foreground mt-1">
                Visualizing road damage reports across the city.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {isWorker && (
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border">
                  <Switch 
                    id="assigned-mode" 
                    checked={assignedToMe}
                    onCheckedChange={setAssignedToMe}
                  />
                  <Label htmlFor="assigned-mode">My Assignments</Label>
              </div>
              )}

              {user && !isWorker && (
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border">
                  <Switch 
                    id="my-complaints-mode" 
                    checked={showMyComplaints}
                    onCheckedChange={setShowMyComplaints}
                  />
                  <Label htmlFor="my-complaints-mode">My Reports</Label>
              </div>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="analyzed">Analyzed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Filter by Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="bg-white border-b px-6 py-4">
              <div className="flex justify-between items-center">
                 <CardTitle className="text-lg">Live Map</CardTitle>
                 <CardDescription>
                    Showing {complaints.length} reports
                 </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-[500px] bg-gray-100">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading map data...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[500px] bg-gray-100 p-8">
                  <Alert variant="destructive" className="max-w-md bg-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load map data: {(error as Error).message}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <ComplaintMap complaints={complaints} showHeatmap={true} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicMap;