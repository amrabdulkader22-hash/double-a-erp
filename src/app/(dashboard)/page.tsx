import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Coins, GitBranch, Users } from "lucide-react";

const stats = [
  { title: "Companies", value: "0", icon: Building2, color: "text-blue-500" },
  { title: "Currencies", value: "0", icon: Coins, color: "text-green-500" },
  { title: "Branches", value: "0", icon: GitBranch, color: "text-purple-500" },
  { title: "Users", value: "0", icon: Users, color: "text-orange-500" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Double A ERP System Administration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
