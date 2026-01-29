'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, PlusCircle, Calendar, DollarSign, Star, User, Settings, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/host/dashboard', icon: <Home className="w-5 h-5 mr-3" /> },
  { name: 'My Properties', href: '/host/properties', icon: <List className="w-5 h-5 mr-3" /> },
  { name: 'Add Property', href: '/host/add-property', icon: <PlusCircle className="w-5 h-5 mr-3" /> },
  { name: 'Bookings', href: '/host/bookings', icon: <Calendar className="w-5 h-5 mr-3" /> },
  { name: 'Earnings', href: '/host/earnings', icon: <DollarSign className="w-5 h-5 mr-3" /> },
  { name: 'Reviews', href: '/host/reviews', icon: <Star className="w-5 h-5 mr-3" /> },
  { name: 'Profile', href: '/host/profile', icon: <User className="w-5 h-5 mr-3" /> },
];

export default function HostNavbar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col w-64 h-screen bg-gradient-to-b from-teal-500 to-teal-400 text-white shadow-lg">
      <div className="p-6 font-bold text-2xl flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🏠</span>
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
        <Link href="/settings" className="flex items-center mb-3 text-white/80 hover:text-white transition">
          <Settings className="w-5 h-5 mr-2" /> Settings
        </Link>
        <Link href="/auth/login" className="flex items-center text-white/80 hover:text-white transition">
          <LogOut className="w-5 h-5 mr-2" /> Sign out
        </Link>
      </div>
    </nav>
  );
}