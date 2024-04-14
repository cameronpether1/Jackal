"use client";
import Navigationmenu from "@/components/Navbar/Navigationmenu/navigationmenu";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center px-[30px] mt-[20px] ">
      <div>Jackal</div>
      <Navigationmenu />
      <Link href="/login">
        <button className="border bg-zinc-100 hover:bg-white border-black no-underline cursor-pointer relative shadow-2xl rounded-full p-px text-xs font-semibold leading-6 text-black hidden md:inline-block">
          <div className="relative font-sans flex space-x-2 items-center z-10 rounded-full py-0.5 px-4 ring-1 ring-white/10 ">
            <span>Login</span>
            <svg
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.75 8.75L14.25 12L10.75 15.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </button>
      </Link>
      <Link href="/signup" className=" w-[150px] mx-2">
        <button className="bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white hidden md:inline-block">
          <div className="relative font-sans flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 ">
            <span>Sign Up</span>
            <svg
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.75 8.75L14.25 12L10.75 15.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </button>
      </Link>
    </div>
  );
};

export default Navbar;
