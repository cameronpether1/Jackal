"use client";
import * as React from "react";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

const notedashboard = () => {
  const constraintsRef = useRef(null);
  const [divCount, setDivCount] = useState(0);

  const addDiv = () => {
    setDivCount((prevCount) => prevCount + 1);
  };
  const removeDiv = () => {
    setDivCount((prevCount) => prevCount - 1);
  };

  const renderDivs = () => {
    const y = useMotionValue(0);
    const x = useMotionValue(0);
    // const opacity = useTransform(x, [-100, 0, 100], [1, 1, 0.6]);
    useMotionValueEvent(y, "change", (latest) => {
      console.log("y changed to", latest);
    });
    useMotionValueEvent(x, "change", (latest) => {
      console.log("x changed to", latest);
    });

    const divs = [];
    for (let i = 0; i < divCount; i++) {
      divs.push(
        <motion.div
          style={{ x, y }}
          key={i}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          className=" cursor-move absolute top-[100px] left-0 w-[400px] h-[150px] rounded-[20px] bg-[#F4F4F4] bg-[radial-gradient(var(--notedot)_1px,transparent_1px)] [background-size:6px_6px]"
        >
          <div className="relative top-3 left-3 drop-shadow-2xl">New Note</div>
          <img
            src="/img/Rectangle.png"
            alt="profile picture"
            className="absolute top-2 right-2 h-[40px]"
          />
          <div className="absolute top-2 right-[40px] bg-[#222222] w-[60px] h-[20px] rounded-[15px] rounded-ee-none">
            <p className="text-[10px] text-center pt-[3px] text-[#ffffff]">
              Cameron
            </p>
          </div>
        </motion.div>
      );
    }
    return divs;
  };

  return (
    <>
      <motion.div
        ref={constraintsRef}
        className=" abslute w-screen h-screen bg-[#D9D9D9] overflow-hidden "
      >
        <button
          onClick={addDiv}
          className="border bg-white rounded-full absolute left-[45%] top-[100px] p-[10px]"
        >
          + Add Note
        </button>
        <button
          onClick={removeDiv}
          className="border bg-white rounded-full absolute left-[55%] top-[100px] p-[10px]"
        >
          - Remove Note
        </button>
        {renderDivs()}
      </motion.div>
    </>
  );
};

export default notedashboard;
