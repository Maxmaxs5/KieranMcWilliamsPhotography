import Head from 'next/head';

import '../styles/index.scss';
import '../styles/index.css';
import '../styles/index2.css';

import type { AppProps } from 'next/app';


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0" />

        {/* TODO: CHANGE TO BE PER PAGE? */}

        <title>Kieran McWilliams Photography</title>
        <meta name="description" content="Welcome to my photography website! I hope you enjoy your stay!" />

        <meta property="og:title" content="Kieran McWilliams Photography Website" />
        <meta property="og:image" content="https://kieranmcwilliams.com/Kieran_McWilliams_Website_Image.png" />
        <meta property="og:description" content="Welcome to my photography website! I hope you enjoy your stay!" />

        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/Gotham-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>

      <Component {...pageProps} />
    </>
  )
}
export default MyApp
