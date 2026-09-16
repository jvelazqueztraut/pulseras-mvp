import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-panel">
      <h1 className="empty-title">Device not found</h1>
      <p className="empty-copy">This device is hidden or is not in the current scan.</p>
      <Link href="/" className="btn-primary">
        Back to nearby devices
      </Link>
    </div>
  );
}
