import { motion, useScroll } from "framer-motion";

const Eightgrid = () => {
  const { scrollYProgress } = useScroll();
  return (
    <div className="flex justify-center ">
      <motion.div
        style={{ scale: scrollYProgress }}
        className="grid grid-cols-3 grid-rows-6 gap-4 h-[600px] w-[1100px] mx-[200px] rounded-lg text-[12px] "
      >
        <div className="row-span-2 border border-[#FFFFFF20] rounded-lg p-[10px]">
          <span className="text-[15px]"> Automatic tracking.</span> Any started
          issues are added to the current cycle.
        </div>
        <div className="row-span-3 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          {" "}
          <span className="text-[15px]">Predict delays.</span> Get warnings for
          at-risk cycles.
        </div>
        <div className="row-span-2 col-start-1 row-start-3 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          <span className="text-[15px]">Scheduled.</span> Unfinished work rolls
          over to the next cycle automatically.
        </div>
        <div className="row-span-2 col-start-1 row-start-5 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          <span className="text-[15px]">Scope creep.</span> Understand which
          issues are added mid-cycle.
        </div>
        <div className="row-span-3 col-start-2 row-start-4 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          <span className="text-[15px]">Fully configurable.</span> Define start
          date, end date, duration, and more.
        </div>
        <div className="row-span-2 col-start-3 row-start-1 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          <span className="text-[15px]">Be prepared.</span> Schedule work in
          advance with upcoming cycles.
        </div>
        <div className="row-span-2 col-start-3 row-start-5 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          <span className="text-[15px]">Automatic tracking.</span> Any started
          issues are added to the current cycle.
        </div>
        <div className="row-span-2 col-start-3 row-start-3 border border-[#FFFFFF20] rounded-lg p-[10px] ">
          <span className="text-[15px]">Predict delays.</span> Get warnings for
          at-risk cycles.
        </div>
      </motion.div>
    </div>
  );
};
export default Eightgrid;
