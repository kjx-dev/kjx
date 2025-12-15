import Head from 'next/head'
import Footer from '../components/Footer'

export default function Terms(){
  const year = new Date().getFullYear()
  return (
    <>
      <Head>
        <title>Terms of Use | OMG</title>
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
        <h1 style={{fontWeight:600}}>Terms of Use</h1>
        <p>By accessing or using OMG Pakistan, you agree to these terms.</p>
        <h3>Posting</h3>
        <p>Posts must be accurate, lawful, and comply with local regulations. We may moderate content that violates these rules.</p>
        <h3>Transactions</h3>
        <p>All transactions are between buyer and seller. OMG is not a party to any sale and does not provide guarantees.</p>
        <h3>Data</h3>
        <p>For this demo, data is stored locally in your browser and may be cleared at any time.</p>
        <h3>Liability</h3>
        <p>OMG is provided as-is without warranties. We are not liable for losses resulting from site usage.</p>
      </main>
      <Footer />
    </>
  )
}