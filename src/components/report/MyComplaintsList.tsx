import { useEffect, useState } from 'react';
import { getAllComplaints, Complaint } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface MyComplaintsListProps {
  onSelect: (id: string) => void;
}

export function MyComplaintsList({ onSelect }: MyComplaintsListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      setLoading(true);
      try {
        const result = await getAllComplaints({ my: true });
        if (result.success && result.data) {
          setComplaints(result.data.complaints);
        }
      } catch (error) {
        console.error("Failed to fetch my complaints", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyComplaints();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  if (complaints.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          You haven't submitted any reports yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Recent Reports</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(complaint.id)}>
            <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-muted">
                 {/* Use a placeholder if image_url is broken or missing */}
                 <img 
                    src={complaint.image_url} 
                    alt="Report" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                    }}
                 />
                 <Badge className="absolute top-2 right-2" variant={complaint.status === 'resolved' ? 'default' : 'secondary'}>
                    {complaint.status}
                 </Badge>
            </div>
            <CardContent className="p-4">
               <div className="flex items-start justify-between mb-2">
                 <p className="font-medium truncate">{complaint.description || 'No description'}</p>
               </div>
               <div className="text-sm text-muted-foreground space-y-1">
                 <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(complaint.created_at), 'PPP')}</span>
                 </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
