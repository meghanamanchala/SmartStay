import GuestNavbar from '@/components/navbar/GuestNavbar';
import { Calendar, Heart, TrendingUp, Search } from 'lucide-react';

const stats = [
  { icon: <Calendar className="w-7 h-7 text-teal-500" />, label: 'Upcoming Trips', value: 2 },
  { icon: <Heart className="w-7 h-7 text-teal-500" />, label: 'Saved Properties', value: 12 },
  { icon: <TrendingUp className="w-7 h-7 text-teal-500" />, label: 'Properties Viewed', value: 45 },
];

const recentlyViewed = [
  {
    name: 'Luxury Beach Villa',
    location: 'Malibu, California',
    price: '$450/night',
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/luxury-villas/luxury-villa-1.jpg',
  },
  {
    name: 'Mountain Cabin Retreat',
    location: 'Aspen, Colorado',
    price: '$280/night',
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/mountain-cabins/mountain-cabin-1.jpg',
  },
  {
    name: 'Modern Loft with City Views',
    location: 'New York, NY',
    price: '$320/night',
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/city-apartments/city-apartment-1.jpg',
  },
  {
    name: 'Tropical Paradise Villa',
    location: 'Bali, Indonesia',
    price: '$180/night',
    image: 'https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769666902/smartstay/tropical-homes/tropical-home-1.jpg',
  },
];

export default function GuestDashboard() {
  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <GuestNavbar />
      <main className="flex-1 p-10 bg-gray-50 ml-64">
        <div className="mb-2">
          <h1 className="text-3xl font-extrabold text-teal-700 mb-1 flex items-center gap-2">Welcome back! <span className="text-2xl">👋</span></h1>
          <p className="text-gray-500">Ready to discover your next adventure?</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-teal-50">
              <div>{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-teal-700">{stat.value}</div>
                <div className="text-gray-500 text-md font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Quick Search */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8 border border-teal-50">
          <div className="font-bold text-lg mb-2 text-gray-700">Quick Search</div>
          <form className="flex items-center gap-3">
            <div className="flex items-center flex-1 bg-gray-100 rounded-lg px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Where do you want to go?"
                className="bg-transparent outline-none flex-1 text-gray-700 text-md placeholder-gray-400"
              />
            </div>
            <button type="submit" className="px-6 py-3 rounded-lg bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition text-md">
              Explore
            </button>
          </form>
        </div>
        {/* Recently Viewed */}
        <div className="mb-2 flex items-center justify-between">
          <div className="font-bold text-xl text-gray-700">Recently Viewed</div>
          <a href="#" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {recentlyViewed.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl shadow p-4 min-w-[260px] max-w-[260px] flex-shrink-0 border border-teal-50">
              <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3 border" />
              <div className="font-bold text-md text-teal-700">{p.name}</div>
              <div className="text-gray-500 text-sm mb-1">{p.location}</div>
              <div className="text-teal-500 font-semibold text-md">{p.price}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
