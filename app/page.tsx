import HouseNotes from "./HouseNotes";
import { requireHouseNotesOwner } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireHouseNotesOwner("/");
  return <HouseNotes />;
}
