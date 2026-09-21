"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createVehicle(formData: FormData) {
  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = Number(formData.get("year"));
  const mileageKm = Number(formData.get("mileageKm"));
  const priceJpy = Number(formData.get("priceJpy"));
  const transmission = formData.get("transmission") as string;
  const fuelType = formData.get("fuelType") as string;
  const condition = formData.get("condition") as string;
  const descriptionEn = formData.get("descriptionEn") as string;
  const descriptionJa = (formData.get("descriptionJa") as string) || null;

  const slugBase = `${make}-${model}-${year}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;

  await prisma.vehicle.create({
    data: {
      slug,
      make,
      model,
      year,
      mileageKm,
      priceJpy,
      transmission,
      fuelType,
      condition,
      descriptionEn,
      descriptionJa,
    },
  });

  redirect("/en/admin");
}
