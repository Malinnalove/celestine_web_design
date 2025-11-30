import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Not found</h1>
      <p className="text-sm text-slate-600">
        This post does not exist or may have been removed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Back to home
      </Link>
    </div>
  );
}
