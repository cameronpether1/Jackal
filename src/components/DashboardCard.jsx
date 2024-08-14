"use client";
import React from "react";

const DashboardCard = ({ board }) => {
  return (
    <div className="p-6 border rounded-md text-sm hover:bg-[#e4e4e4]">
      <h1>{board.title}</h1>
      <p>ID:{board.id}</p>
      <p>Workspace Id:{board.workspaceId}</p>
    </div>
  );
};

export default DashboardCard;
