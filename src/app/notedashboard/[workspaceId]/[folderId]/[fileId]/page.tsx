export const dynamic = "force-dynamic";

import React from "react";
import { getFileDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";

const File = async ({ params }: { params: { fileId: string } }) => {
  const { data, error } = await getFileDetails(params.fileId);
  if (error || !data.length) redirect("/notedashboard");

  return <div className="relative ">file page</div>;
};

export default File;
