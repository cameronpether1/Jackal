import React from "react";
import CustomDialogTrigger from "../global/custom-dialog-trigger";
import TrashRestore from "./trash-restore";
import { useAppState } from "@/lib/providers/state-provider";
import { deleteFile, deleteFolder } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";

interface TrashProps {
  children: React.ReactNode;
}

const Trash: React.FC<TrashProps> = ({ children }) => {
  return (
    <CustomDialogTrigger header="Trash" content={<TrashRestore />}>
      {children}
    </CustomDialogTrigger>
  );
};
export default Trash;
