"use client";
import Hero from "@/components/Hero/hero";
import Bento from "@/components/Bentogrid/bentogrid";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

const Home = () => {
  const image = "/img/planner.png";
  return (
    <>
      <Hero />
      <ContainerScroll>
        <div className="w-[100%]  h-[100%] relative">
          <Image
            src={`${image}`}
            alt="Planner Image"
            fill={true}
            className="contain "
          ></Image>
        </div>
      </ContainerScroll>
      <Bento />
    </>
  );
};

export default Home;
