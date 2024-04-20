"use client";
import { appFoldersType, useAppState } from "@/lib/providers/state-provider";
import { File } from "@/lib/supabase/supabase.types";
import { FileIcon, FolderIcon, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

const TrashRestore = () => {
  const { state, workspaceId } = useAppState();
  const [folders, setFolders] = useState<appFoldersType[] | []>([]);
  const [files, setFiles] = useState<File[] | []>([]);

  useEffect(() => {
    const stateFolders =
      state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.filter((folder) => folder.inTrash) || [];
    setFolders(stateFolders);

    let stateFiles: File[] = [];
    state.workspaces
      .find((workspace) => workspace.id === workspaceId)
      ?.folders.forEach((folder) => {
        folder.files.forEach((file) => {
          if (file.inTrash) {
            stateFiles.push(file);
          }
        });
      });
    setFiles(stateFiles);
  }, [state, workspaceId]);

  return (
    <section>
      {!!folders.length && (
        <>
          <h3>Folders</h3>
          {folders.map((folder) => (
            <Link
              className="hover:bg-violet4 rounded-md p-2 flex item-center justify-between"
              href={`/notedashboard/${folder.workspaceId}/${folder.id}`}
              key={folder.id}
            >
              <article className=" flex flex-nowrap">
                <aside className="flex items-center justify-start gap-2 w-[140px]">
                  <FolderIcon size={15} />
                  {folder.title}
                </aside>
                <Button className=" bg-red-800/50 border-red-800 text-red-800 relative mx-7 right-0 ">
                  Delete
                </Button>
              </article>
            </Link>
          ))}
        </>
      )}
      {!!files.length && (
        <>
          <h3>Files</h3>
          {files.map((file) => (
            <Link
              key={file.id}
              className=" hover:bg-violet4 rounded-md p-2 flex items-center justify-between"
              href={`/notedashboard/${file.workspaceId}/${file.folderId}/${file.id}`}
            >
              <article>
                <aside className="flex items-center gap-2">
                  <FileIcon size={15} />
                  {file.title}
                </aside>
                <Button className=" mx-24 ">Delete</Button>
              </article>
            </Link>
          ))}
        </>
      )}
      {!files.length && !folders.length && (
        <div
          className="
          text-muted-foreground
          absolute
          top-[50%]
          left-[50%]
          transform
          -translate-x-1/2
          -translate-y-1/2

      "
        >
          No Items in trash
        </div>
      )}
    </section>
  );
};

export default TrashRestore;
