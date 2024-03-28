"use client";
import Navigationmenu from "@/components/Navigationmenu/navigationmenu";
import SwitchOne from "@/components/Switch/switch";

const Navbar = () => {
  return (
    <div className="flex justify-evenly items-center px-[30px] mt-[20px] ">
      <div>Jackal</div>
      <Navigationmenu />
      <div className="border bg-[#00000005] rounded-[20px] p-[5px] text-[12px]">
        Explore
      </div>
    </div>
  );
};

export default Navbar;
