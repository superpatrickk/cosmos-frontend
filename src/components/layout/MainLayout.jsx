
import Sidebar from "./Sidebar";
import cosmosPanelArt from "../../assets/cosmos-logo-final.png";

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Background artwork */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${cosmosPanelArt})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "min(900px, 72vw) auto",
            opacity: 1.55,
          }}
        />

        {/* Main content */}
        <main className="relative z-10 flex-1 overflow-y-auto bg-gray-100/70">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
