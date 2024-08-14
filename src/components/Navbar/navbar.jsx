"use client";
import Navigationmenu from "@/components/Navbar/Navigationmenu/navigationmenu";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center px-[30px] mt-[20px] border rounded-full mx-auto w-[70%] ">
      <Link href="/">
        <div>Jackal</div>
      </Link>
      <Navigationmenu />
      <Link href="/signup" className=" w-auto  mx-2">
        <button className="bg-[#222222] text-nowrap font-sans flex space-x-2 items-center z-10 py-2 px-4 no-underline group w-full h-full cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full text-xs font-semibold text-white md:inline-block">
          <div className="flex">
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
