import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, BookOpen, Eye } from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog";
import CurriculumModal from "./CurriculumModal";
import CurriculumViewModal from "./CurriculumViewModal";
import { normalizeSchedulingCurriculum } from "../../data/curriculumStore";
import { curriculumService } from "../../api/services/curriculumService";

const CurriculumManager = () => {
  const [curricula, setCurricula]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadError, setLoadError]     = useState(null);
  const [search, setSearch]           = useState("");
  const [filterProgram, setFilterProgram] = useState("All");
  const [programOptions, setProgramOptions] = useState([]);
  const [showFilter, setShowFilter]   = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [viewOpen, setViewOpen]       = useState(false);
  const [modalMode, setModalMode]     = useState("add");
  const [selected, setSelected]       = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() =>
    curricula.filter((c) => {
      const matchSearch = [c.program, c.yearLevel, c.academicYear, c.status]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchProgram = filterProgram === "All" || c.program === filterProgram;
      return matchSearch && matchProgram;
    }), [curricula, search, filterProgram]
  );

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await curriculumService.delete(deleteTarget.id);
      await loadFromServer();
      setConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete curriculum:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadFromServer = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await curriculumService.getAll();
      const data = res?.data ?? res;
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeSchedulingCurriculum);
        setCurricula(normalized);
        setProgramOptions(Array.from(new Set(normalized.map((item) => item.program).filter(Boolean))));
      } else {
        setCurricula([]);
        setProgramOptions([]);
      }
    } catch (err) {
      console.error("Failed to fetch curricula from server:", err);
      setLoadError(err?.message || "Failed to load curricula");
      setCurricula([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFromServer(); }, []);

  const handleModalSubmit = async (formData) => {
    // Sync to backend then refresh local list
    if (modalMode === "bulk") {
      for (const item of formData) {
        await curriculumService.create(item);
      }
    } else if (modalMode === "add") {
      await curriculumService.create(formData);
    } else {
      await curriculumService.update(selected.id, formData);
    }

    await loadFromServer();
    setModalOpen(false);
  };

  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-[2px]">
      <div className="flex items-center justify-between border-b border-white/40 bg-white/60 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Curriculum Management</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {filtered.length} curriculum{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadError && (
            <div className="mr-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {loadError}
            </div>
          )}

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
          />

          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                filterProgram !== "All"
                  ? "border-pup-maroon bg-red-50 text-pup-maroon"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Program
              {filterProgram !== "All" && (
                <span className="h-1.5 w-1.5 rounded-full bg-pup-maroon" />
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {["All", ...programOptions].map((p) => (
                  <button
                    key={p}
                    onClick={() => { setFilterProgram(p); setShowFilter(false); }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      filterProgram === p
                        ? "bg-pup-maroon text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p === "All" ? "All Programs" : p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { setSelected(null); setModalMode("add"); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-pup-maroon px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-pup-maroon-dark"
          >
            <Plus size={14} />
            Add Curriculum
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Program</th>
              <th className="px-6 py-3 text-left">Year Level</th>
              <th className="px-6 py-3 text-left">Academic Year</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(3)].map((_, i) => (
              <tr key={i} className="border-b border-gray-50 animate-pulse">
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <BookOpen size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No curricula found.</p>
                </td>
              </tr>
            )}

            {!loading && filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                <td className="px-6 py-4 text-xs font-medium text-gray-400">{c.id}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-pup-maroon/10 px-2 py-1 text-xs font-semibold text-pup-maroon">
                    {c.program}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{c.yearLevel}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{c.academicYear}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    c.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => { setSelected(c); setViewOpen(true); }}
                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => { setSelected(c); setModalMode("edit"); setModalOpen(true); }}
                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-pup-maroon"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(c); setConfirmOpen(true); }}
                      className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100"
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

      {/* Modals */}
      <CurriculumModal
        open={modalOpen}
        mode={modalMode}
        data={selected}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <CurriculumViewModal
        open={viewOpen}
        data={selected}
        onClose={() => setViewOpen(false)}
        onEdit={(c) => {
          setViewOpen(false);
          setSelected(c);
          setModalMode("edit");
          setModalOpen(true);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Curriculum"
        message={`Are you sure you want to delete the ${deleteTarget?.program} ${deleteTarget?.yearLevel} curriculum? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default CurriculumManager;
