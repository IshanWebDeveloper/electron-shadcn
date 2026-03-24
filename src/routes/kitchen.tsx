import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChefHat, Clock, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ipc } from "@/ipc/manager";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kitchen")({
  component: KitchenPage,
});

interface KOTItem {
  id: string;
  name: string;
  notes: string | null;
  quantity: number;
}

interface KOT {
  createdAt: string | number | Date;
  id: string;
  items: KOTItem[];
  status: "sent_to_kitchen" | "partially_ready" | "ready";
  tableId: string | null;
}

function KitchenPage() {
  const queryClient = useQueryClient();

  type KOTStatus = "sent_to_kitchen" | "partially_ready" | "ready";

  const { data: kots = [], isLoading } = useQuery<KOT[]>({
    queryKey: ["kots"],
    queryFn: () => ipc.client.pos.getKOTs(),
    refetchInterval: 5000, // Poll every 5s for KDS
  });

  const updateStatusMutation = useMutation({
    mutationFn: (args: { orderId: string; status: KOTStatus }) =>
      ipc.client.pos.updateKOTStatus(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kots"] });
    },
  });

  const pendingKots = kots.filter((k) => k.status === "sent_to_kitchen");
  const preparingKots = kots.filter((k) => k.status === "partially_ready");
  const readyKots = kots.filter((k) => k.status === "ready");

  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-3 gap-8 pt-4">
        <Skeleton className="h-full rounded-[2.5rem]" />
        <Skeleton className="h-full rounded-[2.5rem]" />
        <Skeleton className="h-full rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-hidden pt-2">
      <div className="grid flex-1 grid-cols-1 gap-8 overflow-hidden pb-4 md:grid-cols-3">
        {/* Pending Column */}
        <div className="flex h-full flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-6">
          <div className="flex shrink-0 items-center justify-between px-2">
            <h3 className="flex items-center gap-3 font-black text-sm text-white/40 uppercase tracking-[0.2em]">
              <ChefHat className="h-4 w-4 text-primary" />
              Incoming
            </h3>
            <Badge className="rounded-lg border-none bg-primary/20 px-2.5 py-0.5 font-black text-primary">
              {pendingKots.length}
            </Badge>
          </div>
          <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto pb-4">
            {pendingKots.map((kot) => (
              <KitchenTicketCard
                actionLabel="Accept Order"
                key={kot.id}
                kot={kot}
                onAction={() =>
                  updateStatusMutation.mutate({
                    orderId: kot.id,
                    status: "partially_ready",
                  })
                }
                statusColor="bg-primary"
              />
            ))}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex h-full flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-6">
          <div className="flex shrink-0 items-center justify-between px-2">
            <h3 className="flex items-center gap-3 font-black text-sm text-white/40 uppercase tracking-[0.2em]">
              <Timer className="h-4 w-4 text-info" />
              Preparing
            </h3>
            <Badge className="rounded-lg border-none bg-info/20 px-2.5 py-0.5 font-black text-info">
              {preparingKots.length}
            </Badge>
          </div>
          <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto pb-4">
            {preparingKots.map((kot) => (
              <KitchenTicketCard
                actionLabel="Dispatch Ready"
                key={kot.id}
                kot={kot}
                onAction={() =>
                  updateStatusMutation.mutate({
                    orderId: kot.id,
                    status: "ready",
                  })
                }
                statusColor="bg-info"
              />
            ))}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex h-full flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-6">
          <div className="flex shrink-0 items-center justify-between px-2">
            <h3 className="flex items-center gap-3 font-black text-sm text-white/40 uppercase tracking-[0.2em]">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Served
            </h3>
            <Badge className="rounded-lg border-none bg-success/20 px-2.5 py-0.5 font-black text-success">
              {readyKots.length}
            </Badge>
          </div>
          <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto pb-4">
            {readyKots.map((kot) => (
              <KitchenTicketCard
                key={kot.id}
                kot={kot}
                statusColor="bg-success"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KitchenTicketCard({
  kot,
  onAction,
  actionLabel,
  statusColor,
}: {
  kot: KOT;
  onAction?: () => void;
  actionLabel?: string;
  statusColor: string;
}) {
  const timeDiff = Math.floor(
    (Date.now() - new Date(kot.createdAt).getTime()) / 60_000
  );
  const isUrgent = timeDiff > 10;

  return (
    <Card className="group overflow-hidden rounded-[2rem] border-none bg-white/5 shadow-xl transition-all hover:bg-white/8">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("h-6 w-1.5 rounded-full", statusColor)} />
            <div>
              <h4 className="font-black text-white italic tracking-tighter">
                #{kot.id.slice(4, 8).toUpperCase()}
              </h4>
              <p className="font-black text-[10px] text-muted-foreground/30 uppercase tracking-widest">
                Table {kot.tableId || "?"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1 font-black text-[10px] uppercase tracking-widest",
              isUrgent
                ? "animate-pulse border-destructive/20 bg-destructive/10 text-destructive"
                : "border-white/5 bg-white/5 text-muted-foreground/40"
            )}
          >
            <Clock className="h-3 w-3" /> {timeDiff}m
          </div>
        </div>

        <div className="mb-8 space-y-4">
          {kot.items.map((item, idx) => (
            <div
              className="group/item flex items-start justify-between"
              key={idx}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-white/5 font-black text-[10px] text-primary">
                  {item.quantity}
                </div>
                <div>
                  <span className="font-bold text-sm text-white/80 transition-colors group-hover/item:text-white">
                    {item.name}
                  </span>
                  {item.notes && (
                    <p className="mt-0.5 font-medium text-[10px] text-primary italic">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {onAction && (
          <Button
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 font-black text-[9px] text-white uppercase tracking-widest shadow-lg transition-all hover:border-primary hover:bg-primary"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
