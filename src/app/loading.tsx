import Loader from "@/components/ui/Loader";
import React from "react";

const Loading = () => {
  return (
    <div className="absolute top-[50%] left-[50%] ">
      <div>
        <Loader />
      </div>
    </div>
  );
};

export default Loading;
