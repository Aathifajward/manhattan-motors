import { getTranslations } from "next-intl/server";
import { createInquiry } from "@/lib/actions/inquiry";
import { MotionButton } from "@/components/MotionElements";
import Reveal from "@/components/Reveal";

/**
 * Value written to Inquiry.preferredContact when someone wants to sell us a
 * vehicle. Kept here so the sell CTA, the ?type=sell preselect and the option
 * itself can never drift apart.
 */
export const SELL_TYPE = "Sell";

const BLUE = "#2D7FF9";
const FIELD =
  "font-body border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none dark:[color-scheme:dark]";
const FIELD_STYLE = { borderColor: "rgba(255,255,255,0.12)", borderRadius: 0 };
const LABEL = "mm-meta text-xs uppercase tracking-widest";
const LABEL_STYLE = { color: "rgba(255,255,255,0.35)" };

/**
 * The shared inquiry form. Rendered both in the homepage contact block and on
 * /contact — the field list and the vehicle-type options live only here.
 * Copy comes from the HomePage namespace, where the form keys already lived.
 */
export default async function InquiryForm({
  locale,
  defaultType = "Any",
  slug = "",
  vehicleId = "",
  returnTo,
}: {
  locale: string;
  defaultType?: string;
  slug?: string;
  vehicleId?: string;
  /** Locale-relative path to return to after submit (defaults to the homepage). */
  returnTo?: string;
}) {
  const t = await getTranslations("HomePage");

  const types: Array<[string, string]> = [
    ["Any", t("formTypeAny")],
    ["Car", t("formTypeCar")],
    ["Truck/Van", t("formTypeTruck")],
    ["Machinery", t("formTypeMachinery")],
    ["Motorcycle", t("formTypeMotorcycle")],
    [SELL_TYPE, t("formTypeSell")],
  ];

  return (
    <form action={createInquiry} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Reveal delay={0} className="flex flex-col gap-2">
          <label htmlFor="name" className={LABEL} style={LABEL_STYLE}>{t("formName")}</label>
          <input id="name" name="name" autoComplete="name" required className={FIELD} style={FIELD_STYLE} />
        </Reveal>
        <Reveal delay={50} className="flex flex-col gap-2">
          <label htmlFor="email" className={LABEL} style={LABEL_STYLE}>{t("formEmail")}</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={FIELD} style={FIELD_STYLE} />
        </Reveal>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Reveal delay={100} className="flex flex-col gap-2">
          <label htmlFor="phone" className={LABEL} style={LABEL_STYLE}>{t("formPhone")}</label>
          <input id="phone" name="phone" autoComplete="tel" className={FIELD} style={FIELD_STYLE} />
        </Reveal>
        <Reveal delay={150} className="flex flex-col gap-2">
          <label htmlFor="preferredContact" className={LABEL} style={LABEL_STYLE}>{t("formVehicleType")}</label>
          <select
            id="preferredContact"
            name="preferredContact"
            required
            defaultValue={defaultType}
            className="font-body border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]"
            style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: 0, background: "#0a0a0a" }}
          >
            {types.map(([value, label]) => (
              <option key={value} value={value} className="dark:bg-zinc-900 dark:text-white">
                {label}
              </option>
            ))}
          </select>
        </Reveal>
      </div>

      <Reveal delay={200} className="flex flex-col gap-2">
        <label htmlFor="message" className={LABEL} style={LABEL_STYLE}>{t("formMessage")}</label>
        <textarea id="message" name="message" required rows={4} className="font-body border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none resize-none dark:[color-scheme:dark]" style={FIELD_STYLE} />
      </Reveal>

      <MotionButton
        type="submit"
        className="mm-meta mt-6 w-full py-4 text-[11px] uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-80"
        style={{ background: BLUE, borderRadius: 0 }}
      >
        {t("formSubmit")}
      </MotionButton>
    </form>
  );
}
