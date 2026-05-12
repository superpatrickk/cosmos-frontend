import { Search, Plus } from "lucide-react";

const TopBar = ({
  title,
  subtitle,
  onAddNew,
  addNewLabel = "Add New",
  search = "",
  onSearch,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon w-52 transition"
          />
        </div>

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-pup-maroon text-white text-sm font-medium rounded-lg hover:bg-pup-maroon-dark active:scale-95 transition-all"
          >
            <Plus size={16} />
            {addNewLabel}
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;