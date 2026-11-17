const formatTimeLabel = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const minutesAfterMidnight = index * 30;
  const hour = Math.floor(minutesAfterMidnight / 60);
  const minute = minutesAfterMidnight % 60;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { value, label: formatTimeLabel(value) };
});

export const isHalfHourTime = (time) => {
  if (!/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(String(time ?? ""))) return false;
  return true;
};

const TimeField = ({ label, name, value = "", error, onChange }) => {
  const hasLegacyValue = value && !isHalfHourTime(value);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      >
        <option value="">Select time</option>
        {hasLegacyValue && (
          <option value={value} disabled>
            Existing time ({value})
          </option>
        )}
        {["AM", "PM"].map((period) => (
          <optgroup key={period} label={period}>
            {TIME_OPTIONS
              .filter((option) => option.label.endsWith(period))
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-[11px] text-gray-400">Choose a time in 30-minute increments.</p>
    </div>
  );
};

export default TimeField;
