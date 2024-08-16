export const dynamic = "force-dynamic";
import { getFolderDetails, init } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import NoteCard from "../../../../components/NoteCard";
// import { fakeData as response } from "../../../../lib/providers/fakeData";

const Folder = async ({ params }: { params: { folderId: string } }) => {
  const { data, error } = await getFolderDetails(params.folderId);
  if (error || !data.length) redirect("/notedashboard");

  const { response } = await init(params.folderId);

  return (
    <div className="relative ">
      {response.map((note) => (
        <NoteCard note={note} key={note.id} />
      ))}
    </div>
  );
};

export default Folder;
