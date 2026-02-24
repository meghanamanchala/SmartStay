import Image from "next/image";
import { Home as HomeIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <header className="flex items-center justify-between px-8 py-6 bg-white/80 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500 rounded-full p-2">
            <HomeIcon className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-teal-700 tracking-tight">SmartStay</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="px-5 py-2 rounded-lg border border-teal-500 text-teal-600 font-medium hover:bg-teal-50 transition">Login</Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2 rounded-lg bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition border border-teal-500"
          >
            Sign up
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center justify-center text-center py-20 px-4 bg-gradient-to-b from-white via-teal-50 to-white">
        <div className="mb-4">
          <span className="inline-block px-4 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold mb-4">AI-Powered Smart Search</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
          Find Your Perfect Stay, <span className="text-teal-500">Intelligently</span>
        </h1>
        <p className="max-w-xl text-lg text-gray-600 mb-8">
          Search naturally, get AI-powered recommendations with safety scores, eco ratings, and smart pricing insights.
        </p>
        <div className="w-full max-w-2xl flex flex-col gap-2 mb-6">
          <div className="flex bg-white rounded-xl shadow border border-teal-100 overflow-hidden">
            <input
              type="text"
              className="flex-1 px-5 py-4 outline-none text-gray-700 bg-transparent"
              placeholder="Where are you going?"
            />
            <button className="px-8 bg-teal-500 text-white font-semibold hover:bg-teal-600 transition border-l border-teal-100">Search</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-teal-600 mt-2">
            <span className="bg-teal-50 px-3 py-1 rounded-full">2BHK near metro under ₹3000</span>
            <span className="bg-teal-50 px-3 py-1 rounded-full">Pet friendly villa with pool</span>
            <span className="bg-teal-50 px-3 py-1 rounded-full">Safe area for solo women</span>
            <span className="bg-teal-50 px-3 py-1 rounded-full">Eco-friendly stays in Kerala</span>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap justify-center gap-8 py-10 bg-white/60">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">50K+</span>
          <span className="text-gray-500 mt-1">Properties</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">200K+</span>
          <span className="text-gray-500 mt-1">Happy Guests</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">100+</span>
          <span className="text-gray-500 mt-1">Cities</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">98%</span>
          <span className="text-gray-500 mt-1">5-Star Reviews</span>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Featured Properties</h2>
        <p className="text-center text-gray-500 mb-8">Handpicked destinations for your next adventure</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769667093/smartstay/luxury-villas/temp-luxury-villa-2.jpg" alt="Luxury Beach Villa" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Luxury Beach Villa</div>
            <div className="text-sm text-gray-500">Malibu, California</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.9</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$450<span className="text-sm text-gray-500">/night</span></div>
          </div>
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769667094/smartstay/mountain-cabins/temp-mountain-cabin-2.jpg" alt="Mountains Cabin Retreat" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Mountains Cabin Retreat</div>
            <div className="text-sm text-gray-500">Aspen, Colorado</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.8</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$280<span className="text-sm text-gray-500">/night</span></div>
          </div>
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769667094/smartstay/city-apartments/temp-city-apartment-3.jpg" alt="Modern City Loft" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Modern Loft with City Views</div>
            <div className="text-sm text-gray-500">New York, NY</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.9</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$320<span className="text-sm text-gray-500">/night</span></div>
          </div>
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="https://res.cloudinary.com/dmqx3nwsj/image/upload/v1769667093/smartstay/tropical-homes/temp-tropical-home-1.jpg" alt="Tropical Paradise Villa" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Tropical Paradise Villa</div>
            <div className="text-sm text-gray-500">Bali, Indonesia</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.9</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$180<span className="text-sm text-gray-500">/night</span></div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-teal-50">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Choose Your Journey</h2>
        <p className="text-center text-gray-500 mb-8">Whether you're looking to stay or host, we've got you covered</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-teal-100 p-3 rounded-full mb-3">
              <span className="text-2xl">🧳</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1">Guest</div>
            <div className="text-gray-500 text-center text-sm">Book amazing stays and create unforgettable memories</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-teal-100 p-3 rounded-full mb-3">
              <span className="text-2xl">🏡</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1">Host</div>
            <div className="text-gray-500 text-center text-sm">List your property and start earning extra income</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-teal-100 p-3 rounded-full mb-3">
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1">Admin</div>
            <div className="text-gray-500 text-center text-sm">Manage the platform and ensure quality service</div>
          </div>
        </div>
      </section>

      <footer className="bg-teal-700 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between px-6 gap-8">
          <div className="flex-1 mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white rounded-full p-2">
                <HomeIcon className="w-7 h-7 text-teal-700" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">SmartStay</span>
            </div>
            <div className="text-sm text-white/80 mb-2">AI powered property rentals with smart pricing, safety scores, and eco ratings.</div>
            <div className="text-sm text-white/80">hello@smartstay.com<br/>+91 9876543210</div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="font-semibold mb-2">Company</div>
              <ul className="space-y-1 text-sm text-white/80">
                <li><a href="#">About</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Support</div>
              <ul className="space-y-1 text-sm text-white/80">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Safety</a></li>
                <li><a href="#">Cancellation</a></li>
                <li><a href="#">COVID-19</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Hosting</div>
              <ul className="space-y-1 text-sm text-white/80">
                <li><a href="#">Become a Host</a></li>
                <li><a href="#">Host Resources</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Legal</div>
              <ul className="space-y-1 text-sm text-white/80">
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Sitemap</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-white/60 mt-8">© 2024 SmartStay. All rights reserved.</div>
      </footer>
    </div>
  );
}
