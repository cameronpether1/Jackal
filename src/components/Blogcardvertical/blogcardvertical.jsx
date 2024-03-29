"use client";
import React from "react";

const Blogcardvertical = ({ post }) => {
  return (
    <div className="flex-col justify-center items-center ">
      <div className="flex flex-col m-[20px] flex-wrap  bg-white rounded-xl shadow-lg shadow-black/20 w-[250px] h-[450px] overflow-hidden text-[var(--contrasttext)]">
        <img
          src={`/img/${post.img}.png`}
          alt="blog image"
          className="rounded-l h-1/2 w-full aspect-square"
        />
        <div className="p-[20px] h-1/2 ">
          <p className="text-[14px] text-[#7f87ff]">Read More</p>
          <p className="text-[15px]">{post.title}</p>
          <p className="text-[10px] pr-[5px]">
            Blog Content <br /> {post.body}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blogcardvertical;
