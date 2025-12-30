import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState } from 'react'
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa'

export default function Contact(){
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
      <Header />
      <main className="contact__main">
        <h1>Contact Us</h1>
        <p>Reach us using the details below or send a message.</p>
        <div className="contact__wrap">
          <div className="contact__card">
            <h3>Details</h3>
            <ul className="contact__meta">
              <li><FaEnvelope /><span>support@omg.pk</span></li>
              <li><FaPhone /><span>+92 000 0000000</span></li>
              <li><FaMapMarkerAlt /><span>Pakistan</span></li>
              <li><FaClock /><span>Mon–Fri, 9:00–18:00 PKT</span></li>
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