import type { Vendor } from "@prisma/client";
import {
  DATA_CATEGORIES,
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_WEIGHTS,
  label,
  parseDataCategories,
  RISK_TIERS,
  VENDOR_STATUSES,
} from "@/lib/types";
import { buttonPrimary, buttonSecondary, inputClass, labelClass } from "@/components/ui";
import Link from "next/link";

function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function VendorForm({
  vendor,
  action,
  cancelHref,
}: {
  vendor?: Vendor;
  action: (formData: FormData) => void;
  cancelHref: string;
}) {
  const selectedCategories = parseDataCategories(vendor?.dataCategories ?? null);

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Vendor name *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={vendor?.name}
            className={inputClass}
            placeholder="e.g. Acme Cloud Hosting"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={vendor?.description ?? ""}
            className={inputClass}
            placeholder="What does this vendor do for us?"
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <input
            type="text"
            name="category"
            defaultValue={vendor?.category ?? ""}
            className={inputClass}
            placeholder="e.g. Cloud Hosting, Payroll"
          />
        </div>

        <div>
          <label className={labelClass}>Website</label>
          <input
            type="text"
            name="website"
            defaultValue={vendor?.website ?? ""}
            className={inputClass}
            placeholder="https://"
          />
        </div>

        <div>
          <label className={labelClass}>Risk tier</label>
          <select name="riskTier" defaultValue={vendor?.riskTier ?? "MEDIUM"} className={inputClass}>
            {RISK_TIERS.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={vendor?.status ?? "PROSPECTIVE"} className={inputClass}>
            {VENDOR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Internal owner</label>
          <input
            type="text"
            name="ownerName"
            defaultValue={vendor?.ownerName ?? ""}
            className={inputClass}
            placeholder="Who owns this relationship?"
          />
        </div>

        <div>
          <label className={labelClass}>Vendor contact name</label>
          <input
            type="text"
            name="contactName"
            defaultValue={vendor?.contactName ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Vendor contact email</label>
          <input
            type="email"
            name="contactEmail"
            defaultValue={vendor?.contactEmail ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contract start</label>
          <input
            type="date"
            name="contractStart"
            defaultValue={toDateInput(vendor?.contractStart)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contract end</label>
          <input
            type="date"
            name="contractEnd"
            defaultValue={toDateInput(vendor?.contractEnd)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Data sensitivity</label>
          <p className="mb-2 text-xs text-slate-500">
            What kind of data does this vendor access? Drives the inherent-risk portion of the
            unified risk score on the vendor page.
          </p>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {DATA_CATEGORIES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="dataCategories"
                  value={c}
                  defaultChecked={selectedCategories.includes(c)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                {DATA_CATEGORY_LABELS[c]}
                <span className="text-xs text-slate-400">({DATA_CATEGORY_WEIGHTS[c]})</span>
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={vendor?.notes ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className={buttonPrimary}>
          {vendor ? "Save changes" : "Add vendor"}
        </button>
        <Link href={cancelHref} className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
