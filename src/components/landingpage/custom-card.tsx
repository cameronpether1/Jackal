import React from "react";

type CustomCardProps = {
  className?: React.ReactNode;
  cardHeader?: React.ReactNode;
  cardContent?: React.ReactNode;
  cardFooter?: React.ReactNode;
};

const CustomCard: React.FC<CustomCardProps> = ({
  className,
  cardHeader,
  cardContent,
  cardFooter,
  ...props
}) => {
  return (
    <div
      className="w-[380px] min-h-[400px] rounded-2xl flex flex-col justify-start p-6 border bg-[#f4f4f4]/10 hover:bg-[#f4f4f4]/60  relative"
      {...props}
    >
      <h2 className="text-2xl md:text-6xl mb-20">{cardHeader}</h2>
      <div
        className="grid
        gap-4
      "
      >
        {cardContent}
      </div>
      <div>{cardFooter}</div>
    </div>
  );
};

export default CustomCard;
