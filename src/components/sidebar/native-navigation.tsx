import { Settings2, SquareDashedMousePointer, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import Settings from "../settings/settings";
import Trash from "../trash/trash";

interface NativeNavigationProps {
  myWorkspaceId: string;
  className?: string;
}

const NativeNavigation: React.FC<NativeNavigationProps> = ({
  myWorkspaceId,
  className,
}) => {
  return (
    <nav className={twMerge("my-2", className)}>
      <ul className="flex flex-col">
        <li className="hover:bg-violet4">
          <Link
            className="group/native flex text-[#090909] text-xs transition-all p-2 rounded-md  gap-2 items-center "
            href={`/notedashboard/${myWorkspaceId}`}
          >
            <SquareDashedMousePointer className="w-5 h-5" />
            <span>My Workspace</span>
          </Link>
        </li>
        <Settings>
          <li className="group/native flex text-[#090909] hover:bg-violet4 text-xs transition-all p-2 rounded-md gap-2 items-center cursor-pointer">
            <Settings2 className="w-5 h-5" />
            <span>Settings</span>
          </li>
        </Settings>
        <Trash>
          <li className="group/native flex text-[#090909] hover:bg-violet4 text-xs transition-all p-2 rounded-md  gap-2 items-center">
            <Trash2 className="w-5 h-5" />
            <span>Trash</span>
          </li>
        </Trash>
      </ul>
    </nav>
  );
};

export default NativeNavigation;
