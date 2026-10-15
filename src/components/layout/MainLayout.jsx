import Sidebar from "./Sidebar";
import cosmosPanelArt from "../../assets/95557ce7-472e-4bef-b73e-b5036a41e6ae.png";

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main
          className="flex-1 overflow-y-auto bg-gray-100"
          style={{
            backgroundImage: `linear-gradient(rgba(243, 244, 246, 0.9), rgba(243, 244, 246, 0.9)), url(${cosmosPanelArt})`,
            backgroundPosition: "center, center",
            backgroundRepeat: "no-repeat, no-repeat",
            backgroundSize: "cover, min(900px, 72vw) auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;