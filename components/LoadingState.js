export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div style={{
      textAlign:'center', 
      padding:'80px 20px',
      background:'#fff',
      borderRadius:'16px',
      boxShadow:'0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'48px', color:'#f55100'}}></i>
      <p style={{marginTop:'20px', color:'rgba(0,47,52,.7)', fontSize:'16px', fontWeight:500}}>{message}</p>
    </div>
  )
}

