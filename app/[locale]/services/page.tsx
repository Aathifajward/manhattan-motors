import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const t = await getTranslations("ServicesPage");

  const services = [
    {
      title: t("sourcing"),
      desc: t("sourcingDesc"),
      icon: "🔍"
    },
    {
      title: t("documentation"),
      desc: t("documentationDesc"),
      icon: "💴"
    },
    {
      title: t("inspection"),
      desc: t("inspectionDesc"),
      icon: "✅"
    },
    {
      title: t("shipping"),
      desc: t("shippingDesc"),
      icon: "🤝"
    },
    {
      title: t("parts"),
      desc: t("partsDesc"),
      icon: "⚙️"
    }
  ];

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-zinc-900/50 min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-6 py-24">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-2xl bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900/50"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-50 text-3xl dark:bg-zinc-800/50">
                {service.icon}
              </div>
              <h2 className="mb-3 text-2xl font-bold text-black dark:text-white">{service.title}</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
