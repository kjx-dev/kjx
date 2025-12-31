import { useRouter } from 'next/router'

export default function Logo({ height = 32, style = {} }) {
  const router = useRouter()
  
  return (
    <a 
      href="/" 
      onClick={(e) => { 
        e.preventDefault()
        router.push('/') 
      }} 
      style={{
        display: 'inline-block', 
        textDecoration: 'none',
        ...style
      }}
      aria-label="KJX Logo - Go to homepage"
    >
      <svg 
        height={height} 
        viewBox="0 0 80 30" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        aria-label="KJX Logo"
        style={{ display: 'block' }}
      >
        <text 
          x="2" 
          y="26" 
          fontFamily="'Arial Black', 'Arial Bold', Arial, sans-serif" 
          fontSize="27" 
          fontWeight="900" 
          fill="#f55100" 
          fontStyle="italic" 
          transform="skewX(0)"
        >
          KJX
        </text>
      </svg>
    </a>
  )
}
