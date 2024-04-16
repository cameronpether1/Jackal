"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Folder } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";

interface FoldersDropdownListProps {
  workspaceFolders: Folder[];
  workspaceId: string;
}

const FoldersDropdownList: React.FC<FoldersDropdownListProps> = ({
  workspaceFolders,
  workspaceId,
}) => {
  //WIP  local state folders
  //WIP  set realtime updates
  const { state, dispatch } = useAppState();
  const [folders, setFolders] = useState(workspaceFolders);
  //effect set inital state server app state
  useEffect(() => {
    if (workspaceFolders.length > 0) {
      dispatch({
        type: "SET_FOLDERS",
        payload: {
          workspaceId,
          folders: workspaceFolders.map((folder) => ({
            ...folder,
            files:
              state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((f) => f.id === folder.id)?.files || [],
          })),
        },
      });
    }
  }, [workspaceFolders, workspaceId]);
  //state

  useEffect(() => {
    setFolders(
      state.workspaces.find((workspace) => workspace.id === workspaceId)
        ?.folders || []
    );
  }, [state, workspaceId]);

  //add folder

  return (
    <div className="text-xs flex sticky z-20 top-0 bg-[#f4f4f4] w-full h-10 group/title justify-between items-center pr-4 text-[#090909]">
      <span className="text-[#090909] font-bold text-xs">FOLDERS</span>
      <TooltipComponent message="Create Folder">
        <PlusIcon
          size={16}
          className="group-hover/title:inline-block hidden cursor-pointer"
        />
      </TooltipComponent>
    </div>
  );
};

export default FoldersDropdownList;
