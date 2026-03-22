import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Clock, User, FileText, CheckCircle2, AlertCircle, Wrench, ClipboardCheck, Phone, Mail, Lock, List } from "lucide-react";
import { getComplaintById, getComplaintsByContact } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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
  timeline: {
    status: string;
    date: string;
    description: string;
    icon: typeof CheckCircle2;
    isCompleted: boolean;
  }[];
}

const mockComplaint: ComplaintDetails = {
  id: "SMC-2026-001234",
  type: "Pothole",
  severity: "Critical",
  status: "In Progress",
  location: "MG Road, Near City Mall",
  ward: "Ward 12",
  reportedBy: "Rajesh Kumar",
  reportedAt: "January 30, 2026 at 10:30 AM",
  assignedTo: "Public Works Dept. - Team Alpha",
  timeline: [
    {
      status: "Reported",
      date: "Jan 30, 10:30 AM",
      description: "Complaint submitted by citizen",
      icon: FileText,
      isCompleted: true,
    },
    {
      status: "Under Review",
      date: "Jan 30, 11:15 AM",
      description: "Complaint verified by ward officer",
      icon: ClipboardCheck,
      isCompleted: true,
    },
    {
      status: "Assigned",
      date: "Jan 30, 2:00 PM",
      description: "Assigned to Public Works Dept.",
      icon: User,
      isCompleted: true,
    },
    {
      status: "In Progress",
      date: "Jan 31, 9:00 AM",
      description: "Repair work has started",
      icon: Wrench,
      isCompleted: true,
    },
    {
      status: "Resolved",
      date: "Pending",
      description: "Awaiting completion",
      icon: CheckCircle2,
      isCompleted: false,
    },
  ],
};

