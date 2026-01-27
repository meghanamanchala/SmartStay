
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-white/80 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500 rounded-full p-2">
            <Image src="/logo.svg" alt="SmartStay Logo" width={32} height={32} />
          </div>
          <span className="text-2xl font-bold text-teal-700 tracking-tight">SmartStay</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="px-5 py-2 rounded-lg border border-teal-500 text-teal-600 font-medium hover:bg-teal-50 transition">Sign in</Link>
          <button className="px-5 py-2 rounded-lg bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition">Get started</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4 bg-gradient-to-b from-white via-teal-50 to-white">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
          Find your perfect <span className="text-teal-500">getaway</span> anywhere
        </h1>
        <p className="max-w-xl text-lg text-gray-600 mb-8">
          Discover unique properties worldwide. Book with confidence, host with ease, and create unforgettable memories with SmartStay.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 rounded-lg bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition">Start exploring</button>
          <button className="px-6 py-3 rounded-lg border border-teal-500 text-teal-600 font-semibold hover:bg-teal-50 transition">Become a host</button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="flex flex-wrap justify-center gap-8 py-10 bg-white/60">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">50K+</span>
          <span className="text-gray-500 mt-1">Properties</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">120K+</span>
          <span className="text-gray-500 mt-1">Happy Guests</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">190+</span>
          <span className="text-gray-500 mt-1">Countries</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-teal-600">98%</span>
          <span className="text-gray-500 mt-1">Satisfaction</span>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 px-4 bg-white">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Featured Properties</h2>
        <p className="text-center text-gray-500 mb-8">Handpicked destinations for your next adventure</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Property Card 1 */}
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="/property1.jpg" alt="Luxury Beach Villa" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Luxury Beach Villa</div>
            <div className="text-sm text-gray-500">Malibu, California</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.9</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$450<span className="text-sm font-normal text-gray-500">/night</span></div>
          </div>
          {/* Property Card 2 */}
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="/property2.jpg" alt="Mountains Cabin Retreat" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Mountains Cabin Retreat</div>
            <div className="text-sm text-gray-500">Aspen, Colorado</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.8</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$280<span className="text-sm font-normal text-gray-500">/night</span></div>
          </div>
          {/* Property Card 3 */}
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="/property3.jpg" alt="Modern City Loft" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Modern City Loft</div>
            <div className="text-sm text-gray-500">New York, NY</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.7</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$320<span className="text-sm font-normal text-gray-500">/night</span></div>
          </div>
          {/* Property Card 4 */}
          <div className="bg-teal-50 rounded-xl shadow p-4 flex flex-col">
            <Image src="/property4.jpg" alt="Tropical Paradise Villa" width={400} height={250} className="rounded-lg mb-3 object-cover w-full h-40" />
            <div className="font-semibold text-gray-800">Tropical Paradise Villa</div>
            <div className="text-sm text-gray-500">Bali, Indonesia</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-gray-700">4.9</span>
            </div>
            <div className="mt-2 text-teal-600 font-bold">$180<span className="text-sm font-normal text-gray-500">/night</span></div>
          </div>
        </div>
      </section>

      {/* Choose Your Journey */}
      <section className="py-16 px-4 bg-teal-50">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Choose Your Journey</h2>
        <p className="text-center text-gray-500 mb-8">Whether you're looking to stay or host, we've got you covered</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Guest Card */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-teal-100 p-3 rounded-full mb-3">
              <span className="text-2xl">🧳</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1">Guest</div>
            <div className="text-gray-500 text-center text-sm">Book amazing stays and create unforgettable memories</div>
          </div>
          {/* Host Card */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-teal-100 p-3 rounded-full mb-3">
              <span className="text-2xl">🏡</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1">Host</div>
            <div className="text-gray-500 text-center text-sm">List your property and start earning extra income</div>
          </div>
          {/* Admin Card */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-teal-100 p-3 rounded-full mb-3">
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1">Admin</div>
            <div className="text-gray-500 text-center text-sm">Manage the platform and ensure quality service</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-700 text-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <div className="bg-white rounded-full p-2">
              <Image src="/logo.svg" alt="SmartStay Logo" width={28} height={28} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SmartStay</span>
          </div>
          <div className="text-sm">© 2024 SmartStay. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
