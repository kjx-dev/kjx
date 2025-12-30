import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Terms(){
  return (
    <>
      <Head>
        <title>Terms of Use | OMG</title>
      </Head>
      <Header />
      <main style={{maxWidth:900, margin:'40px auto', padding:'0 16px'}}>
        <h1 style={{fontWeight:500}}>Terms of Use</h1>
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