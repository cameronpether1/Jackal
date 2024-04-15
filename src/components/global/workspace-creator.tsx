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
import { Lock, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCollaborators, createWorkspace } from "@/lib/supabase/queries";
import { toast } from "../ui/use-toast";
import { v4 } from "uuid";

const WorkspaceCreator = () => {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const [permissions, setPermissions] = useState(" private ");
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState<User[]>([]);

  const addCollaborator = (user: User) => {
    setCollaborators([...collaborators, user]);
  };

  const removeCollaborator = (user: User) => {
    setCollaborators(collaborators.filter((c) => c.id !== user.id));
  };

  const createItem = async () => {
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
    // setIsLoading(false);
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
      {permissions === "shared" && <div></div>}
      <Button
        type="button"
        disabled={
          !title || (permissions === "shared" && collaborators.length === 0)
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
