import type { Metadata, Viewport } from 'next';
import './globals.css';
import ExpandableHeader from './components/ExpandableHeader';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'MV+MV',
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
        <div className="scroll-root">
          {children}
        </div>
      </body>
    </html>
  );
}
