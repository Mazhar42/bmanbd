import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = "accent",
}) {
  const isPositive = change >= 0;
  const colorMap = {
    accent: "bg-accent/10 text-accent",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="card rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-2">
          {title}
        </p>
        <p className="text-2xl font-bold text-brand dark:text-white">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp size={13} className="text-green-500" />
            ) : (
              <TrendingDown size={13} className="text-red-400" />
            )}
            <span
              className={`text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
            >
              {isPositive ? "+" : ""}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-gray-400">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
