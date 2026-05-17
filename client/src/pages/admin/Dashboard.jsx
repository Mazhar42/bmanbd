import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "../../components/admin/StatsCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { userApi, orderApi, inventoryApi } from "../../services/api";
import { formatPrice } from "../../utils/helpers";

const STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => userApi.getDashboardStats().then((r) => r.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["recentOrders"],
    queryFn: () => orderApi.getAll({ limit: 5 }).then((r) => r.data.orders),
  });

  const { data: alertsData } = useQuery({
    queryKey: ["stockAlerts"],
    queryFn: () => inventoryApi.getAlerts().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner size="lg" className="py-20" />;

  const stats = statsData?.stats || {};
  const salesChart = statsData?.salesChart || [];

  const monthGrowth =
    stats.lastMonthOrders > 0
      ? Math.round(
          ((stats.monthOrders - stats.lastMonthOrders) /
            stats.lastMonthOrders) *
            100,
        )
      : 100;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue || 0)}
          change={15}
          changeLabel="vs last month"
          icon={DollarSign}
          color="accent"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          change={monthGrowth}
          changeLabel="this month"
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Customers"
          value={stats.totalCustomers || 0}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders || 0}
          icon={Clock}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 card rounded-xl p-5">
          <h2 className="text-sm font-semibold tracking-widest uppercase mb-5 text-gray-700 dark:text-gray-300">
            Revenue — Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={salesChart}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C6A77D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C6A77D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                className="dark:stroke-gray-700"
              />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
              <Tooltip formatter={(v) => formatPrice(v)} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C6A77D"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Alerts */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-700 dark:text-gray-300">
              Low Stock Alerts
            </h2>
            {alertsData?.count > 0 && (
              <span className="ml-auto bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {alertsData.count}
              </span>
            )}
          </div>
          {!alertsData?.alerts?.length ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
              All stock levels are healthy
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {alertsData.alerts.slice(0, 8).map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-2 border-b dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="font-medium line-clamp-1">{alert.product}</p>
                    <p className="text-gray-400">
                      {alert.size} / {alert.color}
                    </p>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      alert.isOutOfStock
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {alert.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card rounded-xl p-5 mt-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-700 dark:text-gray-300">
            Recent Orders
          </h2>
          <a
            href="/admin/orders"
            className="text-xs text-accent hover:underline"
          >
            View All
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                {["Order #", "Customer", "Total", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold tracking-widest uppercase text-gray-400 pb-3 pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {ordersData?.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 pr-4 font-mono font-medium">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                    {order.user?.name ||
                      order.shippingAddress?.fullName ||
                      "Guest"}
                  </td>
                  <td className="py-3 pr-4 font-semibold">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded capitalize ${STATUS_COLORS[order.orderStatus] || ""}`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
