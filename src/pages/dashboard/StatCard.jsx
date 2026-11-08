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
      <div className="rounded-2xl border border-white/40 bg-white/65 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px] animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-100/80 rounded-xl" />
          <div className="w-16 h-4 bg-gray-100/80 rounded-full" />
        </div>
        <div className="w-12 h-7 bg-gray-100/80 rounded mb-2" />
        <div className="w-24 h-4 bg-gray-100/80 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100/70 bg-white/70 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px]">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/40 bg-white/65 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px] transition-shadow hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)]">
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