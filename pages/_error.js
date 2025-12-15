import React from 'react'
import Head from 'next/head'

function Error({ statusCode }) {
  return (
    <>
      <Head>
        <title>Error {statusCode} | OMG</title>
      </Head>
      <div style={{padding:'40px 20px', textAlign:'center', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
        <h1 style={{fontSize:'48px', fontWeight:700, color:'#012f34', marginBottom:16}}>
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </h1>
        <p style={{fontSize:'18px', color:'rgba(0,47,52,.84)', marginBottom:24}}>
          {statusCode === 404 
            ? 'The page you are looking for does not exist.'
            : 'Something went wrong. Please try again later.'}
        </p>
        <a href="/" className="btn btn--primary" style={{padding:'12px 24px', fontSize:'16px', textDecoration:'none', display:'inline-block'}}>
          Go to Homepage
        </a>
      </div>
    </>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error





