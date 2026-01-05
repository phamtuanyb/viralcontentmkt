import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usersApi } from "@/api/users.api";
import { contentApi } from "@/api/content.api";
import { topicsApi } from "@/api/topics.api";
import { Users, FileText, Tags, Clock, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  totalContents: number;
  totalTopics: number;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalContents: 0,
    totalTopics: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const [usersRes, contentsRes, topicsRes] = await Promise.all([
        usersApi.getAllUsers(),
        contentApi.getAll(),
        topicsApi.getAll(),
      ]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        pendingUsers: usersRes.data?.filter((u) => u.status === "pending").length || 0,
        totalContents: contentsRes.data?.length || 0,
        totalTopics: topicsRes.data?.length || 0,
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "Chờ kích hoạt",
      value: stats.pendingUsers,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Nội dung",
      value: stats.totalContents,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Chủ đề",
      value: stats.totalTopics,
      icon: Tags,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
  ];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan hệ thống MKT Viral Content Platform
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl p-6 card-hover"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Hành động nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/users" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium">Quản lý người dùng</p>
            <p className="text-sm text-muted-foreground">Kích hoạt và phân quyền</p>
          </a>
          <a href="/admin/contents" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <FileText className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium">Quản lý nội dung</p>
            <p className="text-sm text-muted-foreground">Thêm và chỉnh sửa nội dung</p>
          </a>
          <a href="/admin/banners" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <Tags className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium">Quản lý banner</p>
            <p className="text-sm text-muted-foreground">Cập nhật banner trang chủ</p>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;
