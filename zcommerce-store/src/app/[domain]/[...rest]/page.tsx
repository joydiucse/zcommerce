import { notFound } from "next/navigation";

/** Any unmatched storefront URL renders the themed not-found page with a 404 status. */
export default function CatchAll() {
  notFound();
}
