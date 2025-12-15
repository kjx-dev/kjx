import Head from 'next/head'
import Footer from '../components/Footer'

export default function Tips(){
  const year = new Date().getFullYear()
  return (
    <>
      <Head>
        <title>Tips for improving your ads | OMG</title>
        <meta name="description" content="Improve your ad quality and increase your chances of selling on OMG." />
      </Head>
      <div className="same__color" style={{padding:'16px 0'}}>
        <div className="sell__main" style={{marginTop:20}}>
          <h1>Tips for improving your ads and your chances of selling</h1>
          <div className="sell__grid">
            <div className="sell__card">
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Write a clear title</h4>
                <p>Include brand, model, condition and key specs to help buyers find your ad.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Add detailed description</h4>
                <p>Mention usage, accessories, defects if any, and the reason for selling to build trust.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Use quality photos</h4>
                <p>Upload clear photos from multiple angles in good lighting. Highlight important details.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Set a fair price</h4>
                <p>Check similar listings and price competitively. Mention if price is negotiable.</p>
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:12}}>
                <h4>Choose the right category</h4>
                <p>Select the most accurate category to improve visibility and search relevance.</p>
              </div>
            </div>
            <div className="sell__card sell__aside">
              <div className="sell__section">
                <h4>Related</h4>
                <ul style={{textAlign:'left'}}>
                  <li><a href="/posting-ads">All you need to know about Posting Ads</a></li>
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