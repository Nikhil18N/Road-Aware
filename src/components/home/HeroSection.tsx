import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Search, ArrowRight, CheckCircle2 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative py-20 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-1 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>Official SMC Initiative</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Report Road Damage.{" "}
              <span className="text-primary">Get Rapid Response.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Help us keep Solapur's roads safe. Report potholes, cracks, and surface damage in real-time. Track your complaints and see resolutions happen faster than ever.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/report">
                <Button size="xl" variant="hero" className="group">
                  <AlertTriangle className="h-5 w-5" />
                  Report Damage
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="xl" variant="outline">
                  <Search className="h-5 w-5" />
                  Track Complaint
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-foreground">2,500+</p>
                <p className="text-sm text-muted-foreground">Issues Resolved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">48 hrs</p>
                <p className="text-sm text-muted-foreground">Avg. Response Time</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">94%</p>
                <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
