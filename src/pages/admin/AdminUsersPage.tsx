import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usersApi } from "@/api/users.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/hooks/use-toast";
import { Users, CheckCircle, Clock, Ban, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { AppRole } from "@/store/authStore";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  status: "pending" | "active" | "suspended";
  created_at: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await usersApi.getAllUsers();
    if (data) setUsers(data as User[]);
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
    const { error } = await usersApi.assignRole(userId, role);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: `Đã gán quyền ${role}` });
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
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || "Chưa đặt tên"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
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
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
};

export default AdminUsersPage;
