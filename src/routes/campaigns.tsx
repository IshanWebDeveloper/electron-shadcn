import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Plus, Send, Target } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ipc } from "@/ipc/manager";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  message: string;
  name: string;
  sentAt: string | null;
  sentCount: number;
  target: string;
}

interface CreateCampaignInput {
  message: string;
  name: string;
  target?: string;
}

export const Route = createFileRoute("/campaigns")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    target: "All Customers",
  });

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => ipc.client.pos.getCampaigns(),
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: CreateCampaignInput) =>
      ipc.client.pos.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setIsModalOpen(false);
      setNewCampaign({ name: "", message: "", target: "All Customers" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-8 pt-4">
        <Skeleton className="h-12 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-48 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-hidden pt-2">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="font-black text-white text-xl uppercase italic tracking-tight">
            SMS Campaigns
          </h2>
          <p className="mt-1 font-bold text-muted-foreground/40 text-xs uppercase tracking-widest">
            Marketing & Engagement
          </p>
        </div>
        <Button
          className="h-12 rounded-2xl bg-primary px-6 font-black text-[10px] text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        {campaigns.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-[2.5rem] border-2 border-white/5 border-dashed bg-white/5 p-12 text-muted-foreground/20">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-center font-bold">No active campaigns</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card
                className="group relative overflow-hidden rounded-[2rem] border-none bg-white/5 transition-all duration-300 hover:bg-white/8"
                key={campaign.id}
              >
                <div className="absolute top-4 right-4">
                  <Badge
                    className={cn(
                      "rounded-md border-none px-2 py-0.5 font-black text-[9px] uppercase tracking-tighter",
                      campaign.sentAt
                        ? "bg-success/20 text-success"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {campaign.sentAt ? "Sent" : "Draft"}
                  </Badge>
                </div>
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h3 className="truncate font-bold text-lg text-white transition-colors group-hover:text-primary">
                      {campaign.name}
                    </h3>
                  </div>

                  <div className="relative mb-8 rounded-2xl bg-white/5 p-4">
                    <div className="absolute top-4 -left-1 h-8 w-1 rounded-full bg-primary" />
                    <p className="text-muted-foreground/60 text-xs italic leading-relaxed">
                      "{campaign.message}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 border-white/5 border-t pt-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-[9px] text-white/20 uppercase tracking-[0.2em]">
                        Target Group
                      </span>
                      <span className="flex items-center gap-2 font-bold text-white text-xs">
                        <Target className="h-3 w-3 text-primary/40" />{" "}
                        {campaign.target}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-[9px] text-white/20 uppercase tracking-[0.2em]">
                        Sent Count
                      </span>
                      <span className="flex items-center gap-2 font-black text-white text-xs italic">
                        <Send className="h-3 w-3 text-success" />{" "}
                        {campaign.sentCount || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
        <DialogContent className="rounded-3xl border-white/5 bg-[#121212] shadow-2xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-white text-xl italic tracking-tight">
              <Plus className="h-5 w-5 text-primary" /> New Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cmp-name">Campaign Name</Label>
              <Input
                className="h-12 rounded-xl border-none bg-white/5 font-medium"
                id="cmp-name"
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Summer Sale 2024"
                value={newCampaign.name}
              />
            </div>
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cmp-target">Target Segment</Label>
              <Input
                className="h-12 rounded-xl border-none bg-white/5 font-medium"
                id="cmp-target"
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, target: e.target.value }))
                }
                placeholder="VIP Customers"
                value={newCampaign.target}
              />
            </div>
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cmp-msg">Message Content</Label>
              <Textarea
                className="h-28 resize-none rounded-xl border-none bg-white/5 p-4 font-medium"
                id="cmp-msg"
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, message: e.target.value }))
                }
                placeholder="Hey! Get 50% off on your favorite lunch today..."
                value={newCampaign.message}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-[10px] text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90"
              disabled={
                createCampaignMutation.isPending ||
                !newCampaign.name ||
                !newCampaign.message
              }
              onClick={() => createCampaignMutation.mutate(newCampaign)}
            >
              Initialize Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
