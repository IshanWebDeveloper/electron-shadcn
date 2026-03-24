import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChefHat,
  FileText,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plus,
  PlusCircle,
  Search,
  Settings,
  ShoppingCart,
  Users,
  Utensils,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import DragWindowRegion from "@/components/drag-window-region";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MenuAction = "addProduct" | "addCategory" | "addTable";

interface MenuItem {
  action?: MenuAction;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  showDot?: boolean;
}

interface MenuSection {
  items: MenuItem[];
  title: string;
}

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const menuSections: MenuSection[] = [
    {
      title: "MAIN",
      items: [
        {
          label: "New Order",
          href: "/order",
          icon: ShoppingCart,
          action: undefined,
        },
        {
          label: "Tables",
          href: "/tables",
          icon: LayoutGrid,
          action: undefined,
        },
        {
          label: "Kitchen (KOT)",
          href: "/kitchen",
          icon: ChefHat,
          showDot: true,
          action: undefined,
        },
      ],
    },
    {
      title: "CRM",
      items: [
        {
          label: "Customers",
          href: "/customers",
          icon: Users,
          action: undefined,
        },
        {
          label: "Campaigns",
          href: "/campaigns",
          icon: MessageSquare,
          action: undefined,
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Menu & Set Menus",
          href: "/manage",
          icon: FileText,
          action: undefined,
        },
        {
          label: "Add Product",
          href: "/manage",
          icon: Utensils,
          action: "addProduct",
        },
        {
          label: "Add Category",
          href: "/manage",
          icon: PlusCircle,
          action: "addCategory",
        },
        {
          label: "Add Table",
          href: "/tables",
          icon: Plus,
          action: "addTable",
        },
      ],
    },
  ];

  const getHeaderInfo = (path: string) => {
    const routes: Record<string, { title: string; desc: string }> = {
      "/": {
        title: "Dashboard",
        desc: "Overview of your restaurant performance",
      },
      "/order": {
        title: "New Order",
        desc: "Create and manage customer orders",
      },
      "/kitchen": {
        title: "Kitchen Display",
        desc: "Live KOT management for the kitchen",
      },
      "/manage": {
        title: "Menu Management",
        desc: "Products, categories & set menus",
      },
      "/tables": {
        title: "Table Management",
        desc: "Floor plan and table status",
      },
      "/customers": {
        title: "Customers",
        desc: "Manage customer relationships",
      },
      "/campaigns": {
        title: "SMS Campaigns",
        desc: "Reach out to your customers",
      },
    };
    return routes[path] || routes["/manage"];
  };

  const { title, desc } = getHeaderInfo(currentPath);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isItemActive = (item: MenuItem): boolean => {
    return item.href === "/"
      ? currentPath === "/"
      : currentPath.startsWith(item.href);
  };

  const itemClassName = (isActive: boolean): string => {
    return cn(
      "group relative flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-300",
      isActive
        ? "border border-primary/20 bg-primary/10 text-primary"
        : "text-muted-foreground/70 hover:bg-white/5 hover:text-white"
    );
  };

  const renderItemIndicator = (isActive: boolean, showDot?: boolean) => {
    if (isActive) {
      return (
        <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,107,0,0.8)]" />
      );
    }

    if (showDot) {
      return <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />;
    }

    return null;
  };

  const navigateMenuAction = (item: MenuItem) => {
    if (!item.action) {
      return;
    }

    if (item.href === "/manage") {
      navigate({
        to: "/manage",
        search: { action: item.action },
      });
      return;
    }

    navigate({
      to: "/tables",
      search: { action: item.action },
    });
  };

  const renderActionItem = (item: MenuItem, isActive: boolean) => {
    const Icon = item.icon;

    return (
      <button
        className={itemClassName(isActive)}
        key={item.label}
        onClick={() => navigateMenuAction(item)}
        type="button"
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            isActive ? "scale-110" : "group-hover:scale-110"
          )}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {renderItemIndicator(isActive, item.showDot)}
      </button>
    );
  };

  const renderLinkItem = (item: MenuItem, isActive: boolean) => {
    const Icon = item.icon;

    return (
      <Link className={itemClassName(isActive)} key={item.label} to={item.href}>
        <Icon
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            isActive ? "scale-110" : "group-hover:scale-110"
          )}
        />
        <span className="flex-1">{item.label}</span>
        {renderItemIndicator(isActive, item.showDot)}
      </Link>
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = isItemActive(item);
    return item.action
      ? renderActionItem(item, isActive)
      : renderLinkItem(item, isActive);
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <div className="absolute inset-x-0 top-0 z-50 h-8">
        <DragWindowRegion />
      </div>

      <aside className="z-10 flex w-64 shrink-0 flex-col border-border/10 border-r bg-sidebar py-6 pt-10">
        <div className="mb-10 flex shrink-0 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
            <span className="font-black text-lg text-primary-foreground">
              R
            </span>
          </div>
          <Button
            className="-ml-2 bg-linear-to-r from-white to-white/60 bg-clip-text font-bold text-transparent text-xl tracking-tight"
            onClick={() =>
              navigate({
                to: "/",
              })
            }
            variant={"ghost"}
          >
            Resto<span className="text-primary">POS</span>
          </Button>
        </div>

        <nav className="no-scrollbar flex w-full flex-1 flex-col gap-8 overflow-y-auto px-4 pb-10">
          {menuSections.map((section) => (
            <div className="flex flex-col gap-2" key={section.title}>
              <h3 className="mb-2 px-4 font-black text-[10px] text-muted-foreground/50 tracking-[0.2em]">
                {section.title}
              </h3>
              <div className="flex flex-col gap-1">
                {section.items.map(renderMenuItem)}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-border/10 border-t px-4 pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 font-bold text-primary text-sm">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-sm text-white">
                Admin User
              </p>
              <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                Manager
              </p>
            </div>
            <Button
              className="rounded-lg text-muted-foreground hover:text-white"
              size="icon"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="z-10 flex h-screen min-h-0 flex-1 flex-col overflow-hidden pt-8">
        <header className="flex h-20 shrink-0 items-center justify-between bg-background/50 px-8 backdrop-blur-xl">
          <div className="flex flex-col">
            <h1 className="font-bold text-white text-xl tracking-tight">
              {title}
            </h1>
            <p className="mt-0.5 font-medium text-muted-foreground text-xs">
              {desc}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                className="h-11 rounded-xl border-none bg-white/5 pl-11 text-sm transition-all placeholder:text-muted-foreground/40 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-primary/50"
                placeholder="Global search..."
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2">
              <span className="font-bold text-foreground/80 text-sm tabular-nums">
                {formatTime(time)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="relative h-11 w-11 rounded-xl border border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                size="icon"
                variant="ghost"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full border-2 border-[#121212] bg-primary" />
              </Button>
              <Button
                className="h-11 w-11 rounded-xl border border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                size="icon"
                variant="ghost"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-8 py-2">
          {children}
        </main>
      </div>
    </div>
  );
}
