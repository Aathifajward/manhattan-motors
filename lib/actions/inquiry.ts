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

  redirect(`/${locale}/vehicles/${slug}?sent=true`);
}
