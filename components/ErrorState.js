export default function ErrorState({ message }) {
  return (
    <div style={{
      textAlign:'center', 
      padding:'80px 20px',
      background:'#fff',
      borderRadius:'16px',
      boxShadow:'0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <i className="fa-solid fa-exclamation-circle" style={{fontSize:'48px', color:'#ef4444', marginBottom:'16px'}}></i>
      <p style={{color:'#ef4444', fontSize:'16px', fontWeight:500}}>{message}</p>
    </div>
  )
}

