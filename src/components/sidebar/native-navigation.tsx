import { Settings2, SquareDashedMousePointer, Trash } from "lucide-react";
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";

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
      <ul className="flex flex-col gap-2">
        <li>
          <Link
            className="group/native flex text-[#090909] text-xs transition-all gap-2 items-center
          "
            href={`/notedashboard/${myWorkspaceId}`}
          >
            <SquareDashedMousePointer className="w-5 h-5" />
            <span>My Workspace</span>
          </Link>
        </li>
        <li>
          <Link
            className="group/native flex text-[#090909] text-xs transition-all gap-2 items-center
          "
            href={`/notedashboard/${myWorkspaceId}`}
          >
            <Settings2 className="w-5 h-5" />
            <span>Trash</span>
          </Link>
        </li>
        <li>
          <Link
            className="group/native flex text-[#090909] text-xs transition-all gap-2 items-center
          "
            href={`/notedashboard/${myWorkspaceId}`}
          >
            <Trash className="w-5 h-5" />
            <span>My Workspace</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NativeNavigation;
