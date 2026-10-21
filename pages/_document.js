import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Karaniwang Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo.png" />

        {/* Apple iOS Safari Icon (para sa iPhone browser bar) */}
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />

        {/* Web App Manifest para sa mobile browser search bar */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* Pangalan ng App sa Mobile Browser */}
        <meta name="apple-mobile-web-app-title" content="CECTRACK" />
        <meta name="application-name" content="CECTRACK" />
        <meta name="theme-color" content="#15803d" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
