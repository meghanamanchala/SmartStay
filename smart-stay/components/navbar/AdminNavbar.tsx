'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Building2, Calendar, Bell, BarChart2, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: <Home className="w-5 h-5 mr-3" /> },
  { name: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5 mr-3" /> },
  { name: 'Properties', href: '/admin/properties', icon: <Building2 className="w-5 h-5 mr-3" /> },
  { name: 'Bookings', href: '/admin/bookings', icon: <Calendar className="w-5 h-5 mr-3" /> },
  { name: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-5 h-5 mr-3" /> },
  { name: 'Analytics', href: '/admin/analytics', icon: <BarChart2 className="w-5 h-5 mr-3" /> },
];

const AdminNavbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-50 flex flex-col w-64 h-screen bg-gradient-to-b from-teal-500 to-teal-400 text-white shadow-lg">
      <div className="p-6 font-bold text-2xl flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🏡</span>
        <span>SmartStay</span>
      </div>
      <ul className="flex-1 mt-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center px-6 py-3 my-1 rounded-lg transition font-medium text-white/90 hover:bg-teal-600 hover:text-white ${
                pathname === item.href ? 'bg-teal-700/90 text-white font-semibold shadow' : ''
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-6 border-t border-white/20 mt-2">
        <Link href="/auth/login" className="flex items-center text-white/80 hover:text-white transition font-medium">
          <LogOut className="w-5 h-5 mr-2" /> Sign out
        </Link>
      </div>
    </nav>
  );
};

export default AdminNavbar;
