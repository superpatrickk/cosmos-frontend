import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import StatusBadge from "../../components/common/StatusBadge";
import FacultyModal from "../../components/faculty/FacultyModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { facultyService } from "../../api/services/facultyService";
import { courseService } from "../../api/services/courseService";
import { Eye, Pencil, Trash2, Filter } from "lucide-react";

const normalizeFaculty = (member) => ({
  ...member,
  email: member.email || "",
  programs: member.programs?.length
    ? member.programs
    : (member.department || "").split(",").map((program) => program.trim()).filter(Boolean),
});

const FacultyPage = () => {
  const [faculty, setFaculty]           = useState([]);
  const [programs, setPrograms]         = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [filterProgram, setFilterProgram] = useState("All Programs");
  const [showFilter, setShowFilter] = useState(false);
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
        setFaculty(Array.isArray(data)
          ? data.map(normalizeFaculty).sort((a, b) => Number(b.id) - Number(a.id))
          : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load faculty members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPrograms = async () => {
      setProgramsLoading(true);
      setProgramsError(null);
      try {
        const response = await courseService.getAll();
        const data = response?.data ?? response;
        if (active) {
          setPrograms(Array.isArray(data)
            ? data.filter((course) => course.status?.toLowerCase() === "active")
            : []);
        }
      } catch (err) {
        if (active) setProgramsError(err?.response?.data?.message || err?.message || "Failed to load programs.");
      } finally {
        if (active) setProgramsLoading(false);
      }
    };
    fetchPrograms();
    return () => { active = false; };
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
    const savedFaculty = normalizeFaculty(response?.data ?? response);
    setFaculty((prev) => modalMode === "add"
      ? [savedFaculty, ...prev]
      : prev.map((member) => member.id === selectedFaculty.id ? savedFaculty : member)
    );
    setModalOpen(false);
  };

  const statusOptions = [...new Set(faculty.map((member) => member.status).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const filtered = faculty.filter((member) => {
    const query = search.toLowerCase();
    const matchesSearch = [member.name, member.programs.join(" "), member.email, member.specialization]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesStatus = filterStatus === "All Statuses" || member.status === filterStatus;
    const matchesProgram = filterProgram === "All Programs" || member.programs.includes(filterProgram);
    return matchesSearch && matchesStatus && matchesProgram;
  });

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
            <div className="relative">
              <button
                onClick={() => setShowFilter((visible) => !visible)}
                aria-expanded={showFilter}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  showFilter || filterStatus !== "All Statuses" || filterProgram !== "All Programs"
                    ? "border-pup-maroon bg-red-50 text-pup-maroon"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={14} />
                Filter
              </button>
              {showFilter && (
                <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                  <label htmlFor="faculty-status-filter" className="mb-1 block text-xs font-semibold uppercase text-gray-400">
                    Status
                  </label>
                  <select
                    id="faculty-status-filter"
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                    className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option>All Statuses</option>
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <label htmlFor="faculty-program-filter" className="mb-1 block text-xs font-semibold uppercase text-gray-400">
                    Program
                  </label>
                  <select
                    id="faculty-program-filter"
                    value={filterProgram}
                    onChange={(event) => setFilterProgram(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option>All Programs</option>
                    {programs.map((program) => <option key={program.id} value={program.code}>{program.code}</option>)}
                  </select>
                  {programsError && <p className="mt-1 text-xs text-red-500">{programsError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-semibold">Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Program</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Specialization</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-400">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                      No faculty members found.
                    </td>
                  </tr>
                )}

                {!loading && !error && filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
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
                    <td className="px-6 py-4 text-gray-600">{member.programs.join(", ") || "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
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
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm font-medium text-gray-700">
              Total faculty: {faculty.length}
            </p>
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {faculty.length}
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit / View Modal */}
      <FacultyModal
        open={modalOpen}
        mode={modalMode}
        data={selectedFaculty}
        programs={programs}
        programsLoading={programsLoading}
        programsError={programsError}
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