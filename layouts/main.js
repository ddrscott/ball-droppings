import Head from 'next/head'
export default ({children}) => (
  <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon" />
    </Head>

    { children }

    <style jsx global>{`
      *, *::before, *::after { box-sizing: border-box }
      html, body {
        width: 100%;
        height: 100%;
        background: #33404a;
      }
    `}</style>
  </>
)
