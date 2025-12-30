import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function FAQ(){
  return (
    <>
      <Head>
        <title>FAQ | OMG</title>
      </Head>
      <Header />
      <main style={{maxWidth:900, margin:'40px auto', padding:'0 16px'}}>
        <h1 style={{fontWeight:500}}>Frequently Asked Questions</h1>
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