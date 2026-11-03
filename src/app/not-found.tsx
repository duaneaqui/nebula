import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-5xl">That page is not on the store</h1>
      <Link href="/" className="btn btn-orange mt-6">
        Back home
      </Link>
    </div>
  );
}
