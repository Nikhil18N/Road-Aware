import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, User, FileText, CheckCircle2, AlertCircle, Wrench, ClipboardCheck } from "lucide-react";

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
  const [searchId, setSearchId] = useState("");
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setComplaint(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (searchId.toUpperCase().includes("SMC") || searchId.includes("1234")) {
      setComplaint(mockComplaint);
    } else {
      setNotFound(true);
    }

    setIsSearching(false);
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

          {/* Search Form */}
          <Card className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Complaint ID (e.g., SMC-2026-001234)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <Button type="submit" size="lg" disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </form>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackComplaint;
