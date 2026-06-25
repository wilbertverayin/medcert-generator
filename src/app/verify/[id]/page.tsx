import dynamic from 'next/dynamic';

const VerificationPageContent = dynamic(() => import('./VerificationPageContent'));

// Static export requires at least one param; the real ID is resolved client-side via useParams()
export async function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function VerificationPage() {
  return <VerificationPageContent />;
}
