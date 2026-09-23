import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function Navbar() {
  const t = await getTranslations("Nav");

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <img
            src="/images/logo.png"
            alt="Manhattan Motors"
            style={{ height: "48px", width: "auto" }}
          />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/vehicles">{t("vehicles")}</Link>
          <Link href="/about">{t("about")}</Link>
          <Link href="/admin">{t("admin")}</Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
