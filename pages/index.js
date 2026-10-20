import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans">
      <Head>
        <title>CEC Track - Home</title>
      </Head>

      {/* Navigation Bar */}
      <nav className="w-full bg-white shadow-sm p-4 flex justify-between items-center max-w-md mx-auto">
        <div className="font-bold text-green-700 text-xl tracking-wider">CEC TRACK</div>
        <button className="text-gray-500 hover:text-green-700 focus:outline-none">
          {/* Hamburger Icon */}
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-6 flex flex-col items-center mt-6">
        
        {/* Status Badge */}
        <div className="bg-white px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-gray-600 mb-6 flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>LIVE PORTAL</span>
        </div>

        {/* Logo Placeholder (Green Theme) */}
        <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-green-500">
          <span className="text-5xl">🎓</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">CEC TRACK</h1>
        <p className="text-center text-gray-500 text-sm mb-8 px-2 leading-relaxed">
          Uniting students across computing, engineering, and technology disciplines. Innovate, collaborate, and excel together.
        </p>

        {/* Action Area */}
        <div className="w-full space-y-4">
          
          {/* Search Bar Placeholder */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search Student ID (e.g. 2024-00123)..." 
              className="w-full py-3.5 pl-10 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Connected Login Button */}
          <Link 
            href="/login" 
            className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-colors duration-200"
          >
            Access Member Portal
          </Link>

          {/* Explore Events Button */}
          <button className="w-full py-3 text-green-700 font-semibold bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200 flex justify-center items-center">
            Explore Events
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </main>
    </div>
  );
}
