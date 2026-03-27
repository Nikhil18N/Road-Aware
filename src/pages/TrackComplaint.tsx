import { useState } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, User, FileText, CheckCircle2, AlertCircle, Wrench, Calendar } from "lucide-react";
import { getComplaintById } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { MyComplaintsList } from "@/components/report/MyComplaintsList";
import { format } from "date-fns";
import { Comments } from "@/components/dashboard/Comments";

interface ComplaintDetails {
  id: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  ward: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo: string | null;
  image_url?: string;
  timeline: {
    status: string;
    date: string;
    description: string;
    icon: any;
    isCompleted: boolean;
  }[];
}

const TrackComplaint = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [trackingMode, setTrackingMode] = useState<string>("search");
  const [searchId, setSearchId] = useState("");
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const performSearch = async (id: string) => {
    if (!id.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    setComplaint(null);
    setSearchId(id);

    try {
      const result = await getComplaintById(id);

      if (result.success && result.data) {
        const data = result.data;
        
        // Build timeline
        const timeline = [
          {
            status: "Reported",
            date: format(new Date(data.created_at), 'PPP p'),
            description: "Complaint submitted",
            icon: FileText,
            isCompleted: true,
          }
        ];
        
        if (data.status !== 'processing') {
            timeline.push({
                status: "Processed",
                date: format(new Date(data.updated_at), 'PPP p'),
                description: 'AI Analysis Complete',
                icon: Wrench,
                isCompleted: true,
            });
        }
        
        if (data.status === 'resolved') {
             timeline.push({
                status: "Resolved",
                date: data.resolved_at ? format(new Date(data.resolved_at), 'PPP p') : "Pending",
                description: "Issue fixed",
                icon: CheckCircle2,
                isCompleted: true,
            });
        }

        const formattedComplaint: ComplaintDetails = {
          id: data.id,
          type: "Road Damage",
          severity: data.severity || "Pending Analysis",
          status: data.status,
          location: `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
          ward: "N/A",
          reportedBy: data.reporter_name || "Citizen",
          reportedAt: format(new Date(data.created_at), 'PPP p'),
          assignedTo: null,
          image_url: data.image_url,
          timeline: timeline
        };
        
        setComplaint(formattedComplaint);
      } else {
        setNotFound(true);
        toast({
            title: "Not Found",
            description: "Could not find a complaint with that ID.",
            variant: "destructive",
        });
      }
    } catch (error) {
       console.error(error);
       setNotFound(true);
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container py-8">
         <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Track Complaint</h1>
                <p className="text-muted-foreground">Monitor the status of your road damage reports.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lookup Report</CardTitle>
                    <CardDescription>Search by ID or view your history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="search" value={trackingMode} onValueChange={setTrackingMode}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="search">Search by ID</TabsTrigger>
                            <TabsTrigger value="my" disabled={!user}>My Reports {!user && '(Login Required)'}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Enter Complaint ID (UUID)" 
                                        className="pl-9"
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && performSearch(searchId)}
                                    />
                                </div>
                                <Button onClick={() => performSearch(searchId)} disabled={isSearching}>
                                    {isSearching ? 'Searching...' : 'Track'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="my">
                            {user ? (
                                <MyComplaintsList onSelect={(id) => {
                                    setTrackingMode('search');
                                    performSearch(id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Please login to view your reports.
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {complaint && (
                <Card className="animate-in fade-in slide-in-from-bottom-4">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                {complaint.type}
                                <Badge variant={complaint.status === 'resolved' ? 'default' : 'secondary'}>
                                    {complaint.status}
                                </Badge>
                            </CardTitle>
                            <CardDescription>ID: {complaint.id}</CardDescription>
                        </div>
                        {complaint.image_url && (
                             <img src={complaint.image_url} alt="Evidence" className="h-16 w-16 object-cover rounded-md border" />
                        )}
                     </CardHeader>
                     <CardContent className="space-y-6 pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Severity</Label>
                                <div className="flex items-center font-medium">
                                    <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                                    {complaint.severity}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Reported By</Label>
                                <div className="flex items-center font-medium">
                                    <User className="h-4 w-4 mr-2 text-primary" />
                                    {complaint.reportedBy}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Date</Label>
                                <div className="flex items-center font-medium">
                                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                                    {complaint.reportedAt}
                                </div>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
                                <div className="flex items-center font-medium">
                                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                                    <span className="truncate max-w-[200px]" title={complaint.location}>{complaint.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold mb-4">Status Timeline</h3>
                            <div className="space-y-4">
                                {complaint.timeline.map((event, i) => (
                                    <div key={i} className="relative flex gap-4">
                                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${event.isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <event.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col pt-1">
                                            <span className="font-semibold text-sm">{event.status}</span>
                                            <span className="text-xs text-muted-foreground">{event.date}</span>
                                            <span className="text-sm text-muted-foreground mt-0.5">{event.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Comments complaintId={complaint.id} />
                     </CardContent>
                </Card>
            )}

            {notFound && (
                 <Card className="bg-destructive/10 border-destructive animate-in fade-in">
                    <CardContent className="flex items-center justify-center gap-2 p-6 text-destructive font-medium">
                        <AlertCircle className="h-5 w-5" />
                        Complaint not found. Please check the ID.
                    </CardContent>
                 </Card>
            )}
         </div>
      </main>
    </div>
  );
};

export default TrackComplaint;
