export const dynamic = "force-dynamic";
import {
  getAllFolderDetails,
  getAllWorkspaceDetails,
  getWorkspaceDetails,
} from "@/lib/supabase/queries";
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
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import WorkspaceCard from "../../../components/WorkspaceCard";
import DashboardCard from "../../../components/DashboardCard";

const Workspace = async ({ params }: { params: { workspaceId: string } }) => {
  const { data, error } = await getWorkspaceDetails(params.workspaceId);
  if (error || !data.length) redirect("/dashboard");

  const { response } = await getAllWorkspaceDetails(params.workspaceId);
  if (!response.length) {
    return;
  }

  const { dashResponse } = await getAllFolderDetails(params.workspaceId);
  if (!dashResponse.length) {
    return (
      <></>
      // <div className="flex justify-center items-center mt-[100px] ">
      //   <div className="flex flex-col justify-center items-center ">
      //     <Tabs defaultValue="workspaces" className="w-[600px] ">
      //       <TabsList className="grid w-full grid-cols-2">
      //         <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
      //         <TabsTrigger value="dashboard">Dashboards</TabsTrigger>
      //       </TabsList>
      //       <TabsContent value="workspaces">
      //         <Card>
      //           <CardHeader>
      //             <CardTitle>Workspaces</CardTitle>
      //             <CardDescription>
      //               Here is some information about your Workspace
      //             </CardDescription>
      //           </CardHeader>
      //           <CardContent className="space-y-2">
      //             {response.map((space) => (
      //               <WorkspaceCard space={space} key={space.id} />
      //             ))}
      //           </CardContent>
      //           <CardFooter></CardFooter>
      //         </Card>
      //       </TabsContent>
      //       <TabsContent value="dashboard">
      //         <Card>
      //           <CardHeader>
      //             <CardTitle>Dashboards</CardTitle>
      //             <CardDescription>
      //               You appear to have no dashboards yet.
      //             </CardDescription>
      //           </CardHeader>
      //           <CardContent className="space-y-2"></CardContent>
      //           <CardFooter></CardFooter>
      //         </Card>
      //       </TabsContent>
      //     </Tabs>
      //   </div>
      // </div>
    );
  }
  return (
    <div className="flex justify-center items-center mt-[100px]">
      <div className="flex flex-col justify-center items-center">
        <Tabs defaultValue="account" className="w-[600px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Workspaces</TabsTrigger>
            <TabsTrigger value="password">Dashboards</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Workspaces</CardTitle>
                <CardDescription>
                  Here is some information about your Workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {response.map((space) => (
                  <WorkspaceCard space={space} key={space.id} />
                ))}
              </CardContent>
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
                {dashResponse.map((board) => (
                  <DashboardCard board={board} key={board.id} />
                ))}
              </CardContent>
              <CardFooter></CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Workspace;
