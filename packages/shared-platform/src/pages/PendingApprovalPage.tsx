import Link from "next/link";

interface PendingApprovalPageProps {
  /**
   * Description of what the user will be able to do after approval
   * @example "analyzing UX designs"
   * @example "analyzing smart contracts"
   */
  activityDescription?: string;
  
  /**
   * Support email for the app
   * @default "support@uxic.ai"
   */
  supportEmail?: string;
}

export default function PendingApprovalPage({
  activityDescription = "using this platform",
  supportEmail = "support@uxic.ai",
}: PendingApprovalPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-10 w-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is awaiting admin approval before you can start {activityDescription}.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Want immediate access?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            You can bypass the approval process by adding your own API keys. This lets you use your own credits instead of waiting for approval.
          </p>
          <Link
            href="/dashboard/settings"
            className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Your API Keys
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            Need help?{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
