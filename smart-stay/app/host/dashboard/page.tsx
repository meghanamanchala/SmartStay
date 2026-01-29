import HostNavbar from '@/components/navbar/HostNavbar';
import { Calendar, DollarSign, Star, Home } from 'lucide-react';

const stats = [
  { icon: <Home className="w-6 h-6 text-teal-500" />, label: 'Active Listings', value: 4, change: '+1' },
  { icon: <DollarSign className="w-6 h-6 text-teal-500" />, label: 'Total Earnings', value: '$12,450', change: '+12%' },
  { icon: <Calendar className="w-6 h-6 text-teal-500" />, label: 'Upcoming Bookings', value: 8, change: '+3' },
  { icon: <Star className="w-6 h-6 text-teal-500" />, label: 'Average Rating', value: 4.8, change: '+0.2' },
];

const bookings = [
  {
    property: 'Luxury Beach Villa',
    location: 'Malibu, California',
    guest: 'John Doe',
    checkin: '15/2/2024',
    checkout: '20/2/2024',
    total: '$2375',
    status: 'Pending',
  },
  {
    property: 'Mountain Cabin Retreat',
    location: 'Aspen, Colorado',
    guest: 'Sarah Miller',
    checkin: '18/2/2024',
    checkout: '22/2/2024',
    total: '$1400',
    status: 'Confirmed',
  },
  {
    property: 'Luxury Beach Villa',
    location: 'Malibu, California',
    guest: 'Mike Johnson',
    checkin: '1/3/2024',
    checkout: '5/3/2024',
    total: '$2250',
    status: 'Confirmed',
  },
];

const properties = [
  {
    name: 'Luxury Beach Villa',
    location: 'Malibu, California',
    price: '$450/night',
    rating: 4.9,
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/luxury-villas/luxury-villa-1.jpg',
  },
  {
    name: 'Mountain Cabin Retreat',
    location: 'Aspen, Colorado',
    price: '$280/night',
    rating: 4.8,
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/mountain-cabins/mountain-cabin-1.jpg',
  },
  {
    name: 'Modern Loft with City Views',
    location: 'New York, NY',
    price: '$320/night',
    rating: 4.9,
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/city-apartments/city-apartment-1.jpg',
  },
];

export default function HostDashboard() {
  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <HostNavbar />
      <main className="flex-1 p-10 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-700 mb-1 flex items-center gap-2">Host Dashboard <span className="text-2xl">🏡</span></h1>
            <p className="text-gray-500">Manage your properties and track your earnings</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition text-md">
            <span className="text-xl">+</span> Add Property
          </button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2 border border-teal-50">
              <div className="flex items-center gap-3 mb-2">{stat.icon}<span className="text-2xl font-bold text-teal-700">{stat.value}</span></div>
              <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
              <div className="text-xs text-teal-400 font-semibold mt-1">{stat.change}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow p-6 border border-teal-50 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-teal-700">Recent Bookings</h2>
              <a href="#" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
            </div>
            <div className="flex flex-col gap-4">
              {bookings.map((b, i) => (
                <div key={i} className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-teal-50 transition">
                  <div>
                    <div className="font-bold text-md text-gray-800 mb-0.5">{b.guest}</div>
                    <div className="text-gray-700 text-sm mb-0.5">{b.property}</div>
                    <div className="text-gray-500 text-xs">Check-in: {b.checkin}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {b.status === 'Pending' && (
                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 font-semibold text-xs">pending</span>
                    )}
                    {b.status === 'Confirmed' && (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs">confirmed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Your Properties */}
          <div className="bg-white rounded-2xl shadow p-6 border border-teal-50 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-teal-700">Your Properties</h2>
              <a href="#" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
            </div>
            <div className="flex flex-col gap-4">
              {properties.map((p, i) => (
                <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-4 hover:bg-teal-50 transition">
                  <img src={p.image} alt={p.name} className="w-16 h-12 object-cover rounded-lg border" />
                  <div className="flex-1">
                    <div className="font-bold text-md text-teal-700">{p.name}</div>
                    <div className="text-gray-500 text-xs mb-0.5">{p.location}</div>
                    <div className="text-teal-500 font-semibold text-xs">{p.price}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-700">{p.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
