// This handles the static params generation for the dynamic route
// Since we can't use both 'use client' and generateStaticParams in the same file
export async function generateStaticParams() {
  // Since we're using client-side data fetching, we don't pre-generate any specific paths
  return [];
}

export default function PoolDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 