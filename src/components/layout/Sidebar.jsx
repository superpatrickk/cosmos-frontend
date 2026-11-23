import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../common/ConfirmDialog";
import pupLogo from "../../../Polytechnic_University_of_the_Philippines_Bataan_Logo.png";
import {
  LayoutDashboard, Users, GraduationCap, BookMarked, BookOpen,
  DoorOpen, CalendarDays, CalendarCheck, Printer,
  LogOut, Menu, X
} from "lucide-react";

const navItems = [
  { label: "Dashboard",           path: "/dashboard",        icon: LayoutDashboard },
  { label: "Curriculum",          path: "/curriculum",       icon: BookMarked },
  { label: "Faculty Members",     path: "/faculty",          icon: Users },
  { label: "Rooms",               path: "/rooms",            icon: DoorOpen },
  { label: "Scheduling", path: "/schedules",        icon: CalendarDays },
  { label: "Faculty Schedule",    path: "/faculty-schedule", icon: CalendarCheck },
  { label: "Offerings",  path: "/printable",        icon: Printer },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutConfirmOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
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
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        {collapsed ? (
          <div className="flex w-full items-center justify-center">
            <img
              src={pupLogo}
              alt="PUP Bataan logo"
              className="h-8 w-8 rounded-full object-cover bg-white/10 p-1"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={pupLogo}
              alt="PUP Bataan logo"
              className="h-11 w-11 rounded-full object-cover bg-white/10 p-1.5"
            />
            <div>
              <p className="text-sm font-bold leading-tight tracking-wide">COSMOS</p>
              <p className="text-xs text-white/50">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-md p-1.5 transition-colors hover:bg-white/10"
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
          onClick={() => setLogoutConfirmOpen(true)}
          title={collapsed ? "Logout" : ""}
          aria-label="Logout"
          className={`flex items-center w-full rounded-lg text-sm transition-colors ${
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
          } text-white/80 hover:bg-red-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
        >
          <LogOut size={collapsed ? 20 : 18} strokeWidth={2} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Log out of COSMOS?"
        message="You will need to sign in again to access the system."
        confirmLabel="Logout"
        confirmStyle="danger"
        loading={loggingOut}
        loadingLabel="Logging out..."
        requireAuthentication={false}
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;