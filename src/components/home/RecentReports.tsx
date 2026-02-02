import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const recentReports = [
  {
    id: "SMC-2026-001234",
    location: "MG Road, Near City Mall",
    ward: "Ward 12",
    type: "Pothole",
    severity: "Critical",
    status: "In Progress",
    reportedAt: "2 hours ago",
  },
  {
    id: "SMC-2026-001233",
    location: "Railway Station Road",
    ward: "Ward 8",
    type: "Surface Crack",
    severity: "Moderate",
    status: "Assigned",
    reportedAt: "4 hours ago",
  },
  {
    id: "SMC-2026-001232",
    location: "Industrial Area, Sector 5",
    ward: "Ward 15",
    type: "Road Cave-in",
    severity: "Critical",
    status: "Under Review",
    reportedAt: "6 hours ago",
  },
  {
    id: "SMC-2026-001231",
    location: "Gandhi Chowk",
    ward: "Ward 3",
    type: "Pothole",
    severity: "Low",
    status: "Resolved",
    reportedAt: "8 hours ago",
  },
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
      return "text-success";
    case "In Progress":
      return "text-primary";
    case "Assigned":
      return "text-accent";
    default:
      return "text-warning";
  }
};

const RecentReports = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="animate-slide-up">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-2">
              Recent Reports
            </h2>
            <p className="text-lg text-muted-foreground">
              Latest road damage reports from citizens
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="group">
              View All Reports
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {recentReports.map((report, index) => (
            <div
              key={report.id}
              className="group rounded-xl bg-card p-5 shadow-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-mono text-primary font-medium">{report.id}</p>
                  <p className="text-lg font-semibold text-foreground mt-1">{report.type}</p>
                </div>
                <Badge variant={getSeverityVariant(report.severity)}>
                  {report.severity}
                </Badge>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{report.location} • {report.ward}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {report.reportedAt}
                </div>
                <span className={`text-sm font-medium ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentReports;
