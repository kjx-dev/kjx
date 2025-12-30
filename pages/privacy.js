import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Privacy(){
  return (
    <>
      <Head>
        <title>Privacy Policy | OMG</title>
      </Head>
      <Header />
      <main style={{maxWidth:900, margin:'40px auto', padding:'0 16px'}}>
        <h1 style={{fontWeight:500}}>Privacy Policy</h1>
        <p>We care about your privacy. This policy explains what data we collect and how we use it.</p>
        <h3>Information We Collect</h3>
        <p>Account details you provide (name, email, phone) and content you post. Basic analytics in your browser may be used to improve experience.</p>
        <h3>How We Use Information</h3>
        <p>To operate the site, show your ads, and improve product experience. We do not sell personal data.</p>
        <h3>Cookies</h3>
        <p>Cookies help remember preferences and keep you signed in. You can clear cookies from the browser settings.</p>
        <h3>Your Choices</h3>
        <p>You can update or delete data saved in your browser at any time. For assistance, contact us.</p>
        <h3>Contact</h3>
        <p>For privacy questions, reach us via the Contact page.</p>
      </main>
      <Footer />
    </>
  )
}