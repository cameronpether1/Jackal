import { getWorkspaceDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Workspace = async ({ params }: { params: { workspaceId: string } }) => {
  const { data, error } = await getWorkspaceDetails(params.workspaceId);
  if (error || !data.length) redirect("/dashboard");

  // const [folders, setFolders] = useState(workspaceFolders);
  // import { Folder } from "@/lib/supabase/supabase.types";

  return (
    <div className="flex flex-col justify-center items-center">
      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Workspaces</TabsTrigger>
          <TabsTrigger value="password">Dashboards</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                Here is some information about your Workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2"></CardContent>
            <CardFooter></CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Dashboards</CardTitle>
              <CardDescription>Here are your Dashboards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* {folders
                .filter((folder) => !folder.inTrash)
                .map((folder) => (
                  <Dropdown
                    key={folder.id}
                    title={folder.title}
                    listType="folder"
                    id={folder.id}
                    iconId={folder.iconId}
                  />
                ))} */}
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Workspace;
