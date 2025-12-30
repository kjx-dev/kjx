import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render(){
    return (
      <Html lang="en">
        <Head>
          {/* Preconnect to external domains for performance */}
          <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
          <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://unpkg.com" />
          
          {/* External scripts with integrity and security */}
          <script 
            src="https://unpkg.com/sweetalert/dist/sweetalert.min.js" 
            crossOrigin="anonymous"
            defer
          />
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
            crossOrigin="anonymous" 
            referrerPolicy="no-referrer" 
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}