import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-black/[.08] px-6 py-8 text-sm text-zinc-500 dark:border-white/[.145]">
      <div className="mx-auto max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>Manhattan Motors — {t("tagline")}</p>
          <p className="mt-1">© {new Date().getFullYear()} Manhattan Motors. {t("rights")}</p>
        </div>
        <div className="sm:text-right">
          <p>{t("license")}</p>
        </div>
      </div>
    </footer>
  );
}
