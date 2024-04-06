import Link from "next/link";

const Hero = () => {
  return (
    <div className="flex flex-col  ">
      <div className=" w-[100%] flex flex-col justify-center items-center  pt-[100px] pb-[300px] ">
        <p className="text-base text-center text-[10px] sm:text-[10px] md:text-[10px] lg:text-[12px] ">
          be unshakable in your commitments
        </p>
        <p className="text-transparent duration-1000 font-bold text-center bg-gradient-to-r bg-clip-text from-[var(--herogradfrom)] via-[var(--herogradvia)] to-[var(--herogradto)] p-[15px] text-[34px] sm:text-5xl md:text-6xl lg:text-6xl ">
          Explore New Heights
          <br />
          of Productivity
        </p>
        <p className="max-w-[500px] text-center bg-clip-text text-[10px] sm:text-[10px] md:text-[10px] lg:text-[12px] ">
          The digital planner with your success in mind.
        </p>
        <div
          className="  mt-16 flex items-center justify-center text-white bg-gradient-to-r from-[#383391] to-[#4930a5] w-40 h-12 
        cursor-pointer shadow-2xl shadow-zinc-900 rounded-full text-sm font-semibold "
        >
          <Link href="/about">View</Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
