import Image from 'next/image'

export default function BannerAd({ src = "/images/banners/ad.jpg", alt = "Exclusive offers", width = 1300, height = 240 }) {
  return (
    <div className="ad" role="img" aria-label={alt}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 1100px"
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  )
}


