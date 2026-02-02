import { MapPin, Phone, Mail, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">SMC Road Watch</h3>
                <p className="text-xs text-muted-foreground">Solapur Municipal Corporation</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An initiative by Solapur Municipal Corporation for efficient road damage reporting and rapid response management.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/report" className="hover:text-primary transition-colors">Report Road Damage</a></li>
              <li><a href="/track" className="hover:text-primary transition-colors">Track Complaint</a></li>
              <li><a href="/dashboard" className="hover:text-primary transition-colors">View Dashboard</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact SMC</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>1800-XXX-XXXX (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>roadwatch@solapur.gov.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>www.solapur.gov.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 Solapur Municipal Corporation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
