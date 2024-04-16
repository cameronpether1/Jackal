"use client";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { User, workspace } from "@/lib/supabase/supabase.types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCollaborators, createWorkspace } from "@/lib/supabase/queries";
import { toast, useToast } from "../ui/use-toast";
import { v4 } from "uuid";
import CollaboratorSearch from "./collaborator-search";
import { ScrollArea } from "../ui/scroll-area";
import { divMode } from "@tsparticles/engine";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const WorkspaceCreator = () => {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const router = useRouter();
  const [permissions, setPermissions] = useState(" private ");
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addCollaborator = (user: User) => {
    setCollaborators([...collaborators, user]);
  };

  const removeCollaborator = (user: User) => {
    setCollaborators(collaborators.filter((c) => c.id !== user.id));
  };

  const createItem = async () => {
    setIsLoading(true);
    const uuid = v4();
    if (user?.id) {
      const newWorkspace: workspace = {
        data: null,
        createdAt: new Date().toISOString(),
        iconId: "💼",
        id: uuid,
        inTrash: "",
        title,
        workspaceOwner: user.id,
        logo: null,
        bannerUrl: "",
      };
      if (permissions === "private") {
        toast({ title: "Success", description: "Created the workspace" });
        await createWorkspace(newWorkspace);
        router.refresh();
      }
      if (permissions === "shared") {
        toast({ title: "Success", description: "Created the workspace" });
        await createWorkspace(newWorkspace);
        await addCollaborators(collaborators, uuid);
        router.refresh();
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-4 flex-col">
      <div>
        <Label htmlFor="name" className="text-sm text-[var(--text)]">
          Name
        </Label>
        <div className="flex justify-center items-center gap-2">
          <Input
            name="name"
            value={title}
            placeholder="Dashboard Name"
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        </div>
      </div>
      <>
        <Label htmlFor="permissions" className="text-sm ">
          Permission
        </Label>
        <Select
          onValueChange={(val) => {
            setPermissions(val);
          }}
          defaultValue={permissions}
        >
          <SelectTrigger className="w-full h-26 -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                value="private"
                className="bg-[#f4f4f4] hover:bg-violet3"
              >
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Lock />
                  <article className="text-left text-[12px] flex flex-col">
                    <span>Private</span>
                    <p>
                      This is a private dashboard to organise you and your
                      thoughts all in one place.
                    </p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem
                value="shared"
                className="bg-[#f4f4f4] hover:bg-violet3 "
              >
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Share />
                  <article className="text-left text-[12px] flex flex-col">
                    <span>Shared</span>
                    <p>
                      This is a Shared dashboard. Share your thoughts, tasks and
                      to-dos with other Jackal Users
                    </p>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </>
      {permissions === "shared" && (
        <div>
          <CollaboratorSearch
            existingCollaborators={collaborators}
            getCollaborator={(user) => {
              addCollaborator(user);
            }}
          >
            <Button
              type="button"
              className="text-xs mt-4 hover:border-[#3d3d3d] hover:text-[#3d3d3d] hover:bg-slate-50 border border-[#6d6d6d] text-[#6d6d6d]"
            >
              <Plus className=" h-4 w-4 mr-3 white" />
              Add Collaborators
            </Button>
          </CollaboratorSearch>
          <div className="mt-4">
            <span className="text-xs ">
              Collaborators {collaborators.length || ""}
            </span>
            <ScrollArea className=" h-[120px] overflow-y-scroll w-full rounded-md border border-[#3d3d3d] no-scrollbar">
              {collaborators.length ? (
                collaborators.map((c) => (
                  <div
                    className="p-4 flex justify-between items-center"
                    key={c.id}
                  >
                    <div className="flex gap-4 items-center">
                      <Avatar className="h-[20px] w-[20px]">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <div className="text-xs gap-2 overflow-hidden overflow-ellipsis sm:w-[300px] w-[140px]">
                        {c.email}
                      </div>
                    </div>
                    <Button
                      className="text-xs h-5 hover:border-[#3d3d3d] hover:text-[#3d3d3d] hover:bg-zinc-50 border border-[#6d6d6d] text-[#6d6d6d]"
                      onClick={() => removeCollaborator(c)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <div className="absolute right-0 left-0 top-0 bottom-0 flex justify-center items-center">
                  <span className="text-xs text-[#6d6d6d]">
                    You Have no Collaborators Currently.
                  </span>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
      <Button
        type="button"
        disabled={
          !title ||
          (permissions === "shared" && collaborators.length === 0) ||
          isLoading
        }
        variant="secondary"
        className=" bg-[#0c0c0c] hover:bg-black text-[#f4f4f4]"
        onClick={createItem}
      >
        Create
      </Button>
    </div>
  );
};

export default WorkspaceCreator;
