import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { createInquiry } from "@/lib/actions/inquiry";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;
  const t = await getTranslations("HomePage");

  let featuredVehicles: any[] = [];
  try {
    const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (retries > 0) {
          console.warn(`Database connection failed, retrying in 1.5s... (${retries} retries left)`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return fetchWithRetry(fn, retries - 1);
        }
        throw err;
      }
    };

    featuredVehicles = await fetchWithRetry(() =>
      prisma.vehicle.findMany({
        where: { status: "available" },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { images: { where: { isCover: true }, take: 1 } },
      })
    );
  } catch (error) {
    console.error("Failed to fetch featured vehicles from database:", error);
  }

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* 1. Hero Section */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-32 text-center bg-zinc-50 dark:bg-zinc-900/50">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          {t("title")}
        </h1>
        <p className="max-w-lg text-xl text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/vehicles"
            className="rounded-lg bg-black px-8 py-3.5 font-semibold text-white transition-all hover:bg-black/80 hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            {t("browseVehicles")}
          </Link>
          <a
            href="#contact"
            className="rounded-lg bg-white px-8 py-3.5 font-semibold text-black border border-black/[.08] shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md dark:border-white/[.145] dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            {t("contactUs")}
          </a>
        </div>
      </section>

      {/* 2. Services Section */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("services")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: t("serviceExport"), desc: t("serviceExportDesc"), icon: "🌍" },
            { title: t("serviceDoc"), desc: t("serviceDocDesc"), icon: "📄" },
            { title: t("servicePricing"), desc: t("servicePricingDesc"), icon: "🏷️" },
            { title: t("serviceShipping"), desc: t("serviceShippingDesc"), icon: "🚢" },
          ].map((service, i) => (
            <div key={i} className="flex flex-col items-center text-center rounded-xl border border-black/[.08] bg-white p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md dark:border-white/[.145] dark:bg-zinc-900/20">
              <span className="mb-4 text-4xl">{service.icon}</span>
              <h3 className="mb-2 text-lg font-bold">{service.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Vehicle Categories */}
      <section className="bg-zinc-50 py-20 dark:bg-zinc-900/20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t("categories")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: t("catCars"), desc: t("catCarsDesc"), link: "/vehicles?category=CAR" },
              { title: t("catTrucks"), desc: t("catTrucksDesc"), link: "/vehicles?category=TRUCK&category=VAN" },
              { title: t("catMachinery"), desc: t("catMachineryDesc"), link: "/vehicles?category=MACHINERY" },
              { title: t("catMotorcycles"), desc: t("catMotorcyclesDesc"), link: "/vehicles?category=MOTORCYCLE" },
            ].map((cat, i) => (
              <Link href={cat.link} key={i} className="group flex flex-col rounded-xl border border-black/[.08] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-black/20 hover:shadow-md dark:border-white/[.145] dark:bg-zinc-800/50 dark:hover:border-white/30">
                <h3 className="mb-3 text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{cat.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Vehicles */}
      {featuredVehicles.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-3xl font-bold tracking-tight">{t("featured")}</h2>
            <Link href="/vehicles" className="group flex items-center text-sm font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
              {t("viewAll")} <span className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVehicles.map((vehicle) => (
              <Link href={`/vehicles/${vehicle.slug}`} key={vehicle.id} className="group block h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-white/[.145] dark:bg-zinc-900/20">
                  {vehicle.images[0] ? (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={vehicle.images[0].url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                      <span className="text-zinc-400">No image</span>
                    </div>
                  )}
                  
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-2 text-xl font-bold leading-tight text-black dark:text-white">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                      <p className="text-2xl font-bold text-black dark:text-white">
                        {priceFormatter.format(vehicle.priceJpy)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Location */}
      <section className="bg-zinc-50 py-20 dark:bg-zinc-900/20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t("location")}</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t("visitOffice")}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-sm dark:border-white/[.145] dark:bg-zinc-800/50">
            <div className="flex flex-col md:flex-row">
              <div className="p-8 md:w-1/3 flex flex-col justify-center">
                <h3 className="mb-4 text-xl font-bold">{t("addressLabel")}</h3>
                <p className="mb-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  3-12-5 Hitotsugi-cho<br />
                  Kariya City, Aichi Prefecture<br />
                  448-0003, Japan
                </p>
                <h3 className="mb-2 text-lg font-bold">{t("businessHours")}</h3>
                <p className="text-zinc-700 dark:text-zinc-300">{t("businessHoursValue")}</p>
              </div>
              <div className="h-64 md:h-auto md:w-2/3 bg-zinc-200">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3265.184323758064!2d137.0180295!3d35.027063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60049e6f3eb3d22b%3A0xc3194a2fa35b3!2s3-ch%C5%8Dme-12-5%20Hitotsugich%C5%8D%2C%20Kariya%2C%20Aichi%20448-0003!5e0!3m2!1sen!2sjp!4v1700000000000!5m2!1sen!2sjp" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, minHeight: "300px" }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Ready to Sell CTA */}
      <section className="bg-black py-24 text-white dark:bg-white dark:text-black">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center px-6">
          <h2 className="mb-6 text-4xl font-bold tracking-tight">{t("sellBannerTitle")}</h2>
          <a
            href="#contact"
            className="rounded-lg bg-white px-8 py-4 font-bold text-black transition-transform hover:scale-105 hover:bg-zinc-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900"
          >
            {t("contactUsNow")}
          </a>
        </div>
      </section>

      {/* 7. Contact Us */}
      <section id="contact" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 text-4xl font-bold tracking-tight">{t("contactUs")}</h2>
            <div className="flex flex-col gap-8 rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-500">LINE ID</h3>
                <a
                  href="https://line.me/ti/p/~Maz615"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#05b34c]"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" />
                  </svg>
                  Maz615
                </a>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-500">Phone</h3>
                <a href="tel:090-3959-3883" className="text-xl font-bold text-black hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                  090-3959-3883
                </a>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-500">Email</h3>
                <a href="mailto:manhattanmotors.726@gmail.com" className="text-xl font-bold text-black hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                  manhattanmotors.726@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
            {sent === "true" && (
              <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200 dark:bg-green-950 dark:border-green-900 dark:text-green-200">
                <p className="font-semibold text-sm">Thank you! Your inquiry has been sent.</p>
              </div>
            )}
            
            <form action={createInquiry} className="flex flex-col gap-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="slug" value="" />
              <input type="hidden" name="vehicleId" value="" />
              
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("formName")}</label>
                  <input name="name" required className="rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("formEmail")}</label>
                  <input name="email" type="email" required className="rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                </div>
              </div>
              
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("formPhone")}</label>
                  <input name="phone" className="rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("formVehicleType")}</label>
                  <select name="preferredContact" required className="rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                    <option value="Any">Any / General Inquiry</option>
                    <option value="Car">Car</option>
                    <option value="Truck/Van">Truck / Van</option>
                    <option value="Machinery">Machinery / Parts</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("formMessage")}</label>
                <textarea name="message" required rows={5} className="rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"></textarea>
              </div>
              
              <button type="submit" className="mt-2 w-full rounded-lg bg-black py-4 font-bold text-white transition-all hover:bg-black/80 hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-white/80">
                {t("formSubmit")}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}