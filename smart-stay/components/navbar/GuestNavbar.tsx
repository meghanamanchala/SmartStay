'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard/profile/guest' },
  { name: 'Explore', href: '/explore' },
  { name: 'Wishlists', href: '/wishlists' },
  { name: 'Bookings', href: '/bookings' },
  { name: 'Profile', href: '/dashboard/profile/guest' },
];

export default function GuestNavbar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col w-64 h-full bg-white border-r">
      <div className="p-6 font-bold text-xl">SmartStay</div>
      <ul className="flex-1">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-green-100 rounded-lg transition ${
                pathname === item.href ? 'bg-green-100 font-semibold text-green-600' : ''
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-6 border-t">
        <Link href="/settings" className="block mb-2 text-gray-600 hover:text-green-600">Settings</Link>
        <Link href="/signout" className="block text-gray-600 hover:text-green-600">Sign out</Link>
      </div>
    </nav>
  );
}