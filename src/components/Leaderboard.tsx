import { useState, useEffect } from "react";
import { Trophy, Star, Eye, FileText, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaderboardApi, ActiveMember, TopEditor } from "@/api/leaderboard.api";

export const Leaderboard = () => {
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [topEditors, setTopEditors] = useState<TopEditor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [membersRes, editorsRes] = await Promise.all([
      leaderboardApi.getTopActiveMembers(10),
      leaderboardApi.getTopEditors(10),
    ]);
    if (membersRes.data) setActiveMembers(membersRes.data);
    if (editorsRes.data) setTopEditors(editorsRes.data);
    setIsLoading(false);
  };

  const getInitials = (name: string | null) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Bảng xếp hạng</h2>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active">Thành viên tích cực</TabsTrigger>
          <TabsTrigger value="editors">Top Editors</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {activeMembers.length > 0 ? (
            activeMembers.map((member, index) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <span className={`font-bold text-lg w-6 ${getMedalColor(index)}`}>
                  {index + 1}
                </span>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{member.full_name || "Thành viên"}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.activity_score} điểm hoạt động
                  </p>
                </div>
                {index < 3 && <Trophy className={`h-5 w-5 ${getMedalColor(index)}`} />}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Chưa có dữ liệu xếp hạng
            </p>
          )}
        </TabsContent>

        <TabsContent value="editors" className="space-y-3">
          {topEditors.length > 0 ? (
            topEditors.map((editor, index) => (
              <div
                key={editor.user_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <span className={`font-bold text-lg w-6 ${getMedalColor(index)}`}>
                  {index + 1}
                </span>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={editor.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(editor.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{editor.full_name || "Editor"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {editor.content_count} bài
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {editor.avg_rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {editor.total_views}
                    </span>
                  </div>
                </div>
                {index < 3 && <Trophy className={`h-5 w-5 ${getMedalColor(index)}`} />}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Chưa có dữ liệu xếp hạng
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
