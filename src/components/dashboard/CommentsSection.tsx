import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, addComment, ComplaintComment } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CommentsSectionProps {
  complaintId: string;
  isReadOnly?: boolean;
}

export function CommentsSection({ complaintId, isReadOnly = false }: CommentsSectionProps) {
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["comments", complaintId],
    queryFn: async () => {
      const response = await getComments(complaintId);
      if (!response.success) throw new Error(response.message);
      return response.data || [];
    },
  });

  const comments = (commentsData || []) as ComplaintComment[];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await addComment(complaintId, content);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", complaintId] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(commentContent.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (name: string) => {
    if (name.includes("(admin)")) return "bg-red-100 text-red-800";
    if (name.includes("(worker)")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 pb-3 border-b last:border-b-0">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    {(comment.user_name.includes("(admin)") || comment.user_name.includes("(worker)")) && (
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 py-0 h-5 ${getRoleBadgeColor(comment.user_name)}`}
                      >
                        {comment.user_name.includes("(admin)") ? "Admin" : "Worker"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 break-words">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {!isReadOnly && (
          <div className="space-y-2 border-t pt-4">
            <Textarea
              placeholder="Add a note or comment... (e.g., 'Road blocked due to private construction')"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              disabled={isSubmitting}
              className="min-h-20 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCommentContent("")}
                disabled={isSubmitting || !commentContent}
              >
                Clear
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={isSubmitting || !commentContent.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
