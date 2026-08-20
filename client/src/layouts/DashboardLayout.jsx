import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import Navbar from '../components/Dashboard/Navbar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen h-[100dvh] bg-[#08090B] text-[#F5F5F5] overflow-hidden font-sans selection:bg-[#F5B83D]/30 selection:text-[#F5F5F5]">
      {/* Background ambient glowing shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#F5B83D]/[0.03] rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFD166]/[0.02] rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Sidebar Panel */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Top Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
