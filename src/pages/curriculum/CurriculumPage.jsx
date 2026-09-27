import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import CurriculumManager from "../../components/curriculum/CurriculumManager";
import AssignScheduleForm from "../../components/curriculum/AssignScheduleForm";
import { BookOpen, CalendarDays } from "lucide-react";

const TABS = [
  { key: "assign",   label: "Assign Schedule",    icon: CalendarDays },
  { key: "manage",   label: "Manage Curriculum",  icon: BookOpen     },
];

const CurriculumPage = () => {
  const [activeTab, setActiveTab] = useState("assign");

  return (
    <>
      <TopBar
        title="Curriculum"
        subtitle="Manage and monitor classroom occupancy"
      />

      <div className="p-6 space-y-5">

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-pup-maroon text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "assign"  && <AssignScheduleForm />}
        {activeTab === "manage"  && <CurriculumManager  />}
      </div>
    </>
  );
};

export default CurriculumPage;