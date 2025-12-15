import Head from 'next/head'
import Footer from '../components/Footer'

export default function Privacy(){
  const year = new Date().getFullYear()
  return (
    <>
      <Head>
        <title>Privacy Policy | OMG</title>
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
        <h1 style={{fontWeight:600}}>Privacy Policy</h1>
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