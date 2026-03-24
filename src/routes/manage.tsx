import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { PlusCircle, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ipc } from "@/ipc/manager";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage")({
  component: ManagePage,
});

interface ManageSearch {
  action?: "addProduct" | "addCategory" | "addSetMenu";
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

interface SetMenu {
  availability: string;
  description: string | null;
  id: string;
  name: string;
  price: number;
}

interface CreateMenuItemInput {
  categoryId: string;
  description?: string;
  name: string;
  price: number;
}

interface CreateCategoryInput {
  emoji: string;
  name: string;
}

interface CreateSetMenuInput {
  availability?: string;
  description?: string;
  items?: string[];
  name: string;
  price: number;
}

function ManagePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearch({ from: "/manage" }) as ManageSearch;
  const [activeTab, setActiveTab] = useState("products");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSetMenuModalOpen, setIsSetMenuModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.action === "addProduct") {
      setIsProductModalOpen(true);
    }
    if (searchParams.action === "addCategory") {
      setIsCategoryModalOpen(true);
    }
    if (searchParams.action === "addSetMenu") {
      setIsSetMenuModalOpen(true);
    }
  }, [searchParams.action]);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    categoryId: "",
    description: "",
  });
  const [newCategory, setNewCategory] = useState({ name: "", emoji: "🍔" });
  const [newSetMenu, setNewSetMenu] = useState({
    name: "",
    price: "",
    description: "",
    availability: "All Day",
  });

  const { data: menu = [], isLoading: isLoadingMenu } = useQuery<
    MenuCategory[]
  >({
    queryKey: ["menu"],
    queryFn: () => ipc.client.pos.getMenu(),
  });

  const { data: setMenus = [], isLoading: isLoadingSets } = useQuery<SetMenu[]>(
    {
      queryKey: ["setMenus"],
      queryFn: () => ipc.client.pos.getSetMenus(),
    }
  );

  const createProductMutation = useMutation({
    mutationFn: (data: CreateMenuItemInput) =>
      ipc.client.pos.createMenuItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      setIsProductModalOpen(false);
      setNewProduct({ name: "", price: "", categoryId: "", description: "" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      ipc.client.pos.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      setIsCategoryModalOpen(false);
      setNewCategory({ name: "", emoji: "🍔" });
    },
  });

  const createSetMenuMutation = useMutation({
    mutationFn: (data: CreateSetMenuInput) =>
      ipc.client.pos.createSetMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setMenus"] });
      setIsSetMenuModalOpen(false);
      setNewSetMenu({
        name: "",
        price: "",
        description: "",
        availability: "All Day",
      });
    },
  });

  const products = menu.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryName: category.name,
      emoji: category.emoji,
    }))
  );
  const isLoading = isLoadingMenu || isLoadingSets;

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-6 p-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      <Tabs
        className="flex flex-1 flex-col overflow-hidden"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <div className="mb-8 flex shrink-0 items-center justify-between">
          <TabsList className="h-auto gap-8 bg-transparent p-0">
            <TabsTrigger
              className="rounded-none border-transparent border-b-2 bg-transparent px-0 pb-2 font-bold text-muted-foreground/60 transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              value="products"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              className="rounded-none border-transparent border-b-2 bg-transparent px-0 pb-2 font-bold text-muted-foreground/60 transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              value="setmenus"
            >
              Set Menus
            </TabsTrigger>
            <TabsTrigger
              className="rounded-none border-transparent border-b-2 bg-transparent px-0 pb-2 font-bold text-muted-foreground/60 transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              value="categories"
            >
              Categories
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Button
              className="h-11 rounded-xl border border-white/5 bg-white/5 px-6 font-bold text-white hover:bg-white/10"
              onClick={() => setIsCategoryModalOpen(true)}
              variant="secondary"
            >
              + Category
            </Button>
            <Button
              className="h-11 rounded-xl border border-white/5 bg-white/5 px-6 font-bold text-white hover:bg-white/10"
              onClick={() => setIsProductModalOpen(true)}
              variant="secondary"
            >
              + Product
            </Button>
            <Button
              className="h-11 rounded-xl bg-primary px-6 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              onClick={() => setIsSetMenuModalOpen(true)}
            >
              + Set Menu
            </Button>
          </div>
        </div>

        <TabsContent
          className="no-scrollbar mt-0 min-h-0 flex-1 overflow-y-auto pb-10 focus-visible:outline-none"
          value="products"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((item, i) => {
              const hasDiscount = i % 3 === 1; // Demo purpose
              let discount = 0;
              if (hasDiscount) {
                discount = i % 2 === 0 ? 10 : 15;
              }
              const oldPrice = hasDiscount
                ? item.price * (1 + discount / 100)
                : null;

              return (
                <Card
                  className="group overflow-hidden rounded-[2rem] border-none bg-white/5 transition-all duration-300 hover:bg-white/8"
                  key={item.id}
                >
                  <CardContent className="relative p-6">
                    {hasDiscount && (
                      <Badge className="absolute top-4 right-4 rounded-md border-none bg-primary px-2 py-0.5 font-black text-[10px] text-white">
                        -{discount}%
                      </Badge>
                    )}

                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl transition-transform duration-300 group-hover:scale-110">
                      {item.emoji || "🍔"}
                    </div>

                    <div className="mb-6 space-y-1">
                      <h3 className="font-bold text-lg text-white transition-colors group-hover:text-primary">
                        {item.name}
                      </h3>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground/60 italic leading-relaxed">
                        <span className="mr-2 font-bold text-[9px] text-primary/70 uppercase not-italic tracking-wider">
                          {item.categoryName}
                        </span>
                        {item.description ||
                          "Freshly prepared classic with our signature ingredients."}
                      </p>
                    </div>

                    <div className="mt-auto flex items-baseline gap-3">
                      <span className="font-black text-2xl text-primary tabular-nums">
                        {item.price.toLocaleString()}
                      </span>
                      {oldPrice && (
                        <span className="font-bold text-muted-foreground/30 text-sm tabular-nums line-through">
                          {oldPrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent
          className="no-scrollbar mt-0 min-h-0 flex-1 overflow-y-auto pb-10 focus-visible:outline-none"
          value="categories"
        >
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
            {menu.map((cat) => (
              <Card
                className="group rounded-3xl border-none bg-white/5 p-6 text-center transition-colors hover:bg-white/8"
                key={cat.id}
              >
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
                  {cat.emoji}
                </div>
                <h3 className="mb-1 font-bold text-sm text-white">
                  {cat.name}
                </h3>
                <p className="font-black text-[10px] text-primary uppercase tracking-widest">
                  {cat.items.length} Items
                </p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent
          className="no-scrollbar mt-0 min-h-0 flex-1 overflow-y-auto pb-10 focus-visible:outline-none"
          value="setmenus"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {setMenus.length === 0 ? (
              <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-white/5 border-dashed text-muted-foreground opacity-30">
                <Utensils className="mb-4 h-12 w-12" />
                <p className="font-bold">No set menus configured</p>
              </div>
            ) : (
              setMenus.map((set) => (
                <Card
                  className="group flex h-40 overflow-hidden rounded-3xl border-none bg-white/5 transition-all hover:bg-white/8"
                  key={set.id}
                >
                  <div className="flex w-40 items-center justify-center bg-white/5 text-5xl">
                    🍱
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-bold text-lg text-white">
                        {set.name}
                      </h3>
                      <Badge className="bg-primary font-black text-white">
                        {set.price.toFixed(0)}
                      </Badge>
                    </div>
                    <p className="mb-4 line-clamp-2 text-muted-foreground text-xs">
                      {set.description}
                    </p>
                    <div className="mt-auto flex gap-2">
                      <Badge
                        className="border-white/10 font-bold text-[9px] text-muted-foreground uppercase"
                        variant="outline"
                      >
                        {set.availability}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <Dialog onOpenChange={setIsProductModalOpen} open={isProductModalOpen}>
        <DialogContent className="rounded-3xl border-white/5 bg-[#121212] shadow-2xl sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-white text-xl">
              <PlusCircle className="h-5 w-5 text-primary" /> New Product
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="prod-name">Product Name</Label>
              <Input
                className="h-11 rounded-xl border-none bg-white/5 font-medium placeholder:text-muted-foreground/30"
                id="prod-name"
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Classic Burger"
                value={newProduct.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 font-bold text-sm text-white/60">
                <Label htmlFor="prod-price">Price</Label>
                <Input
                  className="h-11 rounded-xl border-none bg-white/5 font-medium placeholder:text-muted-foreground/30"
                  id="prod-price"
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="990"
                  type="number"
                  value={newProduct.price}
                />
              </div>
              <div className="grid gap-2 font-bold text-sm text-white/60">
                <Label htmlFor="prod-cat">Category</Label>
                <Select
                  onValueChange={(val) =>
                    setNewProduct((p) => ({ ...p, categoryId: val }))
                  }
                  value={newProduct.categoryId}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl border-none bg-white/5 font-medium italic"
                    id="prod-cat"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="border-white/5 bg-[#1a1a1a]">
                    {menu.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              disabled={
                createProductMutation.isPending ||
                !newProduct.name ||
                !newProduct.categoryId ||
                !newProduct.price
              }
              onClick={() =>
                createProductMutation.mutate({
                  ...newProduct,
                  price: Number.parseFloat(newProduct.price),
                })
              }
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog onOpenChange={setIsCategoryModalOpen} open={isCategoryModalOpen}>
        <DialogContent className="rounded-3xl border-white/5 bg-[#121212] shadow-2xl sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-white text-xl">
              <PlusCircle className="h-5 w-5 text-primary" /> New Category
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                className="h-11 rounded-xl border-none bg-white/5 font-medium"
                id="cat-name"
                onChange={(e) =>
                  setNewCategory((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="Main Course"
                value={newCategory.name}
              />
            </div>
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="cat-emoji">Icon (Emoji)</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "🍔",
                  "🍕",
                  "🥗",
                  "🍰",
                  "☕",
                  "🍹",
                  "🍜",
                  "🍛",
                  "🥩",
                  "🍗",
                  "🍟",
                  "🍩",
                ].map((e) => (
                  <Button
                    className={cn(
                      "h-12 w-12 rounded-xl p-0 text-2xl transition-all",
                      newCategory.emoji === e
                        ? "bg-primary text-white"
                        : "bg-white/5 hover:bg-white/10"
                    )}
                    key={e}
                    onClick={() => setNewCategory((c) => ({ ...c, emoji: e }))}
                    variant={newCategory.emoji === e ? "default" : "secondary"}
                  >
                    {e}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              disabled={createCategoryMutation.isPending || !newCategory.name}
              onClick={() => createCategoryMutation.mutate(newCategory)}
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsSetMenuModalOpen} open={isSetMenuModalOpen}>
        <DialogContent className="rounded-3xl border-white/5 bg-[#121212] shadow-2xl sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-white text-xl">
              <PlusCircle className="h-5 w-5 text-primary" /> New Set Menu
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="set-name">Set Name</Label>
              <Input
                className="h-11 rounded-xl border-none bg-white/5 font-medium"
                id="set-name"
                onChange={(e) =>
                  setNewSetMenu((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                placeholder="Lunch Combo"
                value={newSetMenu.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 font-bold text-sm text-white/60">
                <Label htmlFor="set-price">Price</Label>
                <Input
                  className="h-11 rounded-xl border-none bg-white/5 font-medium"
                  id="set-price"
                  onChange={(e) =>
                    setNewSetMenu((current) => ({
                      ...current,
                      price: e.target.value,
                    }))
                  }
                  placeholder="1990"
                  type="number"
                  value={newSetMenu.price}
                />
              </div>
              <div className="grid gap-2 font-bold text-sm text-white/60">
                <Label htmlFor="set-availability">Availability</Label>
                <Select
                  onValueChange={(value) =>
                    setNewSetMenu((current) => ({
                      ...current,
                      availability: value,
                    }))
                  }
                  value={newSetMenu.availability}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl border-none bg-white/5 font-medium italic"
                    id="set-availability"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="border-white/5 bg-[#1a1a1a]">
                    <SelectItem value="All Day">All Day</SelectItem>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 font-bold text-sm text-white/60">
              <Label htmlFor="set-description">Description</Label>
              <Input
                className="h-11 rounded-xl border-none bg-white/5 font-medium"
                id="set-description"
                onChange={(e) =>
                  setNewSetMenu((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
                placeholder="Main, side and drink included"
                value={newSetMenu.description}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              disabled={
                createSetMenuMutation.isPending ||
                !newSetMenu.name ||
                !newSetMenu.price
              }
              onClick={() =>
                createSetMenuMutation.mutate({
                  name: newSetMenu.name,
                  description: newSetMenu.description || undefined,
                  price: Number.parseFloat(newSetMenu.price),
                  availability: newSetMenu.availability,
                  items: [],
                })
              }
            >
              Add Set Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
