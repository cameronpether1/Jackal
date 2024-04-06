import React from "react";
import Link from "next/link";

const Blogcard = () => {
  return (
    <Link href="/">
      <div className="lg:flex justify-center items-center mx-[400px] hidden ">
        <div className="flex flex-row bg-white rounded-xl shadow-lg shadow-black/20 min-w-[830px] max-w-[830px] max-h-[300px] overflow-hidden text-[var(--contrasttext)] ">
          <img
            src="/img/items/1.png"
            alt="blog image"
            className="rounded-l h-full w-1/2  "
          />
          <div className="p-[20px] w-1/2 ">
            <p className="text-[15px] text-[#7f87ff]">Read More</p>
            <p className="text-[15px] ">Title Of Blogs</p>
            <p className="text-[10px] ">
              Blog Content <br /> Lorem, ipsum dolor sit amet consectetur
              adipisicing elit. Minus, unde. Facere recusandae ut sequi
              quisquam.
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Blogcard;
