import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Standard Favicon & Shortcut Icon para sa tanang Mobile Browsers */}
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" type="image/png" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo.png" />

        {/* Apple iOS WebKit Icons (iPhone Chrome & Safari Tab Bar / Bookmarks) */}
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon-precomposed" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/logo.png" />

        {/* Web App Manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* iOS Mobile Web App Settings */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CECTRACK" />
        <meta name="application-name" content="CECTRACK" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#15803d" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
