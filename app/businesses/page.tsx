import { redirect } from "next/navigation";

export default function BusinessesRedirect() {
  redirect("/entities?filter=businesses");
}
