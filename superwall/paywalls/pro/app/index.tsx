import * as React from "react";
import {
  useActions,
  useHaptics,
  useIntroductoryOffer,
  useProducts,
  usePurchase,
  useTranslation,
  type ProductReference,
} from "superwall/hooks";
import { Button } from "@/components/Button";

const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const PLANS: ProductReference[] = ["annual", "monthly"];

export default function Index() {
  const { restore, openUrl } = useActions();
  const { getProduct } = useProducts();
  const { purchase } = usePurchase();
  const { eligible } = useIntroductoryOffer();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const [selected, setSelected] = React.useState<ProductReference>("annual");
  // One line of copy for an outcome worth saying; nothing for an abandoned sheet.
  const [notice, setNotice] = React.useState<string>();

  const annual = getProduct("annual")?.variables;
  const monthly = getProduct("monthly")?.variables;
  // Store values arrive as strings on device: Number() before any arithmetic.
  const yearly = Number(annual?.rawPrice);
  const perMonth = Number(monthly?.rawPrice);
  const percent = Math.round((1 - yearly / (perMonth * 12)) * 100);
  const save = Number.isFinite(percent) && percent > 0 ? percent : null;

  const chosen = getProduct(selected)?.variables;
  const trialDays = Number(chosen?.trialPeriodDays);
  const hasTrial = eligible === true && Number.isFinite(trialDays) && trialDays > 0;
  const price = chosen?.price;

  return (
    <main className="page">
      <div className="lede">
        <h1>{t("paywall.title")}</h1>
        <p>{t("paywall.subtitle")}</p>
      </div>

      <ul className="benefits">
        <li>{t("benefits.rhythm")}</li>
        <li>{t("benefits.circle")}</li>
        <li>{t("benefits.reflect")}</li>
      </ul>

      <div className="plans" role="radiogroup" aria-label={t("paywall.plans")}>
        {PLANS.map((plan) => {
          const v = getProduct(plan)?.variables;
          const isAnnual = plan === "annual";
          return (
            <button
              key={plan}
              type="button"
              role="radio"
              aria-checked={selected === plan}
              className="plan"
              onClick={() => {
                haptics.selection();
                setNotice(undefined);
                setSelected(plan);
              }}
            >
              <span>
                <span className="plan-name">
                  {t(`plan.${plan}`)}
                  {isAnnual && save ? <span className="badge">{t("plan.save", { percent: save })}</span> : null}
                </span>
                <span className="plan-sub" style={{ display: "block" }}>
                  {isAnnual
                    ? v?.monthlyPrice
                      ? t("plan.perMonth", { price: v.monthlyPrice })
                      : null
                    : t("plan.billedMonthly")}
                </span>
              </span>
              <span className="plan-price">{v?.price ?? null}</span>
            </button>
          );
        })}
      </div>

      <div className="actions">
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : hasTrial && price && chosen?.period ? (
          <p className="fine">{t("paywall.afterTrial", { price, period: chosen.period })}</p>
        ) : null}
        <Button
          variant="primary"
          onClick={async () => {
            haptics.light();
            setNotice(undefined);
            // Never a loading state: the store sheet is the feedback and the SDK owns it.
            const result = await purchase(selected);
            if (result.status === "completed") haptics.success(); // the SDK dismisses the paywall
            else if (result.status === "failed") setNotice(t("purchase.failed")); // iOS only; the button stays enabled
            // abandoned: the user closed the sheet — nothing changes, nothing is said
          }}
        >
          {hasTrial
            ? t("paywall.ctaTrial", { days: trialDays })
            : price
              ? t("paywall.cta", { price })
              : t("paywall.ctaBare")}
        </Button>
        <button
          type="button"
          className="link"
          onClick={async () => {
            haptics.light();
            setNotice(undefined);
            // "Nothing to restore" and a store error both resolve `failed`; the copy covers both.
            const result = await restore();
            if (result.status === "restored") haptics.success();
            setNotice(result.status === "restored" ? t("restore.restored") : t("restore.failed"));
          }}
        >
          {t("paywall.restore")}
        </button>
        <button type="button" className="link" onClick={() => openUrl(TERMS_URL)}>
          {t("paywall.terms")}
        </button>
      </div>
    </main>
  );
}
