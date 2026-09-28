import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import StatusBadge from "../../components/common/StatusBadge";
import FacultyModal from "../../components/faculty/FacultyModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { facultyService } from "../../api/services/facultyService";
import { Eye, Pencil, Trash2 } from "lucide-react";

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
  const [actionError, setActionError] = useState(null);

  const fetchFaculty = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await facultyService.getAll();
      const data = response?.data ?? response;
      setFaculty(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load faculty members.");
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
    setActionError(null);
    try {
      await facultyService.delete(deleteTarget.id);
      setFaculty((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setConfirmOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "Failed to delete faculty member.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    setActionError(null);
    const response = modalMode === "add"
      ? await facultyService.create(formData)
      : await facultyService.update(selectedFaculty.id, formData);
    const savedFaculty = response?.data ?? response;
    setFaculty((prev) => modalMode === "add"
      ? [...prev, savedFaculty]
      : prev.map((member) => member.id === selectedFaculty.id ? savedFaculty : member)
    );
    setModalOpen(false);
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
        {actionError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">
              Faculty Management
            </h2>
            <p className="text-sm text-gray-500">{faculty.length} faculty member{faculty.length === 1 ? "" : "s"}</p>
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