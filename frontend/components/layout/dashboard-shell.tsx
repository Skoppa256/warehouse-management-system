import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0b0c0f] text-white">
      <Sidebar />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col bg-[#0b0c0f]">
        <Topbar />

        <main
          className="
            flex-1 
            px-8 py-6
            overflow-y-auto
            scrollbar-none
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
