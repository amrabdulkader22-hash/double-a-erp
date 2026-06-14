"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase/client";
import i18n from "@/lib/i18n";
import {
  LayoutDashboard,
  Coins,
  Building2,
  GitBranch,
  CalendarDays,
  CalendarCheck,
  ListTree,
  Network,
  Settings,
  Menu,
  X,
  LogOut,
  Languages,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/currencies", labelKey: "nav.currencies", icon: Coins },
  { href: "/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/branches", labelKey: "nav.branches", icon: GitBranch },
  { href: "/fiscal-years", labelKey: "nav.fiscalYears", icon: CalendarDays },
  { href: "/exchange-rates", labelKey: "nav.exchangeRates", icon: Coins },
  { href: "/accounting-periods", labelKey: "nav.accountingPeriods", icon: CalendarDays },
  { href: "/period-status", labelKey: "nav.periodStatus", icon: CalendarCheck },
  { href: "/accounts", labelKey: "nav.accounts", icon: ListTree },
  { href: "/cost-centers", labelKey: "nav.costCenters", icon: Network },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-64 bg-card border-e border-border transition-transform duration-300 lg:static",
          sidebarOpen
            ? "translate-x-0"
            : "ltr:-translate-x-full rtl:translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Double A ERP</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {t("common.logout", "Logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-4 px-6 border-b border-border bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold flex-1">
            {t(
              navItems.find(
                (item) =>
                  pathname === item.href || pathname.startsWith(item.href + "/")
              )?.labelKey || "nav.dashboard"
            )}
          </h2>
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Languages className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
