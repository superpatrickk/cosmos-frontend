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

// ─── Mock Data (replace with real API response later) ─────────────────────────
const MOCK_STATS = {
  totalRooms: 48,
  availableRooms: 32,
  occupiedRooms: 14,
  underMaintenance: 2,
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const MOCK_SCHEDULE = {
  Monday: [
    { id: 1, code: "CS101",   students: 35, startTime: "8:00 AM",  endTime: "10:00 AM", room: "RM002" },
    { id: 2, code: "MATH101", students: 40, startTime: "10:00 AM", endTime: "12:00 PM", room: "RM003" },
    { id: 3, code: "EE201",   students: 28, startTime: "1:00 PM",  endTime: "3:00 PM",  room: "RM005" },
    { id: 4, code: "BA105",   students: 45, startTime: "3:00 PM",  endTime: "5:00 PM",  room: "RM001" },
  ],
  Tuesday: [
    { id: 5, code: "CS201",   students: 30, startTime: "8:00 AM",  endTime: "10:00 AM", room: "RM004" },
    { id: 6, code: "EE201",   students: 28, startTime: "11:00 AM", endTime: "1:00 PM",  room: "RM002" },
  ],
  Wednesday: [
    { id: 7, code: "BA105",   students: 45, startTime: "9:00 AM",  endTime: "11:00 AM", room: "RM001" },
    { id: 8, code: "MATH101", students: 40, startTime: "1:00 PM",  endTime: "3:00 PM",  room: "RM003" },
    { id: 9, code: "CS101",   students: 35, startTime: "3:00 PM",  endTime: "5:00 PM",  room: "RM005" },
  ],
  Thursday: [
    { id: 10, code: "CS201",  students: 30, startTime: "8:00 AM",  endTime: "10:00 AM", room: "RM002" },
  ],
  Friday: [
    { id: 11, code: "EE201",  students: 28, startTime: "10:00 AM", endTime: "12:00 PM", room: "RM004" },
    { id: 12, code: "BA105",  students: 45, startTime: "2:00 PM",  endTime: "4:00 PM",  room: "RM001" },
  ],
};
// ──────────────────────────────────────────────────────────────────────────────

const getTodayName = () => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  return DAYS.includes(today) ? today : "Monday";
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
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        // TODO: uncomment when backend is ready
        // const res = await dashboardService.getStats();
        // setStats(res.data);

        // MOCK — remove when backend is ready
        await new Promise((r) => setTimeout(r, 800));
        setStats(MOCK_STATS);
      } catch (err) {
        setStatsError("Failed to load statistics.");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch Schedule by Day
  useEffect(() => {
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        // TODO: uncomment when backend is ready
        // const res = await dashboardService.getScheduleByDay(activeDay);
        // setSchedule(res.data);

        // MOCK — remove when backend is ready
        await new Promise((r) => setTimeout(r, 600));
        setSchedule(MOCK_SCHEDULE[activeDay] ?? []);
      } catch (err) {
        setScheduleError("Failed to load schedule.");
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedule();
  }, [activeDay]);

  const statCards = [
    {
      label: "Total Rooms",
      value: stats?.totalRooms ?? 0,
      icon: Building2,
      iconBg: "bg-red-50",
      iconColor: "text-pup-maroon",
      badge: "+12%",
      badgeColor: "text-green-500",
    },
    {
      label: "Available Rooms",
      value: stats?.availableRooms ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      badge: "Available",
      badgeColor: "text-green-500",
    },
    {
      label: "Occupied Rooms",
      value: stats?.occupiedRooms ?? 0,
      icon: Users2,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      badge: "Occupied",
      badgeColor: "text-red-500",
    },
    {
      label: "Under Maintenance",
      value: stats?.underMaintenance ?? 0,
      icon: Settings2,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-500",
      badge: "Maintenance",
      badgeColor: "text-yellow-500",
    },
  ];

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Manage and monitor classroom occupancy"
        onAddNew={() => {}}
      />

      <div className="p-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              {...card}
              loading={statsLoading}
              error={statsError}
            />
          ))}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Section Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-base font-bold text-gray-800">
              Today's Schedule
            </h2>
            <button className="text-sm text-pup-maroon font-medium hover:underline">
              View All
            </button>
          </div>

          {/* Day Navigator Tabs */}
          <div className="flex gap-1 px-6 pb-3 border-b border-gray-100">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-colors
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