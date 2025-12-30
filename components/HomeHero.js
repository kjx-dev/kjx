import Image from 'next/image'

export default function HomeHero() {
  return (
    <section className="hero home-hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__content">
          <h1 id="hero-title">Find great deals near you</h1>
          <p>Buy, sell and discover items across Pakistan. Post your ad or browse categories to get started.</p>
          <div className="hero__actions" role="group" aria-label="Primary actions">
            <a className="btn btn--primary" href="/sell" aria-label="Post your ad">Post Your Ad</a>
            <a className="btn btn--secondary" href="#categories" aria-label="Browse categories">Browse Categories</a>
          </div>
        </div>
        <div className="hero__art" aria-hidden="true">
          <Image src="/images/banners/mobile.webp" alt="" width={640} height={380} priority sizes="(max-width: 768px) 100vw, 640px" style={{width:'100%', height:'auto'}} />
        </div>
      </div>
    </section>
  )
}

