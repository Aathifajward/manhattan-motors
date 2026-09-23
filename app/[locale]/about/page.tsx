import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-semibold">{t("title")}</h1>
      <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">{t("body")}</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
          <h2 className="mb-6 text-xl font-bold">{t("companyInfo")}</h2>
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("companyName")}</dt>
              <dd className="font-semibold text-black dark:text-white">{t("companyNameValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("businessType")}</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">{t("businessTypeValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("representative")}</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">{t("representativeValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("address")}</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">{t("addressValue")}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
          <h2 className="mb-6 text-xl font-bold">{t("contact")}</h2>
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("mobile")}</dt>
              <dd className="font-medium">
                <a href="tel:090-3959-3883" className="text-blue-600 hover:underline dark:text-blue-400">
                  090-3959-3883
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("landline")}</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">0566-93-3976</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("email")}</dt>
              <dd className="font-medium">
                <a href="mailto:manhattanmotors.726@gmail.com" className="text-blue-600 hover:underline dark:text-blue-400">
                  manhattanmotors.726@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">{t("lineId")}</dt>
              <dd className="mt-1 font-medium">
                <a
                  href="https://line.me/ti/p/~Maz615"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#05b34c]"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" />
                  </svg>
                  Maz615
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