const TrackComplaint = () => {
  const { toast } = useToast();
  const [trackingMode, setTrackingMode] = useState<"anonymous" | "verified" | "mycomplaints">("anonymous");
  const [searchId, setSearchId] = useState("");
  const [verificationContact, setVerificationContact] = useState("");
  const [myComplaintsContact, setMyComplaintsContact] = useState("");
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);

  const handleSearchByContact = async () => {
    if (!myComplaintsContact.trim()) {
      toast({
        title: "Contact Required",
        description: "Please enter your phone number or email.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setComplaint(null);
    setComplaintsList([]);

    try {
      const result = await getComplaintsByContact(myComplaintsContact.trim());

      if (result.success && result.data) {
        if (result.data.count === 0) {
          setNotFound(true);
          toast({
            title: "No Complaints Found",
            description: "No complaints found with this contact information.",
            variant: "destructive",
          });
        } else {
          setComplaintsList(result.data.complaints);
          toast({
            title: "Success",
            description: `Found ${result.data.count} complaint(s)`,
          });
        }
      } else {
        setNotFound(true);
        toast({
          title: "Search Failed",
          description: result.message || "Failed to search complaints.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to search complaints.",
        variant: "destructive",
      });
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;

    // For verified mode, check if verification contact is provided
    if (trackingMode === "verified" && !verificationContact.trim()) {
      toast({
        title: "Verification Required",
        description: "Please enter your phone number or email for verified tracking.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setComplaint(null);
    setShowVerifiedInfo(false);

    try {
      const result = await getComplaintById(searchId.trim());

      if (result.success && result.data) {
        // Check verification if in verified mode
        if (trackingMode === "verified") {
          const data = result.data;
          const contactMatches =
            (data.reporter_phone && data.reporter_phone === verificationContact.trim()) ||
            (data.reporter_email && data.reporter_email.toLowerCase() === verificationContact.trim().toLowerCase());

          if (!contactMatches) {
            toast({
              title: "Verification Failed",
              description: "The contact information does not match our records.",
              variant: "destructive",
            });
            setNotFound(true);
            setIsSearching(false);
            return;
          }

          setShowVerifiedInfo(true);
          toast({
            title: "Verification Successful",
            description: "Your complaint has been verified. Showing full details.",
          });
        }

        // Transform backend data to component format
        const formattedComplaint: ComplaintDetails = {
          id: result.data.id,
          type: "Road Damage", // Backend doesn't have type, using generic
          severity: result.data.severity || "Unknown",
          status: result.data.status,
          location: `${result.data.latitude}, ${result.data.longitude}`,
          ward: "N/A", // Backend doesn't have ward info
          reportedBy: showVerifiedInfo && result.data.reporter_name ? result.data.reporter_name : "Citizen",
          reportedAt: new Date(result.data.created_at).toLocaleString(),
          assignedTo: null, // Backend doesn't have assignment yet
          timeline: [
            {
              status: "Reported",
              date: new Date(result.data.created_at).toLocaleString(),
              description: "Complaint submitted by citizen",
              icon: FileText,
              isCompleted: true,
            },
            {
              status: result.data.status === 'processing' ? 'Processing' : 'Analyzed',
              date: new Date(result.data.updated_at).toLocaleString(),
              description: result.data.status === 'processing'
                ? 'Image analysis in progress'
                : `${result.data.potholes_detected || 0} potholes detected`,
              icon: result.data.status === 'analyzed' ? CheckCircle2 : Wrench,
              isCompleted: result.data.status === 'analyzed',
            },
          ],
        };

        setComplaint(formattedComplaint);
      } else {
        setNotFound(true);
        toast({
          title: "Complaint Not Found",
          description: result.message || "Please check the ID and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      toast({
        title: "Error",
        description: "Failed to fetch complaint details.",
        variant: "destructive",
      });
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-success text-success-foreground";
      case "In Progress":
        return "bg-primary text-primary-foreground";
      case "Assigned":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-secondary/30">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Search className="h-4 w-4" />
              <span>Track Your Complaint</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-3">
              Track Complaint Status
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your complaint ID to view the current status and resolution timeline
            </p>
          </div>

          {/* Search Form with Tabs */}
          <Card className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="text-lg">Track Your Complaint</CardTitle>
              <CardDescription>
                Enter your complaint ID. Add contact info for full details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={trackingMode} onValueChange={(value) => setTrackingMode(value as "anonymous" | "verified" | "mycomplaints")}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="anonymous">
                    <Search className="h-4 w-4 mr-2" />
                    Quick Track
                  </TabsTrigger>
                  <TabsTrigger value="verified">
                    <Lock className="h-4 w-4 mr-2" />
                    Verified
                  </TabsTrigger>
                  <TabsTrigger value="mycomplaints">
                    <List className="h-4 w-4 mr-2" />
                    My Complaints
                  </TabsTrigger>
                </TabsList>

                {/* Anonymous Tracking */}
                <TabsContent value="anonymous" className="space-y-4">
                  <div>
                    <Label htmlFor="complaint-id">Complaint ID</Label>
                    <Input
                      id="complaint-id"
                      placeholder="e.g., abc123-def456-ghi789"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="w-full"
                    disabled={isSearching || !searchId.trim()}
                  >
                    {isSearching ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Track Complaint
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Limited info available without verification
                  </p>
                </TabsContent>

                {/* Verified Tracking */}
                <TabsContent value="verified" className="space-y-4">
                  <div>
                    <Label htmlFor="complaint-id-verified">Complaint ID</Label>
                    <Input
                      id="complaint-id-verified"
                      placeholder="e.g., abc123-def456-ghi789"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verification">Phone or Email</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="verification"
                        placeholder="Phone number or email used while reporting"
                        value={verificationContact}
                        onChange={(e) => setVerificationContact(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="w-full"
                    disabled={isSearching || !searchId.trim() || !verificationContact.trim()}
                  >
                    {isSearching ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Verify & Track
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Full details including contact info will be shown
                  </p>
                </TabsContent>

                {/* My Complaints - View all by contact */}
                <TabsContent value="mycomplaints" className="space-y-4">
                  <div>
                    <Label htmlFor="my-contact">Phone or Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="my-contact"
                        placeholder="Enter your phone number or email"
                        value={myComplaintsContact}
                        onChange={(e) => setMyComplaintsContact(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearchByContact}
                    className="w-full"
                    disabled={isSearching || !myComplaintsContact.trim()}
                  >
                    {isSearching ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <List className="h-5 w-5 mr-2" />
                        View My Complaints
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    See all complaints submitted with this contact info
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Not Found Message */}
          {notFound && (
            <Card className="animate-slide-up border-destructive/50">
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Complaint Not Found
                </h3>
                <p className="text-muted-foreground">
                  No complaint found with ID "{searchId}". Please check the ID and try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Complaint Details */}
          {complaint && (
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {/* Verification Badge */}
              {showVerifiedInfo && (
                <Card className="bg-success/10 border-success">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-success/20">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-success">Verified Tracking</p>
                        <p className="text-sm text-muted-foreground">
                          Showing full details with contact information
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!showVerifiedInfo && trackingMode === "anonymous" && (
                <Card className="bg-warning/10 border-warning">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-warning/20">
                        <AlertCircle className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-semibold text-warning">Limited Information</p>
                        <p className="text-sm text-muted-foreground">
                          Use "Verified Track" with your contact info for full details
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-mono">{complaint.id}</CardTitle>
                      <CardDescription className="mt-1">
                        {complaint.type} • {complaint.severity} Priority
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(complaint.status)} px-4 py-1.5 text-sm`}>
                      {complaint.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.location}
                          <br />
                          {complaint.ward}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Reported On</p>
                        <p className="text-sm text-muted-foreground">{complaint.reportedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Reported By</p>
                        <p className="text-sm text-muted-foreground">{complaint.reportedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Wrench className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Assigned To</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.assignedTo || "Not yet assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resolution Timeline</CardTitle>
                  <CardDescription>
                    Track the progress of your complaint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {complaint.timeline.map((item, index) => (
                      <div key={item.status} className="flex gap-4 pb-8 last:pb-0">
                        {/* Connector Line */}
                        {index < complaint.timeline.length - 1 && (
                          <div
                            className={`absolute left-5 mt-10 w-0.5 h-[calc(100%-2.5rem)] ${
                              item.isCompleted ? "bg-primary" : "bg-border"
                            }`}
                            style={{ top: `${index * 80 + 40}px`, height: "40px" }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            item.isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p
                              className={`font-semibold ${
                                item.isCompleted ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {item.status}
                            </p>
                            <p className="text-sm text-muted-foreground">{item.date}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* My Complaints List */}
          {complaintsList.length > 0 && (
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Card className="bg-success/10 border-success">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success/20">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-success">
                        Found {complaintsList.length} Complaint{complaintsList.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All complaints submitted with {myComplaintsContact}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {complaintsList.map((item, index) => (
                <Card key={item.id} className="animate-slide-up" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-mono">{item.id}</CardTitle>
                        <CardDescription className="mt-1">
                          Reported on {new Date(item.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(item.status)} px-3 py-1 text-xs`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Location</p>
                          <p className="text-xs text-muted-foreground">
                            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Status</p>
                          <p className="text-xs text-muted-foreground">
                            {item.status === 'analyzed'
                              ? `${item.potholes_detected || 0} potholes detected`
                              : item.status === 'processing'
                              ? 'Image analysis in progress'
                              : 'Pending review'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {item.severity && (
                      <div className="p-2 bg-muted/50 rounded text-center">
                        <Badge variant="outline">
                          Severity: {item.severity}
                        </Badge>
                      </div>
                    )}
                    {item.description && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        setSearchId(item.id);
                        setVerificationContact(myComplaintsContact);
                        setTrackingMode("verified");
                        setComplaintsList([]);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackComplaint;
