"use server";

import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

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

  const vehicle = await prisma.vehicle.create({
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

  const imageFiles = formData.getAll("images") as File[];
  let order = 0;

  for (const file of imageFiles) {
    if (!file || file.size === 0) continue;

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "manhattan-motos",
    });

    await prisma.vehicleImage.create({
      data: {
        vehicleId: vehicle.id,
        url: result.secure_url,
        order,
        isCover: order === 0,
      },
    });

    order++;
  }

  redirect("/en/admin");
}

export async function updateVehicleStatus(vehicleId: string, formData: FormData) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const status = formData.get("status") as string;

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status },
  });

  revalidatePath("/en/admin");
  revalidatePath("/ja/admin");
  revalidatePath("/en/vehicles");
  revalidatePath("/ja/vehicles");
}
