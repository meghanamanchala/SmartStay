"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Home, Calendar, DollarSign, BarChart2, Settings, LogOut, Building2 } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: <Home className="w-5 h-5 mr-3" /> },
  { name: "Users", href: "/admin/users", icon: <Users className="w-5 h-5 mr-3" /> },
  { name: "Properties", href: "/admin/properties", icon: <Building2 className="w-5 h-5 mr-3" /> },
  { name: "Bookings", href: "/admin/bookings", icon: <Calendar className="w-5 h-5 mr-3" /> },
  { name: "Revenue", href: "/admin/revenue", icon: <DollarSign className="w-5 h-5 mr-3" /> },
  { name: "Analytics", href: "/admin/analytics", icon: <BarChart2 className="w-5 h-5 mr-3" /> },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-50 flex flex-col w-64 h-screen bg-gradient-to-b from-teal-700 to-teal-500 text-white shadow-lg">
      <div className="p-6 font-bold text-2xl flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🛎️</span>
        <span>SmartStay Admin</span>
      </div>
      <ul className="flex-1 mt-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center px-6 py-3 my-1 rounded-lg transition font-medium text-white/90 hover:bg-teal-600 hover:text-white ${pathname === item.href ? 'bg-teal-800 text-white font-semibold shadow' : ''}`}
              style={{ fontSize: '1rem' }}
            >
              {item.icon}
              <span className="ml-1">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-6 border-t border-white/20 mt-2">
        <Link href="/admin/settings" className="flex items-center mb-3 text-white/80 hover:text-white transition font-medium" style={{ fontSize: '1rem' }}>
          <Settings className="w-5 h-5 mr-2" /> Settings
        </Link>
        <Link href="/auth/login" className="flex items-center text-white/80 hover:text-white transition font-medium" style={{ fontSize: '1rem' }}>
          <LogOut className="w-5 h-5 mr-2" /> Sign out
        </Link>
      </div>
    </nav>
  );
}
