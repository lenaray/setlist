import '../styles/globals.css'; // Ensure you have your global CSS imported
import { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;