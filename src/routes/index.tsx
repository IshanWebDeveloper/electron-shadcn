import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  LayoutGrid,
  Plus,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ipc } from "@/ipc/manager";
import { cn } from "@/lib/utils";

interface DashboardStatsCardProps {
  color: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  trend: string;
  value: string;
}

interface StaffLineProps {
  name: string;
  orders: number;
  progress: number;
  role: string;
}

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => ipc.client.pos.getDashboardStats(),
    refetchInterval: 10_000, // Refresh every 10s
  });

  if (isLoading) {
    return (
      <div className="space-y-8 pt-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-36 rounded-[2rem]" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-[2.5rem] lg:col-span-2" />
          <Skeleton className="h-96 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8 pt-4 pb-8">
      <div className="grid shrink-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          color="text-primary"
          icon={TrendingUp}
          title="Daily Revenue"
          trend="+12.5%"
          value={`$${stats?.revenue.toLocaleString()}`}
        />
        <DashboardStatsCard
          color="text-white"
          icon={ShoppingCart}
          title="Total Orders"
          trend="+5 new"
          value={stats?.todayOrders.toString() || "0"}
        />
        <DashboardStatsCard
          color="text-white"
          icon={LayoutGrid}
          title="Floor Status"
          trend="Occupied"
          value={`${stats?.activeTables}/${stats?.totalTables}`}
        />
        <Card
          className="group flex cursor-pointer flex-col justify-between rounded-[2rem] border-none bg-primary p-6 shadow-primary/20 shadow-xl transition-transform hover:scale-[1.02]"
          onClick={() => navigate({ to: "/order" })}
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <Plus className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-white/60 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="mb-1 font-black text-[10px] text-white/50 uppercase tracking-widest">
              Quick Action
            </p>
            <h3 className="font-black text-white text-xl italic">
              Create New Order
            </h3>
          </div>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="flex flex-col overflow-hidden rounded-[2.5rem] border-none bg-white/5 shadow-2xl lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="font-black text-white text-xl italic tracking-tight">
              Recent Activity
            </CardTitle>
            <Button
              className="font-black text-[10px] text-primary uppercase tracking-widest hover:bg-primary/10"
              variant="ghost"
            >
              Live Feed
            </Button>
          </CardHeader>
          <CardContent className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-8 pt-2 pb-8">
            {!stats || stats.todayOrders === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 py-20 opacity-20">
                <Clock className="h-12 w-12" />
                <p className="font-bold">No recent activity</p>
              </div>
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <div
                  className="group flex items-center justify-between rounded-3xl border border-transparent bg-white/5 p-5 transition-all hover:border-white/5"
                  key={i}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary transition-transform group-hover:scale-110">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white transition-colors group-hover:text-primary">
                        Order #ORD-{1000 + i}
                      </p>
                      <p className="font-black text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                        Table {i + 2} • {i * 3} mins ago
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white italic">
                      ${(30 + i * 5).toLocaleString()}
                    </p>
                    <Badge className="rounded-md border-none bg-success/20 px-2 py-0 font-black text-[8px] text-success uppercase">
                      Paid
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border-none bg-white/5 p-8">
            <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
            <h3 className="mb-6 font-black text-lg text-white italic">
              Staff Performance
            </h3>
            <div className="space-y-6">
              <StaffLine name="Admin User" orders={12} progress={85} />
              <StaffLine name="John Doe" orders={8} progress={60} />
              <StaffLine name="Jane Smith" orders={15} progress={90} />
            </div>
            <Button
              className="mt-8 h-12 w-full rounded-xl border border-white/5 bg-white/5 font-black text-[10px] text-white uppercase tracking-widest hover:bg-white/10"
              variant="secondary"
            >
              View Team Stats <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          <Card className="relative flex flex-1 flex-col overflow-hidden rounded-[2.5rem] border-none bg-[#1a1a1a] p-8 shadow-2xl">
            <div className="absolute top-0 right-0 flex h-32 w-32 items-center justify-center rounded-bl-[5rem] bg-primary/20 pb-8 pl-8">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-2 font-black text-lg text-white italic">
              Peak Hours
            </h3>
            <p className="mb-8 font-medium text-muted-foreground/60 text-xs">
              Busiest time: 12 PM - 2 PM
            </p>

            <div className="flex flex-1 items-end justify-between gap-2 px-2">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div
                  className="group flex flex-1 flex-col items-center gap-2"
                  key={i}
                >
                  <div
                    className={cn(
                      "w-full origin-bottom rounded-t-lg transition-all duration-500 group-hover:scale-y-110",
                      i === 3
                        ? "bg-primary"
                        : "bg-white/10 group-hover:bg-white/20"
                    )}
                    style={{ height: `${h}%` }}
                  />
                  <span className="font-black text-[8px] text-muted-foreground/30 uppercase">
                    {10 + i}h
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardStatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: DashboardStatsCardProps) {
  return (
    <Card className="group flex h-36 flex-col justify-between rounded-[2rem] border border-transparent border-none bg-white/5 p-6 transition-all hover:border-white/5 hover:bg-white/8">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-transform group-hover:scale-110",
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-lg bg-success/10 px-2 py-1 font-black text-[10px] text-success uppercase tracking-widest">
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-black text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          {title}
        </p>
        <h3 className="font-black text-2xl text-white italic">{value}</h3>
      </div>
    </Card>
  );
}

function StaffLine({ name, role, orders, progress }: StaffLineProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-bold text-white text-xs leading-none">{name}</p>
          <p className="mt-1 font-black text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            {role}
          </p>
        </div>
        <span className="font-black text-[10px] text-primary italic">
          {orders} Orders
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
