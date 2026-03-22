import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DepartmentStats, getDepartmentAnalytics } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DepartmentStatsView() {
  const [stats, setStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDepartmentAnalytics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load department stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Department Performance Analytics</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Complaints Overview by Department</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_complaints" name="Total" fill="#8884d8" />
                <Bar dataKey="resolved_complaints" name="Resolved" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Resolution Efficiency (Avg Hours)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {stats.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between border-b pb-2">
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{dept.name}</p>
                            <p className="text-xs text-muted-foreground">{dept.resolved_complaints} resolved</p>
                        </div>
                        <div className="font-bold">
                            {dept.avg_resolution_hours > 0 ? `${dept.avg_resolution_hours}h` : 'N/A'}
                        </div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
