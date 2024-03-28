import Link from "next/link";
import React from "react";

const Storeitems = () => {
  const storeitems = [
    {
      title: "Trousers",
      path: "/store",
      price: "£25.00",
      image: "/img/items/1.png",
    },
    {
      title: "Jacket",
      path: "/store",
      price: "£25.00",
      image: "/img/items/1.png",
    },
    {
      title: "Jeans",
      path: "/store",
      price: "£25.00",
      image: "/img/items/1.png",
    },
    {
      title: "Hoodie",
      path: "/store",
      price: "£25.00",
      image: "/img/items/1.png",
    },
    {
      title: "Tshirt",
      path: "/store",
      price: "£25.00",
      image: "/img/items/1.png",
    },
  ];

  return (
    <div className="flex items-center justify-start flex-wrap mt-[80px]">
      {storeitems.map((storeitems) => (
        <Link
          className="text-[12px] p-[10px]"
          href={storeitems.path}
          key={storeitems.title}
        >
          <div className="flex flex-col items-start justify-start border bg-slate-500/5 hover:backdrop-blur-0 backdrop-blur-[2px] transition duration-200 w-[380px] h-[520px] p-[10px] space-y-3">
            <img
              src={storeitems.image}
              alt={storeitems.title}
              className="rounded-lg w-[60%]"
            />
            <div className="text-[15px]">{storeitems.title}</div>
            <div>{storeitems.price}</div>
          </div>
        </Link>
      ))}
    </div>
  );
};
export default Storeitems;
