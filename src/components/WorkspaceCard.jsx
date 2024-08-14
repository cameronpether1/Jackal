"use client";
import React from "react";

const WorkspaceCard = ({ space }) => {
  return (
    <div className="p-6 border rounded-md text-sm hover:bg-[#e4e4e4]">
      <h1>{space.title}</h1>
      <p>ID:{space.id}</p>
    </div>
  );
};

export default WorkspaceCard;
