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
        // Use the same endpoint as sell page to get groups with subchildren
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCatTiles(payload.tiles || [])
        // Get groups from the same endpoint (includes subchildren)
        setCatGroups(payload.groups || [])
      }catch(e){ 
        setCatTiles([])
        setCatGroups([]) 
      }
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
        if (groups.length === 0) return null
        
        // Dynamically organize groups into columns (max 4 columns)
        const maxColumns = 4
        const itemsPerColumn = Math.ceil(groups.length / maxColumns)
        const columns = []
        for (let i = 0; i < maxColumns; i++) {
          const start = i * itemsPerColumn
          const end = start + itemsPerColumn
          const columnGroups = groups.slice(start, end).filter(gr => gr && gr.parent && gr.children && gr.children.length > 0)
          if (columnGroups.length > 0) {
            columns.push(columnGroups)
          }
        }
        
        return (
          <div ref={allCatMenuRef} className={`all-cat-menu ${allCatOpen ? '' : 'hidden'}`}>
            <div className="all-cat-menu-content">
              <div className="all-cat-menu-grid">
                {columns.map((columnGroups, ci) => (
                  <div key={'col:'+ci}>
                    {columnGroups.map(gr => {
                      if (!gr || !gr.parent || !gr.children || gr.children.length === 0) return null
                      return (
                        <div key={gr.parent.category_id || gr.parent.name} className="all-cat-group">
                          <div className="all-cat-group-title">{gr.parent.name}</div>
                          <ul className="all-cat-group-list">
                            {gr.children.map(ch => {
                              // Check if this child has subchildren
                              const hasSubchildren = ch.subchildren && Array.isArray(ch.subchildren) && ch.subchildren.length > 0
                              const s = String(ch.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                              return (
                                <li key={ch.category_id || ch.name} className="all-cat-group-item">
                                  <a 
                                    href={'/category/'+s} 
                                    className="all-cat-group-link" 
                                    onClick={(e)=>{ 
                                      e.preventDefault()
                                      setAllCatOpen(false)
                                      router.push('/category/'+s) 
                                    }}
                                  >
                                    {ch.name}
                                  </a>
                                  {/* Show subchildren if they exist */}
                                  {hasSubchildren && (
                                    <ul className="all-cat-subchildren-list">
                                      {ch.subchildren.map(subch => {
                                        const subS = String(subch.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                                        return (
                                          <li key={subch.category_id || subch.name} className="all-cat-subchildren-item">
                                            <a 
                                              href={'/category/'+subS} 
                                              className="all-cat-subchildren-link" 
                                              onClick={(e)=>{ 
                                                e.preventDefault()
                                                setAllCatOpen(false)
                                                router.push('/category/'+subS) 
                                              }}
                                            >
                                              {subch.name}
                                            </a>
                                          </li>
                                        )
                                      })}
                                    </ul>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    })}
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

