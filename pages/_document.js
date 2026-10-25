import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* 1. Para sa iPhone Chrome at Safari Shortcuts / Home Screen */}
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* 2. Standard Favicon para sa Chrome, Edge, at Firefox */}
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />

        {/* 3. PWA at iOS Web App Settings */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CECTRACK" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
