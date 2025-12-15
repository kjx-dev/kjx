import Head from 'next/head'
import Footer from '../components/Footer'

export default function PostingAds(){
  const year = new Date().getFullYear()
  return (
    <>
      <Head>
        <title>All you need to know about Posting Ads | OMG</title>
        <meta name="description" content="Guidelines for posting ads on OMG, including content, images and pricing." />
      </Head>
      <div className="same__color" style={{padding:'16px 0'}}>
        <div className="sell__main" style={{marginTop:20}}>
          <h1>All you need to know about Posting Ads</h1>
          <div className="sell__grid">
            <div className="sell__card">
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Allowed content</h4>
                <p>Post genuine products and services. Avoid prohibited items and misleading information.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Image requirements</h4>
                <p>Use clear images without watermarks or contact details. Show actual item condition.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Pricing policy</h4>
                <p>Set realistic prices. Ads with suspicious pricing may be flagged or removed.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Safety & communications</h4>
                <p>Use in-app messaging, meet in public places, and verify items before purchase.</p>
              </div>
            </div>
            <div className="sell__card sell__aside">
              <div className="sell__section">
                <h4>Related</h4>
                <ul style={{textAlign:'left'}}>
                  <li><a href="/tips">Tips for improving your ads</a></li>
                  <li><a href="/sell">Post Your Ad</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}