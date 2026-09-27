import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import StatusBadge from "../../components/common/StatusBadge";
import FacultyModal from "../../components/faculty/FacultyModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { facultyService } from "../../api/services/facultyService";
import { Eye, Pencil, Trash2, Filter } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_FACULTY = [
  {
    id: "F001",
    name: "Dr. Maria Santos",
    department: "Computer Science",
    email: "maria.santos@pup.edu.ph",
    phone: "0912-345-6789",
    specialization: "Data Science",
    status: "Active",
  },
  {
    id: "F002",
    name: "Prof. Juan Reyes",
    department: "Engineering",
    email: "juan.reyes@pup.edu.ph",
    phone: "0923-456-7890",
    specialization: "Mechanical Engineering",
    status: "Active",
  },
  {
    id: "F003",
    name: "Dr. Ana Cruz",
    department: "Mathematics",
    email: "ana.cruz@pup.edu.ph",
    phone: "0934-567-8901",
    specialization: "Statistics",
    status: "Active",
  },
  {
    id: "F004",
    name: "Prof. Carlos Garcia",
    department: "Business",
    email: "carlos.garcia@pup.edu.ph",
    phone: "0945-678-9012",
    specialization: "Marketing",
    status: "On Leave",
  },
];
// ──────────────────────────────────────────────────────────────────────────────

const FacultyPage = () => {
  const [faculty, setFaculty]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState("add"); // "add" | "edit" | "view"
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: uncomment when backend is ready
      // const res = await facultyService.getAll();
      // setFaculty(res.data);

      // MOCK
      await new Promise((r) => setTimeout(r, 700));
      setFaculty(MOCK_FACULTY);
    } catch (err) {
      setError("Failed to load faculty members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleAdd = () => {
    setSelectedFaculty(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleView = (member) => {
    setSelectedFaculty(member);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (member) => {
    setSelectedFaculty(member);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDeleteClick = (member) => {
    setDeleteTarget(member);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      // TODO: uncomment when backend is ready
      // await facultyService.delete(deleteTarget.id);

      // MOCK
      await new Promise((r) => setTimeout(r, 500));
      setFaculty((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setConfirmOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete faculty member.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (modalMode === "add") {
        // TODO: await facultyService.create(formData);
        const newMember = {
          ...formData,
          id: `F00${faculty.length + 1}`,
        };
        setFaculty((prev) => [...prev, newMember]);
      } else if (modalMode === "edit") {
        // TODO: await facultyService.update(selectedFaculty.id, formData);
        setFaculty((prev) =>
          prev.map((f) =>
            f.id === selectedFaculty.id ? { ...f, ...formData } : f
          )
        );
      }
      setModalOpen(false);
    } catch (err) {
      alert("Failed to save faculty member.");
    }
  };

  const filtered = faculty.filter((f) =>
    [f.name, f.department, f.email, f.specialization]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const getInitials = (name) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <TopBar
        title="Faculty Members"
        subtitle="Manage and monitor classroom occupancy"
        onAddNew={handleAdd}
        addNewLabel="Add Faculty"
        search={search}
        onSearch={setSearch}
      />

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">
              Faculty Management
            </h2>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-semibold">Faculty ID</th>
                  <th className="text-left px-6 py-3 font-semibold">Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Department</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Phone</th>
                  <th className="text-left px-6 py-3 font-semibold">Specialization</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 animate-pulse">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-red-400">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">
                      No faculty members found.
                    </td>
                  </tr>
                )}

                {!loading && !error && filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {member.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pup-maroon/10 text-pup-maroon flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <span className="font-medium text-gray-800">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{member.department}</td>
                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
                    <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{member.specialization}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(member)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="p-1.5 text-gray-400 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(member)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit / View Modal */}
      <FacultyModal
        open={modalOpen}
        mode={modalMode}
        data={selectedFaculty}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Faculty Member"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default FacultyPage;