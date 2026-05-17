import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { userApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatPrice } from "../../utils/helpers";

const COLORS = [
  "#C6A77D",
  "#111111",
  "#6B7280",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
];

const STATUS_COLORS = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  processing: "#6366F1",
  shipped: "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

export default function AdminAnalytics() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => userApi.getDashboardStats().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner size="lg" className="py-20" />;

  const stats = statsData?.stats || {};
  const salesChart = statsData?.salesChart || [];
  const topProducts = statsData?.topProducts || [];
  const categoryData = statsData?.categoryData || [];
  const ordersByStatus = statsData?.ordersByStatus || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sales and performance overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Revenue",
            value: formatPrice(stats.totalRevenue || 0),
            sub: "All time",
          },
          {
            label: "This Month",
            value: formatPrice(stats.monthRevenue || 0),
            sub: `${stats.monthOrders || 0} orders`,
          },
          {
            label: "Avg. Order Value",
            value: stats.totalOrders
              ? formatPrice(stats.totalRevenue / stats.totalOrders)
              : "৳0",
            sub: "Per order",
          },
          {
            label: "Total Customers",
            value: stats.totalCustomers || 0,
            sub: "Registered",
          },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Revenue area chart */}
        <div className="card rounded-xl p-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
            Revenue — Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={salesChart}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C6A77D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C6A77D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                className="dark:stroke-gray-700"
              />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `৳${v}`} />
              <Tooltip formatter={(v) => formatPrice(v)} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C6A77D"
                strokeWidth={2}
                fill="url(#rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status pie */}
        <div className="card rounded-xl p-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
            Orders by Status
          </h2>
          {ordersByStatus.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) =>
                    `${status} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {ordersByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || "#333"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} orders`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No order data yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top products bar chart */}
        <div className="card rounded-xl p-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
            Top Products (by Revenue)
          </h2>
          {topProducts.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f0f0f0"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `৳${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={110}
                />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Bar dataKey="revenue" fill="#C6A77D" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
              No product data yet
            </div>
          )}
        </div>

        {/* Sales by category donut */}
        <div className="card rounded-xl p-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
            Sales by Category
          </h2>
          {categoryData.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="revenue"
                    nameKey="name"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatPrice(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm flex-1">
                {categoryData.map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold">
                      {formatPrice(c.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No category data yet
            </div>
          )}
        </div>
      </div>

      {/* Daily orders bar */}
      <div className="card rounded-xl p-5 mt-6">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
          Daily Orders — Last 7 Days
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={salesChart}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              className="dark:stroke-gray-700"
            />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="orders"
              fill="#111111"
              className="dark:fill-gray-400"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
