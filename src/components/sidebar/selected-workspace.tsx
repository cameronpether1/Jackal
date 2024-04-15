"use client";
import { workspace } from "@/lib/supabase/supabase.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ChevronDown } from "lucide-react";
import Image from "next/legacy/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface SelectedWorkspaceProps {
  workspace: workspace;
  onClick?: (option: workspace) => void;
}

const SelectedWorkspace: React.FC<SelectedWorkspaceProps> = ({
  workspace,
  onClick,
}) => {
  const supabase = createClientComponentClient();
  const [workspaceLogo, setWorkspaceLogo] = useState("/logo.svg");
  useEffect(() => {
    if (workspace.logo) {
      const path = supabase.storage
        .from("workspace-logos")
        .getPublicUrl(workspace.logo)?.data.publicUrl;
      setWorkspaceLogo(path);
    }
  }, [workspace]);
  return (
    <Link
      href={`/notedashboard/${workspace.id}`}
      onClick={() => {
        if (onClick) onClick(workspace);
      }}
      className="flex rounded-md hover:bg-violet4 transition-all flex-row p-2 gap-4 justify-center cursor-pointer items-center my-2"
    >
      {/* <Image
        src={workspaceLogo}
        alt="Workspace Logo"
        width={16}
        height={16}
        objectFit="cover"
      /> */}
      <ChevronDown />
      <div className="flex flex-col">
        <p className="text-sm w-[170px] overflow-hidden overflow-ellipsis whitespace-nowrap">
          {workspace.title}
        </p>
      </div>
    </Link>
  );
};

export default SelectedWorkspace;
