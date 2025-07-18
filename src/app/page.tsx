"use client";

import React from "react";
import Link from "next/link";
import Scan from './(pages)/scan/page';
import AdminDashboard from './(pages)/dashboard/page';

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div>
       <h3>uncommon.org</h3>
        </div>
        <nav className="hidden md:flex space-x-10 text-black text-base font-normal">
          <Link className="hover:underline" href="/scan">
            Login
          </Link>
          <Link className="hover:underline" href="/register">
            Register
          </Link>
          <Link className="hover:underline" href="/dashboard">
            AdminDashboard
          </Link>
        </nav>
        <div>
          <Link href="/scan">
            <button
              className="bg-[#0047b3] text-white font-semibold rounded-full px-6 py-3 text-base hover:bg-[#003a8c] transition"
              type="button"
            >
              Scan
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 text-center mt-20">
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-6"
          style={{ fontFamily: "'Poppins', sans-serif, 'Fredoka One', cursive" }}
        >
          Vincent Bohlen Innovation Hub Attendance Tracker
        </h1>
        <p className="text-lg sm:text-xl text-black max-w-3xl mx-auto">
          Track daily attendance with facial recognition and streamline your data with ease.
        </p>
      </main>
    </>
  );
}
