import { definePaywall } from "superwall/config";

export default definePaywall({
  name: "Biblemates Pro",

  /** Behind the content when iOS rubber-bands: the same colours as --color-bg in design/tokens.css. */
  background: { light: "#f3f2f2", dark: "#1b1a18" },

  /** Store product IDs (App Store Connect). Price, period and trial come from the store at runtime. */
  products: {
    annual: "com.gabeinf.biblemates.pro.annual",
    monthly: "com.gabeinf.biblemates.pro.monthly",
  },
});
