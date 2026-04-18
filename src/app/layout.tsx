import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import FloatingFlowers from '@/components/FloatingFlowers';
import ChatWidget from '@/components/ChatWidget';
import VoiceToggle from '@/components/VoiceToggle';
import AdminFloatingButton from '@/components/AdminFloatingButton';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Cloudiezzz — Custom Songs, Made With Love',
  description:
    'Order a custom song for any occasion. Personalized lyrics, professional production, and heartfelt melodies made just for you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ec4899" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Modak&family=Dancing+Script:wght@500;600;700&family=Fredoka:wght@300;400;500;600;700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ErrorBoundary>
          <ErrorBoundary>
            <FloatingFlowers />
          </ErrorBoundary>
          <Nav />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ErrorBoundary>
            <ChatWidget />
          </ErrorBoundary>
          <VoiceToggle />
          <AdminFloatingButton />
        </ErrorBoundary>
      </body>
    </html>
  );
}
