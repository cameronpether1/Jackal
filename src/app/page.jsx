"use client";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";
import TitleSection from "@/components/landingpage/title-section";
import Banner from "/public/img/Banner.png";
import BannerSec2 from "/public/img/Productivity-Banner.png";
import { PRICING_CARDS } from "@/lib/constants";
import { PRICING_PLANS } from "@/lib/constants";
import CustomCard from "@/components/landingpage/custom-card";
import clsx from "clsx";
import diamond from "/public/img/diamond.svg";
import CheckIcon from "/public/img/check.svg";

const Home = () => {
  return (
    <>
      <section>
        <div className="overflow-hidden px-4 sm:px-6 mt-10 sm:flex sm:flex-col gap-4 md:justify-center md:items-center">
          <TitleSection
            pill="Be unshakable in Your commitments."
            title="Explore New Heights
            of Productivity"
          ></TitleSection>
          <div className=" bg-white p-[2px] mt-6 rounded-xl bg-gradient-to-r from-[var(--herogradto)] via-[var(--herogradvia)] to-[var(--herogradto)] sm:w-[300px]">
            <button className="w-full rounded-[10px] p-2 text-2xl bg-[#f4f4f4] ">
              Get Jackal Free
            </button>
          </div>
          <div className="md:mt-[90px] sm:w-full w-[750px] flex justify-center items-center mt-[10px] relative sm:ml-0 ml-[-50px]">
            <Image src={Banner} alt="Application Banner" />
            <div className="bottom-0 top-[50%] bg-gradient-to-t from-[#f4f4f4] left-0 right-0 absolute z-10"></div>
          </div>
        </div>
      </section>
      <section className="px-4 sm:px-6 flex justify-center items-center flex-col relative">
        <div className="w-[30%] blur-[120px] rounded-full h-32 absolute bg-purple-500 -z-10 top-22" />
        <TitleSection
          title="Organise yourself AND your Family"
          subheading="Create Tasks, Track Events, Share Thoughts"
          pill="features"
        />
        <div className="mt-10 max-w-[450px] flex justify-center items-center relative sm:ml-0 rounded-2xl border-8 border-purple-300 border-opacity-10">
          <Image src={BannerSec2} alt="Productivity Planner Banner"></Image>
        </div>
      </section>
      <section className="relative">
        <div className="w-full blur-[120px] rounded-full h-32 absolute bg-purple-500 -z-10 top-56" />
        <div className="mt-20 px-4 sm:px-6 flex flex-col overflow-x-hidden overflow-visible">
          <TitleSection
            title="Trusted Globally"
            subheading="Join thousands using Jackal everyday to organise, prioritise, and connect"
            pill="Testimonials"
          />
          <TitleSection
            title="The Perfect Plan For You"
            subheading="Experience all the benefits of Jackal. Select the best plan for you."
            pill="Pricing"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-center sm:items-stretch items-center mt-10">
            {PRICING_CARDS.map((card) => (
              <CustomCard
                key={card.planType}
                className={clsx(
                  "w-[300px] rounded-2xl bg-black/95 background-blur-3xl relative",
                  {
                    "border-purple-500/70":
                      card.planType === PRICING_PLANS.proplan,
                  }
                )}
                cardHeader={
                  <div className="text-2xl font-semibold">
                    {card.planType === PRICING_PLANS.proplan && (
                      <>
                        <div className="hidden w-full blur-[120px] rounded-full h-32 absolute bg-purple-500/80 -z-10 top-0" />
                        <Image
                          src={diamond}
                          alt="Pro Plan Icon"
                          className="absolute top-6 right-6"
                        ></Image>
                      </>
                    )}
                    {card.planType}
                  </div>
                }
                cardContent={
                  <div className="p-0">
                    <span className="font-normal text-2xl">£{card.price}</span>
                    {+card.price > 0 ? (
                      <span className="text-purple-800 ml-1">/mo</span>
                    ) : (
                      ""
                    )}
                    <p className=" text-purple-800">{card.description}</p>
                    <button className="bg-slate-800 w-full mt-4 whitespace-nowrap no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block">
                      {card.planType === PRICING_PLANS.proplan
                        ? "go Pro"
                        : "Get Started"}
                    </button>
                  </div>
                }
                cardFooter={
                  <ul className="font-normal flex mb-2 flex-col gap-4">
                    <small>{card.highlightFeature}</small>
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Image src={CheckIcon} alt="Check Icon" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                }
              ></CustomCard>
            ))}
          </div>
        </div>
      </section>
      {/* <ContainerScroll>
        <div className="w-[100%] h-[100%] relative">
          <Image src={Banner} alt="Application Banner"></Image>
        </div>
      </ContainerScroll> */}
    </>
  );
};

export default Home;
