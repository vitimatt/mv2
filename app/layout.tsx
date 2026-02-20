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
        <div
          className="scroll-root"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100dvh',
            minHeight: '100vh',
            overscrollBehavior: 'none',
            WebkitOverflowScrolling: 'touch',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
