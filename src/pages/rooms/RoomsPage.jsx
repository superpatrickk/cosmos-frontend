import { useEffect, useState, useMemo } from "react";
import TopBar from "../../components/layout/TopBar";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RoomModal from "../../components/rooms/RoomModal";
import RoomViewModal from "../../components/rooms/RoomViewModal";
import { roomService } from "../../api/services/roomService";
import {
  DoorOpen, Users, Building2, Wrench,
  Filter, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, Download,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ROOMS = [
  {
    id: "RM001", name: "Conference Room A",
    building: "Main Building", floor: "2nd Floor",
    capacity: 50, status: "Available", type: "Conference",
    description: "Fully air-conditioned conference room with projector and whiteboard.",
    amenities: ["Projector", "Whiteboard", "AC", "WiFi"],
  },
  {
    id: "RM002", name: "Lecture Hall 1",
    building: "Academic Building", floor: "1st Floor",
    capacity: 100, status: "Occupied", type: "Lecture",
    description: "Large lecture hall with stadium seating and dual projectors.",
    amenities: ["Projector", "AC", "WiFi", "Sound System"],
  },
  {
    id: "RM003", name: "Lab Room 101",
    building: "Science Building", floor: "1st Floor",
    capacity: 30, status: "Available", type: "Laboratory",
    description: "Computer laboratory with 30 workstations and high-speed internet.",
    amenities: ["Computers", "AC", "WiFi", "Printer"],
  },
  {
    id: "RM004", name: "Tutorial Room B",
    building: "Main Building", floor: "3rd Floor",
    capacity: 25, status: "Maintenance", type: "Tutorial",
    description: "Small tutorial room undergoing electrical maintenance.",
    amenities: ["Whiteboard", "AC"],
  },
  {
    id: "RM005", name: "Auditorium",
    building: "Main Building", floor: "Ground Floor",
    capacity: 200, status: "Occupied", type: "Auditorium",
    description: "Main auditorium for university-wide events and presentations.",
    amenities: ["Stage", "Sound System", "Projector", "AC", "WiFi"],
  },
  {
    id: "RM006", name: "Seminar Room 1",
    building: "Academic Building", floor: "2nd Floor",
    capacity: 40, status: "Available", type: "Lecture",
    description: "Mid-sized seminar room ideal for group discussions.",
    amenities: ["Projector", "Whiteboard", "AC", "WiFi"],
  },
  {
    id: "RM007", name: "Engineering Lab",
    building: "Engineering Building", floor: "1st Floor",
    capacity: 35, status: "Available", type: "Laboratory",
    description: "Equipped with electronic testing equipment and workbenches.",
    amenities: ["Equipment", "AC", "WiFi"],
  },
  {
    id: "RM008", name: "Business Hall",
    building: "Business Building", floor: "2nd Floor",
    capacity: 80, status: "Available", type: "Lecture",
    description: "Spacious hall for business and management classes.",
    amenities: ["Projector", "AC", "WiFi", "Whiteboard"],
  },
];

const ROOM_TYPES   = ["All Types", "Lecture", "Laboratory", "Conference", "Tutorial", "Auditorium"];
const BUILDINGS    = ["All Buildings", "Main Building", "Academic Building", "Science Building", "Engineering Building", "Business Building"];
const STATUS_LIST  = ["All Status", "Available", "Occupied", "Maintenance"];
const ITEMS_PER_PAGE = 5;
// ──────────────────────────────────────────────────────────────────────────────

const RoomsPage = () => {
  const [rooms, setRooms]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All Types");
  const [filterBuilding, setFilterBuilding] = useState("All Buildings");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [showFilter, setShowFilter]     = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [modalMode, setModalMode]       = useState("add");
  const [selected, setSelected]         = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: const res = await roomService.getAll(); setRooms(res.data);
      await new Promise((r) => setTimeout(r, 700));
      setRooms(MOCK_ROOMS);
    } catch {
      setError("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch = [r.name, r.building, r.type, r.id]
        .join(" ").toLowerCase()
        .includes(search.toLowerCase());
      const matchType     = filterType === "All Types"         || r.type === filterType;
      const matchBuilding = filterBuilding === "All Buildings" || r.building === filterBuilding;
      const matchStatus   = filterStatus === "All Status"      || r.status === filterStatus;
      return matchSearch && matchType && matchBuilding && matchStatus;
    });
  }, [rooms, search, filterType, filterBuilding, filterStatus]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterType, filterBuilding, filterStatus]);

  // Summary stats
  const available   = rooms.filter((r) => r.status === "Available").length;
  const occupied    = rooms.filter((r) => r.status === "Occupied").length;
  const maintenance = rooms.filter((r) => r.status === "Maintenance").length;
  const totalCap    = rooms.reduce((s, r) => s + r.capacity, 0);

  const hasActiveFilter =
    filterType !== "All Types" ||
    filterBuilding !== "All Buildings" ||
    filterStatus !== "All Status";

  const clearFilters = () => {
    setFilterType("All Types");
    setFilterBuilding("All Buildings");
    setFilterStatus("All Status");
    setShowFilter(false);
  };

  // Handlers
  const handleAdd = () => {
    setSelected(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (room) => {
    setSelected(room);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (room) => {
    setSelected(room);
    setViewOpen(true);
  };

  const handleDeleteClick = (room) => {
    setDeleteTarget(room);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      // TODO: await roomService.delete(deleteTarget.id);
      await new Promise((r) => setTimeout(r, 500));
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setConfirmOpen(false);
    } catch {
      alert("Failed to delete room.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    if (modalMode === "add") {
      // TODO: await roomService.create(formData);
      setRooms((prev) => [
        ...prev,
        { ...formData, id: `RM00${rooms.length + 1}` },
      ]);
    } else {
      // TODO: await roomService.update(selected.id, formData);
      setRooms((prev) =>
        prev.map((r) => r.id === selected.id ? { ...r, ...formData } : r)
      );
    }
    setModalOpen(false);
  };

  const handleExport = async () => {
    try {
      // TODO: const blob = await roomService.export(); download it
      alert("Export feature will be connected to backend.");
    } catch {
      alert("Export failed.");
    }
  };

  const STATUS_ICON = {
    Available:   { color: "text-green-500",  bg: "bg-green-50"  },
    Occupied:    { color: "text-red-500",    bg: "bg-red-50"    },
    Maintenance: { color: "text-yellow-500", bg: "bg-yellow-50" },
  };

  return (
    <>
      <TopBar
        title="Rooms"
        subtitle="Manage and monitor classroom occupancy"
        onAddNew={handleAdd}
        addNewLabel="Add Room"
        search={search}
        onSearch={setSearch}
      />

      <div className="p-6 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Rooms",       value: rooms.length, icon: DoorOpen,   color: "text-pup-maroon", bg: "bg-red-50"    },
            { label: "Available",         value: available,    icon: Building2,  color: "text-green-600",  bg: "bg-green-50"  },
            { label: "Occupied",          value: occupied,     icon: Users,      color: "text-red-500",    bg: "bg-red-50"    },
            { label: "Under Maintenance", value: maintenance,  icon: Wrench,     color: "text-yellow-600", bg: "bg-yellow-50" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <s.icon size={22} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">Room Management</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} room{filtered.length !== 1 ? "s" : ""} found
                {` • Total capacity: ${totalCap.toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                Export
              </button>

              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilter((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    hasActiveFilter
                      ? "border-pup-maroon text-pup-maroon bg-red-50"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter size={14} />
                  Filter
                  {hasActiveFilter && (
                    <span className="w-2 h-2 bg-pup-maroon rounded-full" />
                  )}
                </button>

                {/* Filter Dropdown */}
                {showFilter && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-4 space-y-4">

                    {/* Filter by Status */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Status
                      </p>
                      <div className="space-y-1">
                        {STATUS_LIST.map((s) => (
                          <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              filterStatus === s
                                ? "bg-pup-maroon text-white"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter by Type */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Room Type
                      </p>
                      <div className="space-y-1">
                        {ROOM_TYPES.map((t) => (
                          <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              filterType === t
                                ? "bg-pup-maroon text-white"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter by Building */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Building
                      </p>
                      <div className="space-y-1">
                        {BUILDINGS.map((b) => (
                          <button
                            key={b}
                            onClick={() => setFilterBuilding(b)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              filterBuilding === b
                                ? "bg-pup-maroon text-white"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {hasActiveFilter && (
                      <button
                        onClick={clearFilters}
                        className="w-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-center"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-semibold">Room ID</th>
                  <th className="text-left px-6 py-3 font-semibold">Room Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Building</th>
                  <th className="text-left px-6 py-3 font-semibold">Floor</th>
                  <th className="text-left px-6 py-3 font-semibold">Capacity</th>
                  <th className="text-left px-6 py-3 font-semibold">Type</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))}

                {!loading && error && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-red-400">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <DoorOpen size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No rooms found.</p>
                      {hasActiveFilter && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-xs text-pup-maroon hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {room.id}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">{room.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {room.amenities?.join(", ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{room.building}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{room.floor}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">
                          {room.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                        {room.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(room)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(room)}
                          className="p-1.5 text-gray-400 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(room)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} rooms
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                      currentPage === i + 1
                        ? "bg-pup-maroon text-white border-pup-maroon"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RoomModal
        open={modalOpen}
        mode={modalMode}
        data={selected}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <RoomViewModal
        open={viewOpen}
        data={selected}
        onClose={() => setViewOpen(false)}
        onEdit={(room) => {
          setViewOpen(false);
          setSelected(room);
          setModalMode("edit");
          setModalOpen(true);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Room"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Active schedules assigned to this room will be affected.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default RoomsPage;