import Head from 'next/head'
import Footer from '../components/Footer'

export default function About(){
  const year = new Date().getFullYear()
  return (
    <>
      <Head>
        <title>About Us | OMG</title>
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
        <h1 style={{fontWeight:600}}>About OMG</h1>
        <p>OMG is a simple classifieds platform that helps people in Pakistan buy and sell locally. Our focus is speed, clarity, and safety.</p>
        <h3>Our Mission</h3>
        <p>Make local trade easy and trustworthy by connecting buyers and sellers with clear listings and practical tools.</p>
        <h3>What We Offer</h3>
        <p>Browse categories, post ads quickly, and manage your listings in one place. The demo keeps things lightweight so you can explore the flow.</p>
        <h3>How It Works</h3>
        <p>Use the header search to find items, set your location, and open an ad to contact the seller. Manage your own ads from the Manage page.</p>
        <h3>Safety</h3>
        <p>Meet in public places, inspect items carefully, and avoid prepayments to unknown parties.</p>
        <h3>Contact</h3>
        <p>Questions or feedback? Visit the Contact page to reach our team.</p>
      </main>
      <Footer />
    </>
  )
}