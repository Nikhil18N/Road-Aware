import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Department, getDepartments, assignDepartment, Complaint } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AssignDepartmentDialogProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AssignDepartmentDialog({
  complaint,
  isOpen,
  onOpenChange,
  onSuccess
}: AssignDepartmentDialogProps) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch departments when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchDepts = async () => {
        try {
          const res = await getDepartments();
          if (res.success && res.data) {
            setDepartments(res.data);
          }
        } catch (error) {
          console.error('Failed to fetch departments:', error);
          toast({
            title: "Error",
            description: "Failed to load departments",
            variant: "destructive"
          });
        }
      };
      fetchDepts();
      setSelectedDept(""); // Reset selection
    }
  }, [isOpen, toast]);

  const handleAssign = async () => {
    if (!selectedDept || !complaint?.id) {
      toast({
        title: "Error",
        description: "Please select a department",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await assignDepartment(complaint.id, parseInt(selectedDept));

      if (result.success) {
        toast({
          title: "Success",
          description: "Complaint assigned to department successfully"
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to assign complaint",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while assigning",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Department</DialogTitle>
          <DialogDescription>
            Assign this complaint to a department for handling.
            {complaint && (
              <div className="mt-2 text-xs text-foreground">
                Complaint ID: {complaint.id.substring(0, 8)}...
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Department</label>
            <Select
              value={selectedDept}
              onValueChange={setSelectedDept}
              disabled={departments.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose department..." />
              </SelectTrigger>
              <SelectContent>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      <div>
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-xs text-muted-foreground">{dept.code}</div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No departments available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedDept && (
            <div className="rounded-md bg-primary/10 p-3">
              <p className="text-sm">
                <span className="font-medium">Selected: </span>
                {departments.find(d => d.id.toString() === selectedDept)?.name}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || !selectedDept || !complaint}
          >
            {loading ? "Assigning..." : "Assign Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
