import type { Metadata } from 'next';
import './globals.css';
import ExpandableHeader from './components/ExpandableHeader';

export const metadata: Metadata = {
  title: 'Next.js + Sanity CMS',
  description: 'A Next.js application with embedded Sanity Studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ExpandableHeader />
        {children}
      </body>
    </html>
  );
}
