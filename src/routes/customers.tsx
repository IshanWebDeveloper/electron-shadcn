import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Mail,
  MoreVertical,
  Phone,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
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
import { ipc } from "@/ipc/manager";

interface Customer {
  email: string | null;
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
}

interface CreateCustomerInput {
  email?: string;
  name: string;
  phone: string;
}

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => ipc.client.pos.getCustomers(),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: CreateCustomerInput) =>
      ipc.client.pos.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsModalOpen(false);
      setNewCustomer({ name: "", phone: "", email: "" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-8 pt-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
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
        <div className="relative w-96">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            className="h-12 rounded-2xl border-none bg-white/5 pl-12 text-sm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/40"
            placeholder="Search customers..."
          />
        </div>
        <Button
          className="h-12 rounded-2xl bg-primary px-6 font-black text-[10px] text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        {customers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-[2.5rem] border-2 border-white/5 border-dashed bg-white/5 p-12 text-muted-foreground/30">
            <User className="h-12 w-12 opacity-20" />
            <p className="text-center font-bold">No customers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customers.map((customer) => (
              <Card
                className="group relative overflow-hidden rounded-[2rem] border-none bg-white/5 transition-all duration-300 hover:bg-white/8"
                key={customer.id}
              >
                <CardContent className="p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 transition-transform duration-300 group-hover:scale-110">
                      <User className="h-7 w-7 text-primary/60" />
                    </div>
                    <Button
                      className="rounded-xl text-muted-foreground/30 hover:text-white"
                      size="icon"
                      variant="ghost"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-6">
                    <h3 className="truncate font-bold text-lg text-white transition-colors group-hover:text-primary">
                      {customer.name}
                    </h3>
                    <p className="mt-1 font-black text-[10px] text-muted-foreground/30 uppercase italic tracking-widest">
                      Premium Member
                    </p>
                  </div>

                  <div className="mb-6 space-y-3">
                    <div className="flex items-center font-medium text-muted-foreground/60 text-xs">
                      <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-lg bg-white/5">
                        <Phone className="h-3 w-3 text-primary/40" />
                      </div>
                      {customer.phone}
                    </div>
                    <div className="flex items-center font-medium text-muted-foreground/60 text-xs">
                      <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-lg bg-white/5">
                        <Mail className="h-3 w-3 text-primary/40" />
                      </div>
                      <span className="truncate">
                        {customer.email || "No email provided"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-white/5 border-t pt-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[10px] text-muted-foreground/20 uppercase tracking-widest">
                        Spent
                      </span>
                      <span className="font-black text-sm text-white italic">
                        ${(customer.totalSpent || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-[10px] text-muted-foreground/20 uppercase tracking-widest">
                        Visits
                      </span>
                      <span className="font-black text-primary text-sm italic">
                        {customer.totalOrders || 0}
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
        <DialogContent className="rounded-3xl border-white/5 bg-[#121212] shadow-2xl sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-white text-xl italic">
              <UserPlus className="h-5 w-5 text-primary" /> New Customer
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cust-name">Full Name</Label>
              <Input
                className="h-12 rounded-xl border-none bg-white/5 font-medium"
                id="cust-name"
                onChange={(e) =>
                  setNewCustomer((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="John Doe"
                value={newCustomer.name}
              />
            </div>
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cust-phone">Phone Number</Label>
              <Input
                className="h-12 rounded-xl border-none bg-white/5 font-medium"
                id="cust-phone"
                onChange={(e) =>
                  setNewCustomer((c) => ({ ...c, phone: e.target.value }))
                }
                placeholder="+1 234 567 890"
                value={newCustomer.phone}
              />
            </div>
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cust-email">Email Address</Label>
              <Input
                className="h-12 rounded-xl border-none bg-white/5 font-medium"
                id="cust-email"
                onChange={(e) =>
                  setNewCustomer((c) => ({ ...c, email: e.target.value }))
                }
                placeholder="john@example.com"
                value={newCustomer.email}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-[10px] text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90"
              disabled={
                createCustomerMutation.isPending ||
                !newCustomer.name ||
                !newCustomer.phone
              }
              onClick={() => createCustomerMutation.mutate(newCustomer)}
            >
              Add to CRM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
