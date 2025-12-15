import Head from 'next/head'
import { useEffect, useState } from 'react'
import '../style.css'
import '../profile.css'
import '../sell.css'

export default function App({ Component, pageProps }) {
  const [waOpen, setWaOpen] = useState(false)
  const [waMessage, setWaMessage] = useState('Hello! I would like to chat.')
  const [waNumber, setWaNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '')
  useEffect(() => {
    try{
      const saved = localStorage.getItem('whatsappNumber') || ''
      if (!waNumber && saved) setWaNumber(saved)
    }catch(e){}
    function onOpen(e){
      const d = e.detail || {}
      if (d.message) setWaMessage(d.message)
      if (d.number) setWaNumber(d.number)
      setWaOpen(true)
    }
    window.addEventListener('whatsapp:open', onOpen)
    return () => window.removeEventListener('whatsapp:open', onOpen)
  }, [])
  function trackWhatsApp(location){
    try{
      if (window.dataLayer) window.dataLayer.push({ event:'whatsapp_click', location })
      if (window.gtag) window.gtag('event','whatsapp_click',{ location })
    }catch(e){ console.log('whatsapp_click', { location }) }
  }
  function startWhatsApp(){
    const number = (waNumber||'').replace(/[^0-9]/g,'')
    const text = encodeURIComponent(waMessage||'')
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isMobile ? (`https://wa.me/${number}?text=${text}`) : (`https://web.whatsapp.com/send?phone=${number}&text=${text}`)
    trackWhatsApp('modal')
    window.open(url, '_blank', 'noopener,noreferrer')
    setWaOpen(false)
  }
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no,email=no,address=no" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#012f34" />
        <meta property="og:site_name" content="OMG" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <title>OMG</title>
      </Head>
      <div className="site__container">
        <Component {...pageProps} />
      </div>
      {waOpen && (
        <div className="whatsapp-modal" role="dialog" aria-modal="true" aria-label="WhatsApp chat">
          <div className="whatsapp-dialog">
            <h3>Chat on WhatsApp</h3>
            <div className="whatsapp-field">
              <label htmlFor="waMessage">Message</label>
              <textarea id="waMessage" value={waMessage} onChange={e=>setWaMessage(e.target.value)} placeholder="Type your message"></textarea>
            </div>
            <div className="whatsapp-actions">
              <button className="btn" onClick={()=>setWaOpen(false)} aria-label="Cancel">Cancel</button>
              <button className="btn btn--secondary" onClick={startWhatsApp} aria-label="Start WhatsApp chat">Start Chat</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}