import React from "react";
import Image from "next/image";

const Blogcardvertical = () => {
  return (
    <div className="flex-col justify-center items-center ">
      <div className="flex flex-col m-[20px] flex-wrap  bg-white rounded-xl shadow-lg shadow-black/20 w-[250px] overflow-hidden ">
        <img
          src="/img/items/2.png"
          alt="blog image"
          className="rounded-l h-1/2 w-full aspect-square"
        />
        <div className="p-[20px] h-1/2 ">
          <p className="text-[14px] text-[#7f87ff]">Read More</p>
          <p className="text-[15px]">Blog Title</p>
          <p className="text-[10px] truncate">
            Blog Content <br /> Lorem, ipsum dolor sit amet consectetur
            adipisicing elit. Minus, unde. Facere recusandae ut sequi quisquam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blogcardvertical;
