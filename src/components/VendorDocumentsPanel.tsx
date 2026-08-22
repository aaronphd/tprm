import type { VendorDocument } from "@prisma/client";
import { addVendorDocument, deleteVendorDocument } from "@/lib/actions/documents";
import { formatDate } from "@/lib/format";
import { Card, EmptyState, buttonPrimary, inputClass, labelClass } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export function VendorDocumentsPanel({
  vendorId,
  documents,
}: {
  vendorId: string;
  documents: VendorDocument[];
}) {
  const addAction = addVendorDocument.bind(null, vendorId);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Documents &amp; Evidence</h2>
      </div>

      <Card className="mb-4 p-5">
        <p className="mb-3 text-xs text-slate-500">
          Links out to evidence that lives elsewhere — a signed DPA, insurance certificate, SOC 2
          report, or a full ISO 27001/SOC 2 readiness workbook from a separate tool. This app stores
          the reference, not the file.
        </p>
        <form action={addAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. SOC 2 Type II report (2026)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <input type="text" name="url" required placeholder="https://…" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes (optional)</label>
            <input type="text" name="notes" placeholder="Where it lives, who to ask, expiry, etc." className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonPrimary}>
              Add document
            </button>
          </div>
        </form>
      </Card>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents linked"
          description="Add a link to a signed DPA, insurance certificate, SOC 2 report, or compliance workbook."
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  {doc.title}
                </a>
                <p className="truncate text-xs text-slate-500">{doc.url}</p>
                {doc.notes ? <p className="mt-0.5 text-xs text-slate-500">{doc.notes}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                <form action={deleteVendorDocument.bind(null, doc.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Remove the link to "${doc.title}"?`}
                    className="text-xs text-red-600 underline underline-offset-2 hover:text-red-800"
                  >
                    Remove
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}
