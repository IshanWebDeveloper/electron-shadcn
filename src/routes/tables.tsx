/** biome-ignore-all lint/style/noNestedTernary: table-card status classes use compact ternary mapping */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { CheckCircle2, Clock, LayoutGrid, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ipc } from "@/ipc/manager";
import { cn } from "@/lib/utils";

interface TablesSearch {
  action?: "addTable";
}

interface Table {
  capacity: number;
  id: string;
  name: string;
  status: "available" | "occupied" | "reserved" | "dirty";
  zone: string;
}

interface CreateTableInput {
  capacity: number;
  name: string;
  zone: string;
}

export const Route = createFileRoute("/tables")({
  component: TablesPage,
});

function TablesPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/tables" }) as TablesSearch;
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    name: "",
    capacity: "2",
    zone: "Main Hall",
  });

  useEffect(() => {
    if (searchParams.action === "addTable") {
      setIsModalOpen(true);
    }
  }, [searchParams.action]);

  // Queries
  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => ipc.client.pos.getTables(),
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (tableId: string) => ipc.client.pos.createOrder({ tableId }),
    onSuccess: (_, tableId) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      navigate({ to: "/order", search: { tableId } });
    },
  });

  const createTableMutation = useMutation({
    mutationFn: (data: CreateTableInput) => ipc.client.pos.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setIsModalOpen(false);
      setNewTable({ name: "", capacity: "2", zone: "Main Hall" });
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: (args: {
      tableId: string;
      status: "available" | "occupied" | "reserved" | "dirty";
    }) => ipc.client.pos.updateTableStatus(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const handleTableClick = (table: Table) => {
    if (table.status === "available") {
      createOrderMutation.mutate(table.id);
    } else {
      navigate({ to: "/order", search: { tableId: table.id } });
    }
  };

  const cycleTableStatus = (table: Table) => {
    const nextStatusByCurrent: Record<
      string,
      "available" | "occupied" | "reserved" | "dirty"
    > = {
      available: "occupied",
      occupied: "reserved",
      reserved: "dirty",
      dirty: "available",
    };

    updateTableStatusMutation.mutate({
      tableId: table.id,
      status: nextStatusByCurrent[table.status] ?? "available",
    });
  };

  const totalTables = tables.length;
  const availableTables = tables.filter(
    (table) => table.status === "available"
  ).length;
  const occupiedTables = tables.filter(
    (table) => table.status === "occupied"
  ).length;

  // Group by zone
  const zones = Array.from(
    new Set(tables.map((table) => table.zone || "Main Hall"))
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton className="h-40 rounded-[2rem]" key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-hidden pt-2">
      <div className="grid shrink-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-[2rem] border-none bg-white/5 p-6 shadow-none transition-colors hover:bg-white/8">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
            <LayoutGrid className="h-12 w-12" />
          </div>
          <p className="font-black text-[10px] text-muted-foreground/40 uppercase tracking-widest">
            Total Floor
          </p>
          <h3 className="font-black text-3xl text-white italic">
            {totalTables} Tables
          </h3>
        </Card>
        <Card className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-[2rem] border-none bg-white/5 p-6 text-success shadow-none transition-colors hover:bg-white/8">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <p className="font-black text-[10px] text-success/40 uppercase tracking-widest">
            Available Now
          </p>
          <h3 className="font-black text-3xl italic">{availableTables} Open</h3>
        </Card>
        <Card className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-[2rem] border-none bg-white/5 p-6 text-primary shadow-none transition-colors hover:bg-white/8">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
            <Clock className="h-12 w-12" />
          </div>
          <p className="font-black text-[10px] text-primary/40 uppercase tracking-widest">
            Active Orders
          </p>
          <h3 className="font-black text-3xl italic">{occupiedTables} Busy</h3>
        </Card>
        <Card
          className="group flex h-32 cursor-pointer flex-col items-center justify-center rounded-[2rem] border-none bg-white/5 p-6 text-white/40 shadow-none transition-all hover:bg-primary hover:text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mb-2 h-8 w-8 transition-transform group-hover:scale-110" />
          <p className="font-black text-[10px] uppercase tracking-widest">
            Add New Table
          </p>
        </Card>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-12 overflow-y-auto pb-10">
        {zones.map((zone) => (
          <div className="space-y-6" key={zone}>
            <h3 className="px-2 font-black text-muted-foreground/30 text-sm uppercase tracking-[0.3em]">
              {zone}
            </h3>
            <div className="grid grid-cols-2 gap-6 px-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {tables
                .filter((table) => (table.zone || "Main Hall") === zone)
                .map((table) => (
                  <Card
                    className={cn(
                      "group relative flex h-44 cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-[2.5rem] border-none bg-white/5 transition-all duration-300 hover:bg-white/8",
                      table.status === "occupied" &&
                        "shadow-[inset_0_0_20px_rgba(255,107,0,0.1)]",
                      createOrderMutation.isPending &&
                        "pointer-events-none opacity-50"
                    )}
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                  >
                    <div
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-3xl font-black text-2xl transition-transform duration-300 group-hover:scale-110",
                        table.status === "occupied"
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : table.status === "reserved"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-white/5 text-white/40"
                      )}
                    >
                      {table.name.replace(/\D/g, "") || table.name.charAt(0)}
                    </div>

                    <div className="px-4 text-center">
                      <h4 className="mb-1 font-bold text-sm text-white">
                        {table.name}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5">
                        <Badge
                          className={cn(
                            "rounded-md border-none px-2 py-0.5 font-black text-[8px] uppercase tracking-wider",
                            table.status === "occupied"
                              ? "bg-primary/20 text-primary"
                              : table.status === "reserved"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-white/10 text-white/40"
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            cycleTableStatus(table);
                          }}
                        >
                          {table.status}
                        </Badge>
                        <span className="font-bold text-[10px] text-muted-foreground/30">
                          • {table.capacity} PAX
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
        <DialogContent className="rounded-3xl border-white/5 bg-[#121212] shadow-2xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-white text-xl">
              <Plus className="h-5 w-5 text-primary" /> New Table
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="tbl-name">Table Number/Name</Label>
              <Input
                className="h-12 rounded-xl border-none bg-white/5 font-medium"
                id="tbl-name"
                onChange={(e) =>
                  setNewTable((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Table 1"
                value={newTable.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 font-bold text-sm text-white/60">
                <Label htmlFor="tbl-cap">Capacity</Label>
                <Input
                  className="h-12 rounded-xl border-none bg-white/5 font-medium"
                  id="tbl-cap"
                  onChange={(e) =>
                    setNewTable((p) => ({ ...p, capacity: e.target.value }))
                  }
                  placeholder="2"
                  type="number"
                  value={newTable.capacity}
                />
              </div>
              <div className="grid gap-2 font-bold text-sm text-white/60">
                <Label htmlFor="tbl-zone">Floor Zone</Label>
                <Select
                  onValueChange={(val) =>
                    setNewTable((p) => ({ ...p, zone: val }))
                  }
                  value={newTable.zone}
                >
                  <SelectTrigger
                    className="h-12 rounded-xl border-none bg-white/5 font-medium italic"
                    id="tbl-zone"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="border-white/5 bg-[#1a1a1a]">
                    <SelectItem value="Main Hall">Main Hall</SelectItem>
                    <SelectItem value="Terrace">Terrace</SelectItem>
                    <SelectItem value="VIP Lounge">VIP Lounge</SelectItem>
                    <SelectItem value="Bar Area">Bar Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              disabled={
                createTableMutation.isPending ||
                !newTable.name ||
                !newTable.capacity
              }
              onClick={() =>
                createTableMutation.mutate({
                  ...newTable,
                  capacity: Number.parseInt(newTable.capacity, 10),
                })
              }
            >
              Add to Floor Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
