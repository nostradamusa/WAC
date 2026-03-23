import { redirect } from "next/navigation";

export default function EventsCreateRedirectPage() {
  redirect("/events/new");
}
