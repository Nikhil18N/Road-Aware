import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X, FileText, LayoutDashboard, Search, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  const role = user?.user_metadata?.role || 'user';
  const isAdminOrWorker = role === 'admin' || role === 'worker';

  const navLinks = [
    { to: "/", label: "Home", icon: MapPin },
    { to: "/report", label: "Report Damage", icon: FileText },
    { to: "/track", label: "Track Complaint", icon: Search },
    // Show Dashboard only for Staff
    ...(isAdminOrWorker ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md group-hover:shadow-lg transition-shadow">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground leading-tight">SMC Road Watch</h1>
            <p className="text-xs text-muted-foreground">Solapur Municipal Corporation</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant={isActive(link.to) ? "default" : "ghost"}
                size="sm"
                className={isActive(link.to) ? "" : "text-muted-foreground hover:text-foreground"}
              >
                <link.icon className="h-4 w-4 mr-2" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt={user.email || ""} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <span className="text-xs text-primary font-semibold capitalize">{role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/track')}>
                    <Search className="mr-2 h-4 w-4" />
                    <span>My Reports</span>
                  </DropdownMenuItem>
                  {isAdminOrWorker && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Staff Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}


        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur animate-in slide-in-from-top-5">
          <div className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
              >
                <Button
                  variant={isActive(link.to) ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <link.icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
             {!user && (
               <>
                 <div className="h-px bg-border my-2" />
                 <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                   <Button variant="ghost" className="w-full justify-start">Login</Button>
                 </Link>
                 <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                   <Button className="w-full justify-start">Register</Button>
                 </Link>
               </>
             )}
             {user && (
                <>
                <div className="h-px bg-border my-2" />
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                   Logout ({user.email})
                </Button>
                </>
             )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
