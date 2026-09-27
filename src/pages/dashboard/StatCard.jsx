const StatCard = ({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  badge,
  badgeColor,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
          <div className="w-16 h-4 bg-gray-100 rounded-full" />
        </div>
        <div className="w-12 h-7 bg-gray-100 rounded mb-2" />
        <div className="w-24 h-4 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <span className={`text-xs font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </div>
  );
};

export default StatCard;