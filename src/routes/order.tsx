/** biome-ignore-all lint/style/noNestedTernary: legacy conditional class/UI branches */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CreditCard,
  LayoutGrid,
  Minus,
  Plus,
  Search,
  Send,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ipc } from "@/ipc/manager";
import { cn } from "@/lib/utils";

interface Table {
  id: string;
  name: string;
  status: "available" | "occupied" | "reserved" | "dirty";
}

interface MenuItem {
  description: string | null;
  id: string;
  name: string;
  price: number;
}

interface MenuCategory {
  emoji: string;
  id: string;
  items: MenuItem[];
  name: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
}

interface ActiveOrder {
  customerId?: string | null;
  id: string;
  items: OrderItem[];
  type?: "delivery" | "dine_in" | "takeaway";
}

interface CreateOrderResponse {
  id: string;
}

interface CreateOrderInput {
  customerId?: string;
  tableId: string;
  type: "delivery" | "dine_in" | "takeaway";
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>): { tableId?: string } => {
    return {
      tableId: search.tableId as string | undefined,
    };
  },
  component: OrderPage,
});

function OrderPage() {
  const { tableId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("All");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => ipc.client.pos.getTables(),
  });

  // Queries
  const { data: menu = [] } = useQuery<MenuCategory[]>({
    queryKey: ["menu"],
    queryFn: () => ipc.client.pos.getMenu(),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => ipc.client.pos.getCustomers(),
  });

  const { data: activeOrder, refetch: refetchOrder } =
    useQuery<ActiveOrder | null>({
      queryKey: ["order", tableId],
      queryFn: () => {
        if (!tableId) {
          return null;
        }
        return ipc.client.pos.getActiveOrderForTable({ tableId });
      },
      enabled: !!tableId,
    });

  // Mutations
  const addOrderItemMutation = useMutation({
    mutationFn: (args: {
      orderId: string;
      menuItemId: string;
      name: string;
      price: number;
      quantity: number;
    }) => ipc.client.pos.addOrderItem(args),
    onSuccess: () => refetchOrder(),
  });

  const updateOrderItemQuantityMutation = useMutation({
    mutationFn: (args: { orderItemId: string; quantity: number }) =>
      ipc.client.pos.updateOrderItemQuantity(args),
    onSuccess: () => refetchOrder(),
  });

  const removeOrderItemMutation = useMutation({
    mutationFn: (args: { orderItemId: string }) =>
      ipc.client.pos.removeOrderItem(args),
    onSuccess: () => refetchOrder(),
  });

  const sendToKitchenMutation = useMutation({
    mutationFn: (orderId: string) => ipc.client.pos.sendToKitchen({ orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", tableId] });
      refetchOrder();
    },
  });

  const payOrderMutation = useMutation({
    mutationFn: (args: { orderId: string; tableId: string; amount: number }) =>
      ipc.client.pos.payOrder(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["order", tableId] });
      refetchOrder();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (
      payload: CreateOrderInput
    ): Promise<CreateOrderResponse> => {
      return (await ipc.client.pos.createOrder(payload)) as CreateOrderResponse;
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["order", payload.tableId] });
    },
  });

  const createCurrentOrder = async (): Promise<CreateOrderResponse | null> => {
    if (!tableId) {
      navigate({ to: "/tables" });
      return null;
    }

    if (activeOrder?.id) {
      return { id: activeOrder.id };
    }

    return await createOrderMutation.mutateAsync({
      tableId,
      type: orderType,
      customerId: selectedCustomerId,
    });
  };

  const handleCreateCurrentOrder = () => {
    if (!tableId || activeOrder?.id || createOrderMutation.isPending) {
      return;
    }

    createOrderMutation.mutate({
      tableId,
      type: orderType,
      customerId: selectedCustomerId,
    });
  };

  const handleAddItem = async (item: MenuItem) => {
    const order = await createCurrentOrder();

    if (!order?.id) {
      return;
    }

    addOrderItemMutation.mutate({
      orderId: order.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  const handleChangeItemQuantity = (item: OrderItem, delta: number) => {
    const nextQuantity = item.quantity + delta;

    if (nextQuantity <= 0) {
      removeOrderItemMutation.mutate({ orderItemId: item.id });
      return;
    }

    updateOrderItemQuantityMutation.mutate({
      orderItemId: item.id,
      quantity: nextQuantity,
    });
  };

  const currentTotal =
    activeOrder?.items?.reduce(
      (acc: number, cur: OrderItem) => acc + cur.price * cur.quantity,
      0
    ) || 0;
  const taxAmount = currentTotal * 0.1;
  const grandTotal = currentTotal + taxAmount;

  const categoriesList = ["All", ...menu.map((category) => category.name)];
  const selectedCustomer = customers.find(
    (customer) =>
      customer.id === (activeOrder?.customerId ?? selectedCustomerId)
  );

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Left Panel: Menu */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-2">
        <div className="mb-8 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-1">
            <Button
              className={cn(
                "h-10 rounded-xl px-8 font-bold",
                orderType === "dine_in"
                  ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                  : "text-muted-foreground/60 hover:text-white"
              )}
              onClick={() => setOrderType("dine_in")}
              variant="ghost"
            >
              Dine In
            </Button>
            <Button
              className={cn(
                "h-10 rounded-xl px-8 font-bold",
                orderType === "takeaway"
                  ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                  : "text-muted-foreground/60 hover:text-white"
              )}
              onClick={() => setOrderType("takeaway")}
              variant="ghost"
            >
              Takeaway
            </Button>
          </div>
        </div>

        <div className="no-scrollbar mb-8 flex shrink-0 gap-3 overflow-x-auto pb-2">
          {tables.map((table) => {
            const isActive = table.id === tableId;
            const isAvailable = table.status === "available";
            let tableChipClass =
              "border-white/10 bg-white/5 text-muted-foreground/50";

            if (isAvailable) {
              tableChipClass =
                "border-white/10 bg-white/5 text-white/80 hover:bg-white/10";
            }

            if (isActive) {
              tableChipClass = "border-primary/30 bg-primary/15 text-primary";
            }

            return (
              <Button
                className={cn(
                  "h-11 whitespace-nowrap rounded-2xl border px-5 font-bold transition-all",
                  tableChipClass
                )}
                key={table.id}
                onClick={() =>
                  navigate({ to: "/order", search: { tableId: table.id } })
                }
                variant="secondary"
              >
                {table.name}
              </Button>
            );
          })}
        </div>

        <div className="relative mb-8 shrink-0">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            className="h-12 rounded-2xl border-none bg-white/5 pl-12 text-sm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/40"
            placeholder="Search menu items..."
          />
        </div>

        {/* Categories */}
        <div className="no-scrollbar mb-8 flex shrink-0 gap-3 overflow-x-auto pb-2">
          {categoriesList.map((catName) => (
            <Button
              className={cn(
                "h-12 whitespace-nowrap rounded-2xl border border-white/5 px-6 font-bold transition-all",
                activeCategory === catName
                  ? "border-primary/20 bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground/70 hover:bg-white/10 hover:text-white"
              )}
              key={catName}
              onClick={() => setActiveCategory(catName)}
              variant="secondary"
            >
              <span className="mr-2 opacity-80">
                {catName === "All"
                  ? "🍽️"
                  : menu.find((category) => category.name === catName)?.emoji ||
                    "🍔"}
              </span>{" "}
              {catName}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">
          <div className="grid grid-cols-2 gap-6 pb-10 lg:grid-cols-3 xl:grid-cols-4">
            {menu
              .filter(
                (category) =>
                  activeCategory === "All" || category.name === activeCategory
              )
              .flatMap((category) =>
                category.items.map((item) => ({
                  ...item,
                  categoryName: category.name,
                  emoji: category.emoji,
                }))
              )
              .map((item) => (
                <Card
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white/5 transition-all duration-300 hover:bg-white/8",
                    !activeOrder &&
                      "border border-transparent hover:border-primary/50"
                  )}
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                >
                  <CardContent className="p-6">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl transition-transform duration-300 group-hover:scale-110">
                      {item.emoji || "🍔"}
                    </div>

                    <div className="mb-6 space-y-1">
                      <h3 className="truncate font-bold text-lg text-white transition-colors group-hover:text-primary">
                        {item.name}
                      </h3>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground/50 italic leading-relaxed">
                        {item.description ||
                          "Freshly prepared classic with our signature ingredients."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-black text-primary text-xl tabular-nums">
                        {item.price.toLocaleString()}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel: Cart */}
      <Card className="my-2 flex w-96 shrink-0 flex-col overflow-hidden rounded-[2.5rem] border-none bg-white/5 shadow-2xl">
        <div className="shrink-0 border-white/5 border-b p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-black text-white text-xl italic tracking-tight">
              Current Ticket
            </h2>
            {activeOrder && (
              <Badge className="rounded-lg border-none bg-primary/20 px-3 py-1 font-black text-primary">
                #{activeOrder.id.slice(4, 10).toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              className={cn(
                "h-12 flex-1 justify-start rounded-xl border bg-white/5 font-bold text-xs transition-all hover:bg-white/10",
                tableId
                  ? "border-white/5 text-muted-foreground/70"
                  : "border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(255,107,0,0.1)]"
              )}
              onClick={() => navigate({ to: "/tables" })}
              variant="secondary"
            >
              <Users className="mr-2 h-4 w-4" />{" "}
              {tableId ? `Table: ${tableId}` : "Assign Table to Start"}
            </Button>
            <Button
              className="h-12 w-12 rounded-xl border border-white/5 bg-white/5 px-0 text-primary hover:bg-white/10"
              onClick={() => navigate({ to: "/tables" })}
              variant="secondary"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3">
            <Select
              disabled={Boolean(activeOrder?.id)}
              onValueChange={(value) =>
                setSelectedCustomerId(
                  value === "__walkin__" ? undefined : value
                )
              }
              value={
                activeOrder?.customerId ?? selectedCustomerId ?? "__walkin__"
              }
            >
              <SelectTrigger className="h-12 rounded-xl border border-white/5 bg-white/5 font-bold text-muted-foreground/70 text-xs">
                <SelectValue placeholder="Assign Customer (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__walkin__">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} • {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-8">
          <CurrentOrderBody
            activeOrder={activeOrder}
            customerLabel={selectedCustomer ? selectedCustomer.name : "Walk-in"}
            isCreateOrderPending={createOrderMutation.isPending}
            isRemoving={removeOrderItemMutation.isPending}
            isUpdating={updateOrderItemQuantityMutation.isPending}
            onCreateCurrentOrder={handleCreateCurrentOrder}
            onDecrease={(item) => handleChangeItemQuantity(item, -1)}
            onIncrease={(item) => handleChangeItemQuantity(item, 1)}
            onPickTable={() => navigate({ to: "/tables" })}
            tableId={tableId}
          />
        </ScrollArea>

        {activeOrder && (
          <div className="shrink-0 rounded-t-[2.5rem] border-white/5 border-t bg-white/5 p-8">
            <div className="mb-8 space-y-3">
              <div className="flex justify-between font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-white">
                  ${currentTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
                <span>Service (10%)</span>
                <span className="text-white">
                  ${taxAmount.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 flex justify-between border-white/5 border-t pt-4 font-black text-2xl text-white italic">
                <span>Grand Total</span>
                <span className="text-primary">
                  ${grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 font-black text-[10px] text-white uppercase tracking-widest shadow-lg hover:bg-white/10"
                disabled={
                  sendToKitchenMutation.isPending ||
                  !activeOrder.items?.some((item) => item.status === "pending")
                }
                onClick={() => sendToKitchenMutation.mutate(activeOrder.id)}
                variant="secondary"
              >
                <Send className="mr-2 h-4 w-4 text-primary" /> Send KOT
              </Button>
              <Button
                className="h-14 w-full rounded-2xl bg-primary font-black text-[10px] text-white uppercase tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary/90"
                disabled={
                  payOrderMutation.isPending ||
                  activeOrder.items?.some(
                    (item) => item.status === "pending"
                  ) ||
                  !activeOrder.items?.length
                }
                onClick={() =>
                  payOrderMutation.mutate({
                    orderId: activeOrder.id,
                    tableId: tableId ?? "",
                    amount: grandTotal,
                  })
                }
              >
                <CreditCard className="mr-2 h-4 w-4" /> Checkout
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

interface CurrentOrderBodyProps {
  activeOrder: ActiveOrder | null | undefined;
  customerLabel: string;
  isCreateOrderPending: boolean;
  isRemoving: boolean;
  isUpdating: boolean;
  onCreateCurrentOrder: () => void;
  onDecrease: (item: OrderItem) => void;
  onIncrease: (item: OrderItem) => void;
  onPickTable: () => void;
  tableId?: string;
}

function CurrentOrderBody({
  activeOrder,
  customerLabel,
  isCreateOrderPending,
  isRemoving,
  isUpdating,
  onCreateCurrentOrder,
  onDecrease,
  onIncrease,
  onPickTable,
  tableId,
}: CurrentOrderBodyProps) {
  if (!activeOrder) {
    if (!tableId) {
      return (
        <div className="my-20 flex h-full flex-col items-center justify-center space-y-6">
          <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
            <LayoutGrid className="h-10 w-10" />
          </div>
          <div className="space-y-2 text-center">
            <p className="font-black text-white italic tracking-tight">
              No Table Selected
            </p>
            <p className="px-4 font-black text-[10px] text-muted-foreground/40 uppercase leading-relaxed tracking-widest">
              Please assign a table from the floor plan to start a new order
              ticket.
            </p>
          </div>
          <Button
            className="mt-4 h-11 rounded-xl bg-primary px-8 font-black text-[10px] text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90"
            onClick={onPickTable}
          >
            Pick a Table
          </Button>
        </div>
      );
    }

    return (
      <div className="my-20 flex h-full flex-col items-center justify-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
          <UtensilsCrossed className="h-10 w-10" />
        </div>
        <div className="space-y-2 text-center">
          <p className="font-black text-white italic tracking-tight">
            Start Current Order
          </p>
          <p className="px-4 font-black text-[10px] text-muted-foreground/40 uppercase leading-relaxed tracking-widest">
            Create the order first, then add items from the menu.
          </p>
          <p className="font-bold text-[11px] text-muted-foreground/60">
            Customer: {customerLabel}
          </p>
        </div>
        <Button
          className="mt-4 h-11 rounded-xl bg-primary px-8 font-black text-[10px] text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90"
          disabled={isCreateOrderPending}
          onClick={onCreateCurrentOrder}
        >
          {isCreateOrderPending ? "Creating..." : "Create Current Order"}
        </Button>
      </div>
    );
  }

  if (!activeOrder.items?.length) {
    return (
      <div className="my-20 flex h-full flex-col items-center justify-center space-y-4 opacity-20">
        <UtensilsCrossed className="h-12 w-12" />
        <p className="text-center font-bold">Empty Ticket</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {activeOrder.items.map((item) => (
        <div
          className="group flex items-center gap-4 transition-all"
          key={item.id}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
            🍱
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-bold text-sm text-white">
              {item.name}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-black text-primary text-sm">
                ${item.price.toLocaleString()}
              </span>
              <span className="font-black text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                • {item.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-1 px-1.5">
            <Button
              className="h-6 w-6 text-muted-foreground/40 hover:text-white"
              disabled={isUpdating || isRemoving}
              onClick={() => onDecrease(item)}
              size="icon"
              variant="ghost"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-4 text-center font-black text-white text-xs">
              {item.quantity}
            </span>
            <Button
              className="h-6 w-6 text-primary"
              disabled={isUpdating}
              onClick={() => onIncrease(item)}
              size="icon"
              variant="ghost"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
