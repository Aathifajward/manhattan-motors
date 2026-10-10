"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createInquiry(formData: FormData) {
  const vehicleId = formData.get("vehicleId") as string;
  const locale = formData.get("locale") as string;
  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const message = formData.get("message") as string;
  const preferredContact = formData.get("preferredContact") as string;

  await prisma.inquiry.create({
    data: {
      vehicleId: vehicleId || null,
      name,
      email,
      phone,
      message,
      preferredContact,
    },
  });

  // Optional: a page can ask to be returned to (e.g. /contact). Relative,
  // locale-scoped paths only — never trust it as a full URL.
  const returnTo = formData.get("returnTo") as string | null;

  if (slug) {
    redirect(`/${locale}/vehicles/${slug}?sent=true`);
  } else if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    redirect(`/${locale}${returnTo}?sent=true`);
  } else {
    redirect(`/${locale}/contact?sent=true`);
  }
}
