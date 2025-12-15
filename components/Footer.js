export default function Footer(){
  const year = new Date().getFullYear()
  return (
    <footer>
      <div className="footer_the_olx_app_section">
        <picture>
          <source srcSet="/images/banners/mobile.webp" type="image/webp" />
          <img src="/images/banners/mobile.webp" alt="OMG app banner" loading="lazy" decoding="async" />
        </picture>
        <div className="footer_olx_content">
          <h1>Try The OMG App</h1>
          <h3>Buy, sell and find just about anything using the app on your mobile.</h3>
        </div>
        <div className="line"></div>
        <div className="get__your_app_today">
          <h4>Get Your App Today</h4>
          <div className="apps">
            <a href="#" aria-label="Download on the App Store"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" loading="lazy" decoding="async" style={{ width: 135, height: 'auto' }} /></a>
            <a href="#" aria-label="Get it on Google Play"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" loading="lazy" decoding="async" style={{ width: 135, height: 'auto' }} /></a>
            <a href="#" aria-label="Explore on AppGallery"><img src="/images/stores/app_gallery.svg" alt="AppGallery" loading="lazy" decoding="async" style={{ width: 120, height: 'auto' }} /></a>
          </div>
        </div>
      </div>
      <div className="footer__real">
        <div className="footer__content">
          <div className="lists">
            <ul>
              <h4>Legal</h4>
              <li><a href="/terms">Terms of Use</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/faq">FAQ</a></li>
            </ul>
          </div>
          <div className="follow_us">
            <h4>FOLLOW US</h4>
            <div className="icons">
              <i className="fa-brands fa-facebook-f"></i>
              <i className="fa-brands fa-instagram"></i>
              <i className="fa-brands fa-twitter"></i>
              <i className="fa-brands fa-instagram"></i>
            </div>
            <div className="apps">
              <a href="#" aria-label="Download on the App Store"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" style={{ width: 135, height: 'auto' }} /></a>
              <a href="#" aria-label="Get it on Google Play"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" style={{ width: 135, height: 'auto' }} /></a>
              <a href="#" aria-label="Explore on AppGallery"><img src="/images/stores/app_gallery.svg" alt="AppGallery" style={{ width: 120, height: 'auto' }} /></a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>Free Classifieds in Pakistan . © {year} OMG</p>
        </div>
      </div>
    </footer>
  )
}