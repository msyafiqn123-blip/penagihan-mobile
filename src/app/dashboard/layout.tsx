'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, KeyRound, LogOut, Menu, X, Sun } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.error) router.push('/login');
        else setUser(data);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(user.role === 'KOLEKTOR' || user.role === 'PENAGIHAN' || user.role === 'PENAGIHAN_PERUSAHAAN' ? [{ name: 'Data Piutang 2026', path: '/dashboard/detail-nop', icon: FileText }] : []),
    ...(user.role === 'PENAGIHAN' ? [{ name: 'Capaian', path: '/dashboard/capaian', icon: LayoutDashboard }] : []),
    { name: 'Update Password', path: '/dashboard/update-password', icon: KeyRound },
  ];

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }) => (
    <>
      <div className="flex items-center justify-between p-6">
        <h1 className="text-xl font-bold tracking-tight mb-0 flex items-center" style={{marginBottom:0}}>
          <span className="text-blue-600">Monitoring DHKP</span> <span className="text-orange-500 ml-1">PBB</span>
        </h1>
        {isMobile ? (
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition md:hidden">
            <X size={20} />
          </button>
        ) : (
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition hidden md:block">
            <Sun size={18} />
          </button>
        )}
      </div>
      
      <div className="border-b border-slate-100 mb-4 mx-4"></div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-2.5 mx-3 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}>
              <Icon size={18} className={`mr-3 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mr-3 shadow-sm flex-shrink-0 uppercase">
            {user.username.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-800 truncate">{user.username}</p>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5 truncate">{user.role}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-full font-medium transition text-sm"
        >
          <LogOut size={16} className="mr-2" />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 flex-shrink-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent isMobile={true} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 flex-shrink-0 z-10">
          <h1 className="text-lg font-bold tracking-tight mb-0 flex items-center" style={{marginBottom: 0}}>
            <span className="text-blue-600">Monitoring DHKP</span> <span className="text-orange-500 ml-1">PBB</span>
          </h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
