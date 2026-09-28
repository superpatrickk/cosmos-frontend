import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import StatCard from "./StatCard";
import TodaySchedule from "./TodaySchedule";
import { dashboardService } from "../../api/services/dashboardService";
import {
  Building2,
  CheckCircle2,
  Users2,
  Settings2,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getTodayName = () => {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
};

const DashboardPage = () => {
  const [stats, setStats]           = useState(null);
  const [schedule, setSchedule]     = useState([]);
  const [activeDay, setActiveDay]   = useState(getTodayName());
  const [statsLoading, setStatsLoading]       = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [statsError, setStatsError]           = useState(null);
  const [scheduleError, setScheduleError]     = useState(null);

  // Fetch Stats
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const response = await dashboardService.getStats();
        const data = response?.data ?? response;
        if (mounted) setStats(data);
      } catch (err) {
        if (mounted) setStatsError(err?.response?.data?.message || err?.message || "Failed to load room statistics.");
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  // Fetch Schedule by Day
  useEffect(() => {
    let mounted = true;
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const response = await dashboardService.getScheduleByDay(activeDay);
        const data = response?.data ?? response;
        if (mounted) setSchedule(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setScheduleError(err?.response?.data?.message || err?.message || "Failed to load schedule.");
      } finally {
        if (mounted) setScheduleLoading(false);
      }
    };
    fetchSchedule();
    return () => { mounted = false; };
  }, [activeDay]);

  const totalRooms = Number(stats?.totalRooms || 0);
  const occupiedRooms = Number(stats?.occupiedRooms || 0);
  const availableRooms = Number(stats?.availableRooms || 0);
  const underMaintenance = Number(stats?.underMaintenance || 0);
  const getRate = (count) => totalRooms ? Math.round((count / totalRooms) * 100) : 0;

  const statCards = [
    {
      label: "Total Rooms",
      value: totalRooms,
      icon: Building2,
      iconBg: "bg-red-50",
      iconColor: "text-pup-maroon",
      badge: `${getRate(occupiedRooms)}% occupied`,
      badgeColor: "text-green-500",
    },
    {
      label: "Available Rooms",
      value: availableRooms,
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      badge: `${getRate(availableRooms)}% of total`,
      badgeColor: "text-green-500",
    },
    {
      label: "Occupied Rooms",
      value: occupiedRooms,
      icon: Users2,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      badge: `${getRate(occupiedRooms)}% of total`,
      badgeColor: "text-red-500",
    },
    {
      label: "Under Maintenance",
      value: underMaintenance,
      icon: Settings2,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-500",
      badge: `${getRate(underMaintenance)}% of total`,
      badgeColor: "text-yellow-500",
    },
  ];

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={new Intl.DateTimeFormat("en", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date())}
      />

      <div className="p-6 space-y-6">

        {/* Stat Cards */}
        {statsError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statsError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              {...card}
              loading={statsLoading}
              value={statsError ? "—" : card.value}
            />
          ))}
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Section Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-800">Weekly Schedule</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeDay}{scheduleLoading ? " · Loading classes" : ` · ${schedule.length} class${schedule.length === 1 ? "" : "es"}`}
              </p>
            </div>
          </div>

          {/* Day Navigator Tabs */}
          <div className="flex gap-1 px-6 pb-3 border-b border-gray-100">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${activeDay === day
                    ? "bg-pup-maroon text-white"
                    : "text-gray-500 hover:bg-gray-100"
                  }
                `}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Schedule List */}
          <TodaySchedule
            schedule={schedule}
            loading={scheduleLoading}
            error={scheduleError}
            activeDay={activeDay}
          />

        </div>
      </div>
    </>
  );
};

export default DashboardPage;