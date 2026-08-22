import type { MaturityModel } from "./types";

// The default scale every framework in this app currently uses. Kept as a
// named, reusable model (rather than inlined per framework) so frameworks
// that share it stay in sync, while a future framework can still define its
// own MaturityModel instead of importing this one.
export const CMMI_STYLE_MATURITY: MaturityModel = {
  name: "CMMI-style maturity",
  levels: [
    { value: 0, label: "Not Implemented" },
    { value: 1, label: "Ad Hoc" },
    { value: 2, label: "Repeatable" },
    { value: 3, label: "Defined" },
    { value: 4, label: "Managed" },
    { value: 5, label: "Optimized" },
  ],
};
