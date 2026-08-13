import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <p className="text-sm text-primary font-medium">404</p>
      <h1 className="font-display text-3xl font-semibold mt-2">That page is not here</h1>
      <p className="text-muted-foreground mt-2 max-w-md">The address may have expired, or the link was mistyped.</p>
      <Link href="/" className="mt-6 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm">
        Back to Haven
      </Link>
    </div>
  );
}
