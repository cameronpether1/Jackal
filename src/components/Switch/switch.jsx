import React from "react";
import * as Switch from "@radix-ui/react-switch";

function toggleTheme() {
  var switchroot = document.getElementById("dark-mode");
  var root = document.documentElement;
  const light = ["light"];
  const dark = ["dark"];
  let themecolor = dark || light;

  themecolor = root.id == dark ? light : dark;
  root.setAttribute("id", themecolor);

  if (themecolor == light) {
    console.log("this is light");
    switchroot.setAttribute("checked", "true");
  }
}

const SwitchOne = () => (
  <form>
    <div className="flex items-center w-[140px]">
      <label
        className=" text-[12px] leading-none pr-[15px]"
        htmlFor="dark-mode"
      >
        Dark Mode
      </label>
      <Switch.Root
        onCheckedChange={toggleTheme}
        id="dark-mode"
        className="w-[42px] h-[25px] bg-black rounded-full relative data-[state=checked]:bg-violet11 cursor-default"
        style={{ "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)" }}
      >
        <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA4 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[80%]" />
      </Switch.Root>
    </div>
  </form>
);

export default SwitchOne;
