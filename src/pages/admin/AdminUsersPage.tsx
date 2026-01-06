import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usersApi } from "@/api/users.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Users, CheckCircle, Clock, Ban, Shield, Loader2, Star, X } from "lucide-react";
import { format } from "date-fns";
import type { AppRole } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  status: "pending" | "active" | "suspended";
  created_at: string;
  roles: AppRole[];
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Get only the roles that can be assigned through UI (excludes admin)
  const assignableRoles = usersApi.getAssignableRoles();

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await usersApi.getAllUsersWithRoles();
    if (data) {
      setUsers(data as User[]);
      
      // Fetch activity scores for all users
      const scores: Record<string, number> = {};
      for (const user of data) {
        const { data: scoreData } = await supabase.rpc('get_member_activity_score', { _user_id: user.id });
        scores[user.id] = scoreData || 0;
      }
      setUserScores(scores);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, status: "pending" | "active" | "suspended") => {
    setProcessingId(userId);
    const { error } = await usersApi.updateUserStatus(userId, status);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái người dùng" });
      setUsers(users.map((u) => (u.id === userId ? { ...u, status } : u)));
    }
    setProcessingId(null);
  };

  const handleAssignRole = async (userId: string, role: AppRole) => {
    setProcessingId(userId);
    const result = await usersApi.assignRole(userId, role);
    if (result.error) {
      toast({ title: "Lỗi", description: result.error.message, variant: "destructive" });
    } else if ((result as any).alreadyExists) {
      toast({ title: "Thông báo", description: `Người dùng đã có quyền ${role}` });
    } else {
      toast({ title: "Thành công", description: `Đã gán quyền ${role}` });
      // Update local state
      setUsers(users.map((u) => 
        u.id === userId 
          ? { ...u, roles: [...u.roles, role] } 
          : u
      ));
    }
    setProcessingId(null);
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    setProcessingId(userId);
    const { error } = await usersApi.removeRole(userId, role);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: `Đã xóa quyền ${role}` });
      // Update local state
      setUsers(users.map((u) => 
        u.id === userId 
          ? { ...u, roles: u.roles.filter(r => r !== role) } 
          : u
      ));
    }
    setProcessingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-0"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "suspended":
        return <Badge className="bg-destructive/20 text-destructive border-0"><Ban className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="admin" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "editor":
        return (
          <Badge variant="editor" className="text-xs">
            Editor
          </Badge>
        );
      case "sales":
        return (
          <Badge variant="sales" className="text-xs">
            Sales
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    }
  };

  const getLevelInfo = (userId: string) => {
    const score = userScores[userId] || 0;
    return usersApi.getUserLevel(score);
  };

  const getLevelColor = (level: number): string => {
    if (level <= 2) return "text-muted-foreground";
    if (level <= 4) return "text-green-500";
    if (level <= 6) return "text-blue-500";
    if (level <= 8) return "text-purple-500";
    return "text-amber-500";
  };

  const getLevelBgColor = (level: number): string => {
    if (level <= 2) return "bg-muted";
    if (level <= 4) return "bg-green-500/20";
    if (level <= 6) return "bg-blue-500/20";
    if (level <= 8) return "bg-purple-500/20";
    return "bg-amber-500/20";
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
        </div>
        <p className="text-muted-foreground">
          Kích hoạt tài khoản và phân quyền người dùng
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Người dùng</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Cấp độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const levelInfo = getLevelInfo(user.id);
                const score = userScores[user.id] || 0;
                
                return (
                  <TableRow key={user.id} className="border-border">
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.full_name || "Chưa đặt tên"}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <TooltipProvider key={role}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="group relative inline-flex">
                                    {getRoleBadge(role)}
                                    {role !== "admin" && (
                                      <button
                                        onClick={() => handleRemoveRole(user.id, role)}
                                        disabled={processingId === user.id}
                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center text-xs hidden group-hover:flex"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {role === "admin" ? "Không thể xóa quyền Admin" : "Click để xóa quyền"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Thành viên</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getLevelBgColor(levelInfo.level)}`}>
                                <Star className={`h-3 w-3 ${getLevelColor(levelInfo.level)}`} />
                                <span className={`text-xs font-bold ${getLevelColor(levelInfo.level)}`}>
                                  Cấp {levelInfo.level}
                                </span>
                              </div>
                              <div className="w-16">
                                <Progress value={levelInfo.progress} className="h-1.5" />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p>Điểm: {score}</p>
                              {levelInfo.level < 10 && (
                                <p>Cần {levelInfo.nextLevelScore - score} điểm để lên cấp</p>
                              )}
                              {levelInfo.level >= 10 && <p>Cấp độ tối đa!</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.status}
                          onValueChange={(value) => handleStatusChange(user.id, value as "pending" | "active" | "suspended")}
                          disabled={processingId === user.id}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(value) => handleAssignRole(user.id, value as AppRole)}
                          disabled={processingId === user.id}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <Shield className="h-3 w-3 mr-1" />
                            <span className="text-xs">Gán quyền</span>
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role === "editor" ? "Editor" : "Sales"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
};

export default AdminUsersPage;
