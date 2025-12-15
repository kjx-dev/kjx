import Head from 'next/head'
import Footer from '../components/Footer'
import { useState } from 'react'

export default function Contact(){
  const year = new Date().getFullYear()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('General')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  function validate(){
    const e = {}
    if (!name.trim()) e.name = 'Please enter your name'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    if (!message.trim() || message.trim().length < 10) e.message = 'Message should be at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit(ev){
    ev.preventDefault()
    if (!validate()) return
    setSubmitted(true)
    setName('')
    setEmail('')
    setSubject('')
    setReason('General')
    setMessage('')
    setTimeout(()=>setSubmitted(false), 3000)
  }
  return (
    <> 
      <Head>
        <title>Contact | OMG</title>
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
      <main className="contact__main">
        <h1>Contact Us</h1>
        <p>Reach us using the details below or send a message.</p>
        <div className="contact__wrap">
          <div className="contact__card">
            <h3>Details</h3>
            <ul className="contact__meta">
              <li><i className="fa-solid fa-envelope"></i><span>support@omg.pk</span></li>
              <li><i className="fa-solid fa-phone"></i><span>+92 000 0000000</span></li>
              <li><i className="fa-solid fa-location-dot"></i><span>Pakistan</span></li>
              <li><i className="fa-regular fa-clock"></i><span>Mon–Fri, 9:00–18:00 PKT</span></li>
            </ul>
          </div>
          <form className="contact__form" onSubmit={submit}>
            <h3>Send a Message</h3>
            {submitted && (<div className="form__success">Message sent. Thank you.</div>)}
            <div className="form__row">
              <div className="form__group">
                <label className="form__label">Name</label>
                <input className="form__input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
                {errors.name && (<div className="form__error">{errors.name}</div>)}
              </div>
              <div className="form__group">
                <label className="form__label">Email</label>
                <input className="form__input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" />
                {errors.email && (<div className="form__error">{errors.email}</div>)}
              </div>
            </div>
            <div className="form__row">
              <div className="form__group">
                <label className="form__label">Subject</label>
                <input className="form__input" type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" />
              </div>
              <div className="form__group">
                <label className="form__label">Reason</label>
                <select className="form__input" value={reason} onChange={e=>setReason(e.target.value)}>
                  <option>General</option>
                  <option>Support</option>
                  <option>Feedback</option>
                  <option>Report</option>
                </select>
              </div>
            </div>
            <div className="form__group">
              <label className="form__label">Message</label>
              <textarea className="form__textarea" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Your message"></textarea>
              {errors.message && (<div className="form__error">{errors.message}</div>)}
            </div>
            <div>
              <button type="submit" className="load__more-btn">Send</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}