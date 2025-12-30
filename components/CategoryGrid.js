import { useRouter } from 'next/router'
import { getOrderedCategories, getCategoryIconComponent } from '../lib/categoryUtils'

export default function CategoryGrid({ catTiles, catGroups, catsExpanded, setCatsExpanded }) {
  const router = useRouter()

  const orderedCats = getOrderedCategories(catTiles, catGroups)
  const displayCats = catsExpanded ? orderedCats : orderedCats.slice(0, 21)

  if (displayCats.length === 0) {
    return (
      <section className="home__categories" aria-labelledby="home-cats-title">
        <div className='container-width'>
          <h2 id="home-cats-title">Browse by category</h2>
          <div className="home__categories-grid">
            <div className="loading-categories">Loading categories...</div>
          </div>
        </div>
      </section>
    )
  }

  const total = catTiles.length
  const seen = new Set(catTiles.map(t=>String(t.label||t.k||'').toLowerCase()))
  const uniqCount = seen.size

  return (
    <section className="home__categories" aria-labelledby="home-cats-title">
      <div className='container-width'>
        <h2 id="home-cats-title">Browse by category</h2>
        <div className="home__categories-grid">
          {displayCats.map((c, i) => {
            if (!c || !c.k) return null
            const slug = String(c.k || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            const IconComponent = getCategoryIconComponent(c)
            return (
              <a
                key={(c.label || c.k || '') + ':' + i}
                className="cat__card"
                href={'/category/' + slug}
                aria-label={c.displayLabel || c.label || c.k}
                onClick={(e) => { e.preventDefault(); router.push('/category/' + slug) }}
              >
                <div className="cat__icon">
                  {IconComponent ? <IconComponent /> : null}
                </div>
                <div className="cat__label">{c.displayLabel || c.k}</div>
              </a>
            )
          })}
        </div>
        {!catsExpanded && uniqCount > 21 && (
          <div className="view-more-container">
            <button className="load__more-btn" onClick={()=>setCatsExpanded(true)}>View more</button>
          </div>
        )}
      </div>
    </section>
  )
}


