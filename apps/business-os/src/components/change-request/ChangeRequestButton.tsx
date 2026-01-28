/**
 * Change Request Button and Modal
 *
 * Allows users to request changes to plan/people documents
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ChangeRequestButtonProps {
  documentType: "plan" | "people";
  documentPath: string;
  businessCode?: string;
}

interface ChangeRequestFormData {
  description: string;
  anchor?: string;
}

export function ChangeRequestButton({
  documentType,
  documentPath,
  businessCode,
}: ChangeRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<ChangeRequestFormData>({
    description: "",
    anchor: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Determine business from documentType
      const business = businessCode || "PLAT"; // Default to PLAT for people doc

      // Create change request as a special idea
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business,
          content: `# Change Request: ${documentType === "plan" ? `${business} Plan` : "People Doc"}

## Requested Change

${formData.description}

${formData.anchor ? `## Target Section\n\nAnchor: \`#${formData.anchor}\`\n` : ""}

## Document

Target: \`${documentPath}\`
${formData.anchor ? `Section: \`#${formData.anchor}\`\n` : ""}

---

*This is a change request. Pete or an agent will review and implement the requested changes.*
`,
          tags: ["change-request", documentType, ...(formData.anchor ? ["has-anchor"] : [])],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit change request");
      }

      const data = await response.json();

      setSuccess(true);

      // Close modal after short delay and refresh
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setFormData({ description: "", anchor: "" });
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Request Change
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => !isSubmitting && setIsOpen(false)}
            />

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {success ? (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Change Request Submitted
                  </h3>
                  <p className="text-sm text-gray-600">
                    Pete or an agent will review your request and make the changes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Request Change to{" "}
                      {documentType === "plan"
                        ? `${businessCode} Plan`
                        : "People Doc"}
                    </h3>

                    {/* Description field */}
                    <div className="mb-4">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Describe the change you&apos;d like to see *
                      </label>
                      <textarea
                        id="description"
                        required
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Example: Update the Q1 revenue target to reflect new market conditions..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Anchor field */}
                    <div className="mb-4">
                      <label
                        htmlFor="anchor"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Section anchor (optional)
                      </label>
                      <input
                        type="text"
                        id="anchor"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="strategy"
                        value={formData.anchor}
                        onChange={(e) =>
                          setFormData({ ...formData, anchor: e.target.value })
                        }
                        disabled={isSubmitting}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        The heading ID from the URL (e.g., &ldquo;strategy&rdquo; for
                        #strategy)
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.description.trim()}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
