import Head from 'next/head'
import Footer from '../components/Footer'

export default function FAQ(){
  const year = new Date().getFullYear()
  return (
    <>
      <Head>
        <title>FAQ | OMG</title>
      </Head>
      <div className="same__color">
        <div className="small__navbar">
          <div className="small__navbar_logo">
            <a href="/">
              <svg height="20" viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.9 1.9 1.9v3.27z"></path></svg>
            </a>
          </div>
          <div className="actions__links"></div>
        </div>
      </div>
      <main style={{maxWidth:900, margin:'40px auto', padding:'0 16px'}}>
        <h1 style={{fontWeight:600}}>Frequently Asked Questions</h1>
        <h3>How do I post an ad?</h3>
        <p>Click the + Sell button, fill in the details, and publish. Your ad appears instantly.</p>
        <h3>How can I edit or delete my ad?</h3>
        <p>Open Manage, locate the ad, and use Edit or Delete actions.</p>
        <h3>How do I contact a seller?</h3>
        <p>Open the ad and use the available contact options. Share only necessary information.</p>
        <h3>How do I find items near me?</h3>
        <p>Use the header search and location input to filter results.</p>
        <h3>Is OMG free?</h3>
        <p>Yes, posting and browsing are free in this demo.</p>
        <h3>Safety tips</h3>
        <p>Meet in public places, verify items, and avoid prepayments to unknown parties.</p>
      </main>
      <Footer />
    </>
  )
}