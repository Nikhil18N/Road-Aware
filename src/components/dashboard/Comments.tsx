import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, addComment, ComplaintComment } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const Comments = ({ complaintId }: { complaintId: string }) => {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', complaintId],
    queryFn: async () => {
      const res = await getComments(complaintId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (content: string) => addComment(complaintId, content),
    onSuccess: (res) => {
      if (res.success) {
        setNewComment("");
        queryClient.invalidateQueries({ queryKey: ['comments', complaintId] });
      } else {
        toast({ title: "Error", description: res.message, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    mutation.mutate(newComment);
  };

  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Comments & Notes</h3>
      </div>
      
      <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to add a note!</p>
        ) : (
          comments?.map((comment: ComplaintComment) => (
            <div key={comment.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-start mb-1 border-b pb-1">
                <span className="font-medium text-primary">{comment.user_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-foreground whitespace-pre-wrap mt-2">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 isolate">
          <Textarea 
            placeholder="Add a comment or note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={mutation.isPending}
          />
          <Button type="submit" disabled={!newComment.trim() || mutation.isPending} className="self-end">
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </form>
      ) : (
        <div className="bg-muted p-3 text-center rounded-md text-sm text-muted-foreground">
          Please log in to add comments or notes.
        </div>
      )}
    </div>
  );
};
