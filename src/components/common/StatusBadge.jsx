const STATUS_STYLES = {
  Active:      "bg-green-100 text-green-700",
  Occupied:    "bg-red-100 text-red-600",
  Available:   "bg-green-100 text-green-700",
  Maintenance: "bg-yellow-100 text-yellow-700",
  "On Leave":  "bg-yellow-100 text-yellow-700",
  Inactive:    "bg-gray-100 text-gray-500",
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;