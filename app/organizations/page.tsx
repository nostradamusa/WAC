import { redirect } from "next/navigation";

export default function OrganizationsRedirect() {
  redirect("/entities?filter=organizations");
}
