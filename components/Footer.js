import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa'

export default function Footer(){
  const year = new Date().getFullYear()
  return (
    <footer>
      <div className="footer__real">
        <div className="footer__content">
          <div className="lists">
            <ul>
              <h4>Popular</h4>
              <li><a href="/category/mobile-phones">Mobile Phones</a></li>
              <li><a href="/category/cars">Cars</a></li>
              <li><a href="/category/house">Property</a></li>
              <li><a href="/category/tv-video-audio">TV & Video</a></li>
              <li><a href="/category/jobs">Jobs</a></li>
            </ul>
          </div>  
          <div className="lists">
            <ul>
              <h4>Trending</h4>
              <li><a href="/category/motercycles">Motorcycles</a></li>
              <li><a href="/category/tablets">Tablets</a></li>
              <li><a href="/category/services">Services</a></li>
              <li><a href="/category/furniture">Furniture</a></li>
              <li><a href="/category/land-plots">Land & Plots</a></li>
            </ul>
          </div>
          <div className="lists">
            <ul>
              <h4>More</h4>
              <li><a href="/category/fashion">Fashion</a></li>
              <li><a href="/category/books">Books</a></li>
              <li><a href="/category/animals">Animals</a></li>
              <li><a href="/category/kids">Kids</a></li>
              <li><a href="/category/business">Business</a></li>
            </ul>
          </div>
          <div className="lists">
            <ul>
              <h4>About Us</h4>
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
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook" className="social-icon">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="social-icon">
                <FaInstagram />
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter" className="social-icon">
                <FaTwitter />
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on LinkedIn" className="social-icon">
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>Free Classifieds in Pakistan . © {year} KJX</p>
        </div>
      </div>
    </footer>
  )
}