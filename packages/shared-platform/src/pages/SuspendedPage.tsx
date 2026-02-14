import Link from "next/link";

interface SuspendedPageProps {
  /**
   * Support email for the app
   * @default "support@uxic.ai"
   */
  supportEmail?: string;
}

export default function SuspendedPage({
  supportEmail = "support@uxic.ai",
}: SuspendedPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Account Suspended
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been suspended and you cannot access the dashboard at this time.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Need to resolve this?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            If you believe this is a mistake or would like to discuss your account status, please contact our support team.
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Contact Support
          </a>
        </div>

        <div className="text-center text-sm text-gray-500">
          <Link
            href="/"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
