import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function About(){
  return (
    <>
      <Head>
        <title>About Us | OMG</title>
      </Head>
      <Header />
      <main style={{maxWidth:900, margin:'40px auto', padding:'0 16px'}}>
        <h1 style={{fontWeight:500}}>About OMG</h1>
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