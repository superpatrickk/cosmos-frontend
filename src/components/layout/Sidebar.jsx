import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, GraduationCap, BookMarked,
  DoorOpen, CalendarDays, CalendarCheck, Printer,
  LogOut, Menu, X
} from "lucide-react";

const navItems = [
  { label: "Dashboard",           path: "/dashboard",        icon: LayoutDashboard },
  { label: "Faculty Members",     path: "/faculty",          icon: Users },
  { label: "Courses",             path: "/courses",          icon: GraduationCap },
  { label: "Subjects",            path: "/subjects",         icon: BookMarked },
  { label: "Rooms",               path: "/rooms",            icon: DoorOpen },
  { label: "Schedule Assignment", path: "/schedules",        icon: CalendarDays },
  { label: "Faculty Schedule",    path: "/faculty-schedule", icon: CalendarCheck },
  { label: "Printable Schedule",  path: "/printable",        icon: Printer },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`
        flex flex-col h-screen bg-pup-maroon text-white flex-shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight tracking-wide">COSMOS</p>
              <p className="text-xs text-white/50">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors ml-auto"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : ""}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              transition-colors duration-150
              ${isActive
                ? "bg-white text-pup-maroon font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0) ?? "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate leading-tight">
                {user?.name ?? "Admin User"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user?.email ?? "admin@pup.edu.ph"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;