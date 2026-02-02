import { TrendingUp, Clock, Users, CheckCircle2 } from "lucide-react";

const stats = [
  {
    icon: TrendingUp,
    value: "2,547",
    label: "Total Reports",
    change: "+12% this month",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: CheckCircle2,
    value: "2,198",
    label: "Issues Resolved",
    change: "86% resolution rate",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Clock,
    value: "48 hrs",
    label: "Avg. Response Time",
    change: "Improved by 35%",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Users,
    value: "15,000+",
    label: "Active Citizens",
    change: "Growing community",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

const StatsSection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Making a Difference
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time statistics from our road repair initiative
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group rounded-2xl bg-card p-6 shadow-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-foreground mb-2">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
