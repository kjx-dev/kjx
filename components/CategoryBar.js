import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { FaChevronDown } from 'react-icons/fa'
import { getShortCategoryName } from '../lib/categoryNames'

export default function CategoryBar() {
  const router = useRouter()
  const [catTiles, setCatTiles] = useState([])
  const [catGroups, setCatGroups] = useState([])
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)

  useEffect(() => {
    async function loadCats(){
      try{
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCatTiles(payload.tiles || [])
        try{
          const rg = await fetch('/api/v1/categories')
          const dg = await rg.json()
          setCatGroups((dg && dg.data && dg.data.groups) || [])
        }catch(_){ setCatGroups([]) }
      }catch(e){ setCatTiles([]); setCatGroups([]) }
    }
    loadCats()
  }, [])

  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape'){ setAllCatOpen(false) } }
    function onOutside(e){
      if (allCatWrapRef.current && !allCatWrapRef.current.contains(e.target)) setAllCatOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [])

  return (
    <div className="third__navbar container-width" id="categories" ref={allCatWrapRef}>
      <div className="select__itself">
        <a href="#" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen} className="all-categories-btn">
          <span>All Categories</span>
          <FaChevronDown className={`chevron ${allCatOpen ? 'rotated' : ''}`} />
        </a>
      </div>
      <div className="links" id="links">
        {(() => {
          try {
            const order = ['mobile-phones','cars','motercycles','house','tv-video-audio','tablets','land-plots','jobs','services','furniture']
            function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
            if (!Array.isArray(catTiles) || catTiles.length === 0) return null
            const tiles = order.map(sl => catTiles.find(t => t && slug(t.k)===sl)).filter(Boolean)
            if (tiles.length === 0) return null
            return tiles.map((c, idx) => {
              if (!c || !c.k) return null
              try {
                const displayLabel = getShortCategoryName(c.shortLabel || c.label, c.k) || 'Category'
                const catSlug = slug(c.k)
                return (
                  <a 
                    key={c.k || idx} 
                    href={'/category/' + catSlug}
                    className="category-link"
                    onClick={(e) => { e.preventDefault(); router.push('/category/' + catSlug) }}
                  >
                    {displayLabel}
                  </a>
                )
              } catch(e) {
                return null
              }
            })
          } catch(e) {
            return null
          }
        })()}
      </div>
      {(() => {
        const groups = Array.isArray(catGroups) ? catGroups : []
        function byName(n){ const g = groups.find(x => String(x.parent?.name||'')===n); return g ? g : { parent:{ name:n, category_id: 'missing:'+n }, children: [] } }
        const layout = [
          [byName('Mobiles'), byName('Vehicles')],
          [byName('Bikes'), byName('Business, Industrial & Agriculture')],
          [byName('Jobs')],
          [byName('Furniture & Home Decor')]
        ]
        return (
          <div ref={allCatMenuRef} className={`all-cat-menu ${allCatOpen ? '' : 'hidden'}`}>
            <div className="all-cat-menu-content">
              <div className="all-cat-menu-grid">
                {layout.map((list,ci)=> (
                  <div key={'col:'+ci}>
                    {list.map(gr => (
                      <div key={gr.parent.category_id} className="all-cat-group">
                        <div className="all-cat-group-title">{gr.parent.name}</div>
                        <ul className="all-cat-group-list">
                          {gr.children.map(ch => {
                            const s = String(ch.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                            return (
                              <li key={ch.category_id} className="all-cat-group-item">
                                <a href={'/category/'+s} className="all-cat-group-link" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(false); router.push('/category/'+s) }}>{ch.name}</a>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

