import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Mail,
  Phone,
  User,
  Bell,
  Lock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { getAllComplaints, Complaint } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailOnStatusChange: true,
    emailOnResolution: true,
    emailOnComment: false,
    smsNotifications: false,
    pushNotifications: true,
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
      });
    }
    
    // Load saved notification preferences from localStorage
    const savedNotifications = localStorage.getItem("road-aware-notifications");
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error("Failed to parse saved notifications:", error);
      }
    }
  }, [user]);

  // Fetch user complaints
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["user-complaints", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await getAllComplaints({ my: "true" });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const complaints = (complaintsData?.complaints || []) as Complaint[];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      // Save profile data to localStorage for persistence
      localStorage.setItem("road-aware-profile", JSON.stringify(data));
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(updatedNotifications);
    
    // Persist to localStorage
    localStorage.setItem("road-aware-notifications", JSON.stringify(updatedNotifications));
    
    toast({
      title: "Updated",
      description: "Notification preference saved",
    });
  };

  // Stats
  const stats = [
    {
      title: "Total Reports",
      value: complaints.length,
      icon: AlertTriangle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Resolved",
      value: complaints.filter((c) => c.status === "resolved").length,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "In Progress",
      value: complaints.filter((c) => c.status !== "resolved" && c.status !== "failed").length,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  const getStatusBadge = (status: string) => {
    const badgeVariants: Record<string, any> = {
      resolved: "default",
      pending: "secondary",
      processing: "outline",
      analyzed: "secondary",
      failed: "destructive",
    };
    return badgeVariants[status] || "secondary";
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="flex items-center justify-center gap-2 p-6 text-destructive font-medium">
                <AlertCircle className="h-5 w-5" />
                Please log in to access your profile.
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="reports">My Reports</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                      placeholder="your@email.com"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for SMS updates and verification
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage your account security and authentication settings
                  </p>
                  <Button variant="outline" className="w-full">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div className="space-y-4 border-b pb-6">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Status Changes</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when your complaint status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOnStatusChange}
                        onCheckedChange={() => handleNotificationChange("emailOnStatusChange")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Resolution Updates</p>
                        <p className="text-xs text-muted-foreground">
                          Notify when your complaint is resolved
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOnResolution}
                        onCheckedChange={() => handleNotificationChange("emailOnResolution")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">New Comments</p>
                        <p className="text-xs text-muted-foreground">
                          Notify when someone comments on your report
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOnComment}
                        onCheckedChange={() => handleNotificationChange("emailOnComment")}
                      />
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="space-y-4 border-b pb-6">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      SMS Notifications
                    </h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Enable SMS Alerts</p>
                        <p className="text-xs text-muted-foreground">
                          Receive text messages for important updates (requires phone number)
                        </p>
                      </div>
                      <Switch
                        checked={notifications.smsNotifications}
                        onCheckedChange={() => handleNotificationChange("smsNotifications")}
                        disabled={!profileData.phone}
                      />
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push Notifications
                    </h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Browser Notifications</p>
                        <p className="text-xs text-muted-foreground">
                          Get desktop alerts for important updates
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={() => handleNotificationChange("pushNotifications")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    My Reports ({complaints.length})
                  </CardTitle>
                  <CardDescription>View all your submitted road damage reports</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : complaints.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {complaints.map((complaint) => (
                            <TableRow key={complaint.id}>
                              <TableCell className="text-sm">
                                {new Date(complaint.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-sm max-w-xs">
                                <span className="truncate">
                                  {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  complaint.severity === "High" ? "destructive" :
                                  complaint.severity === "Medium" ? "secondary" :
                                  "outline"
                                }>
                                  {complaint.severity || "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadge(complaint.status)}>
                                  {complaint.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.location.href = `/track?id=${complaint.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Reports */}
              {complaints.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Your Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Download a copy of all your submitted reports and their statuses
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Export as CSV
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Export as PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
