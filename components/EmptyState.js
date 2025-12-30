import { FaBox } from 'react-icons/fa'

export default function EmptyState({ icon: Icon = FaBox, title, message }) {
  return (
    <div style={{
      textAlign:'center', 
      padding:'80px 20px',
      background:'#fff',
      borderRadius:'16px',
      boxShadow:'0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <div style={{
        width:'100px',
        height:'100px',
        borderRadius:'50%',
        background:'linear-gradient(135deg, #f55100 0%, #e44c00 100%)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        margin:'0 auto 24px',
        fontSize:'40px',
        color:'#fff'
      }}>
        <Icon />
      </div>
      <p style={{color:'rgba(0,47,52,.7)', fontSize:'18px', fontWeight:600, marginBottom:'8px'}}>{title}</p>
      <p style={{color:'rgba(0,47,52,.5)', fontSize:'14px'}}>{message}</p>
    </div>
  )
}

