import { hashPassword } from '../lib/auth.js'

export async function resetCategories(prisma){
  // Use raw SQL to ensure complete deletion (more reliable for SQLite)
  try {
    await prisma.$executeRawUnsafe('DELETE FROM post_bids')
    await prisma.$executeRawUnsafe('DELETE FROM post_reviews')
    await prisma.$executeRawUnsafe('DELETE FROM post_images')
    await prisma.$executeRawUnsafe('DELETE FROM favorites')
    await prisma.$executeRawUnsafe('DELETE FROM chat_messages')
    await prisma.$executeRawUnsafe('DELETE FROM post_flags')
    await prisma.$executeRawUnsafe('DELETE FROM posts')
    await prisma.$executeRawUnsafe('DELETE FROM categories')
  } catch (error) {
    // Fallback to deleteMany if raw SQL fails
    await prisma.postBid.deleteMany({})
    await prisma.postReview.deleteMany({})
    await prisma.postImage.deleteMany({})
    await prisma.favorite.deleteMany({})
    await prisma.chatMessage.deleteMany({})
    await prisma.postFlag.deleteMany({})
    await prisma.post.deleteMany({})
    await prisma.category.deleteMany({})
  }
  try{
    const cols = await prisma.$queryRaw`PRAGMA table_info(categories);`
    const hasParent = Array.isArray(cols) && cols.some(c => String(c?.name||'') === 'parent_id')
    if (!hasParent){ await prisma.$executeRawUnsafe('ALTER TABLE categories ADD COLUMN parent_id INTEGER NULL') }
  }catch(_){ }
  const groups = [
    { name:'Mobiles', icon:'fa-mobile-screen', children:[
      'Mobile Phones','Accessories','Tablets','Smart Watches','Landline Phones'] },
    { name:'Vehicles', icon:'fa-car', children:[
      'Cars','Cars Accessories','Spare Parts','Car Care','Buses, Vans & Trucks','Rickshaw & Chingchi','Tractors & Trailers','Oil & Lubricants','Cars on Installments','Boats','Other Vehicles'] },
    { name:'Property for Sale', icon:'fa-house', children:[
      'Land & Plots','Houses','Apartments & Flats','Shops - Offices - Commercial Space','Portions & Floors'] },
    { name:'Property for Rent', icon:'fa-key', children:[
      'Apartments & Flats','Houses','Portions & Floors','Shops - Offices - Commercial Space','Rooms','Roommates & Paying Guests','Vacation Rentals - Guest Houses','Land & Plots'] },
    { name:'Electronics & Home Appliances', icon:'fa-tv', children:[
      'Computers & Accessories','Televisions & Accessories','Generators, UPS & Power Solutions','Games & Entertainment','Cameras & Accessories','Kitchen Appliances','Heaters & Geysers','Video-Audios','Refrigerators & Freezers','AC & Coolers','Other Home Appliances','Washing Machines & Dryers','Tools & DIY Equipment','Fans','Microwaves & Ovens','Sewing Machines','Irons & Steamers','Water Dispensers','Air Purifiers & Humidifiers'] },
    { name:'Bikes', icon:'fa-motorcycle', children:[
      'Motorcycles','Bicycles','Spare Parts','Scooters','Bikes Accessories','ATV & Quads','Bike Care'] },
    { name:'Business, Industrial & Agriculture', icon:'fa-industry', children:[
      'Other Business & Industry','Food & Restaurants','Medical & Pharma','Trade & Industrial Machinery','Business for Sale','Construction & Heavy Machinery','Agriculture'] },
    { name:'Services', icon:'fa-paint-roller', children:[
      'Other Services','Car Rental','Tuitions & Academies','Home & Office Repair','Domestic Help','Web Development','Event Services','Electronics & Computer Repair','Farm & Fresh Food','Construction Services','Travel & Visa','Drivers & Taxi','Consultancy Services','Movers & Packers','Video & Photography','Architecture & Interior Design','Health & Beauty','Camera Installation','Renting Services','Car Services','Insurance Services','Catering & Restaurant','Tailor Services'] },
    { name:'Jobs', icon:'fa-briefcase', children:[
      'Other Jobs','Online','Part Time','Sales','Restaurants & Hospitality','Customer Service','Marketing','Domestic Staff','Medical','Education','Accounting & Finance','Delivery Riders','Graphic Design','IT & Networking','Manufacturing','Clerical & Administration','Hotels & Tourism','Engineering','Content Writing','Security','Real Estate','Human Resources','Internships','Advertising & PR','Architecture & Interior Design'] },
    { name:'Animals', icon:'fa-dove', children:[
      'Hens','Cats','Parrots','Pet Food & Accessories','Dogs','Livestock','Pigeons','Fish','Finches','Rabbits','Other Birds','Ducks','Fertile Eggs','Doves','Other Animals','Peacocks','Horses'] },
    { name:'Furniture & Home Decor', icon:'fa-chair', children:[
      'Beds & Wardrobes','Sofa & Chairs','Other Household Items','Home Decoration','Tables & Dining','Office Furniture','Garden & Outdoor','Bathroom Accessories','Painting & Mirrors','Home DIY & Renovations','Lighting','Curtains & Blinds','Rugs & Carpets','Kitchen Essentials','Home Essentials'] },
    { name:'Fashion & Beauty', icon:'fa-person-dress', children:[
      'Clothes','Wedding','Watches','Skin & Hair','Footwear','Jewellery','Bags','Fragrance','Fashion Accessories','Bath & Body','Makeup','Other Fashion','DIY Jewellery'] },
    { name:'Books, Sports & Hobbies', icon:'fa-book', children:[
      'Books & Magazines','Gym & Fitness','Sports Equipment','Arts & Crafts','Other Hobbies','Musical Instruments','Camping & Hiking','Collectables','Crafts & DIY Supplies','Calendars'] },
    { name:'Kids', icon:'fa-child', children:[
      'Toys','Kids Vehicles','Baby Gear','Swings & Slides','Kids Accessories','Kids Clothing','Kids Furniture','Bath & Diapers'] }
  ]
  const created = []
  for (const g of groups){
    // Check if parent already exists, if so use it, otherwise create
    let parent = await prisma.category.findFirst({ where: { name: g.name, parent_id: null } })
    if (!parent) {
      parent = await prisma.category.create({ data:{ name:g.name, description:'', icon:g.icon, parent_id: null } })
    }
    
    for (const c of g.children){
      // Check if child already exists, if so skip, otherwise create
      const existing = await prisma.category.findFirst({ where: { name: c } })
      if (!existing) {
        const child = await prisma.category.create({ data:{ name:c, description:'', icon:'fa-tags', parent_id: parent.category_id } })
        created.push(child)
      } else {
        // Update existing category to have the correct parent_id if it doesn't have one
        if (!existing.parent_id) {
          await prisma.category.update({ where: { category_id: existing.category_id }, data: { parent_id: parent.category_id } })
        }
        created.push(existing)
      }
    }
    created.push(parent)
  }
  return created
}

export async function seedDemo(prisma){
  // Create default admin user
  const adminEmail = 'kamransuleman9@gmail.com'
  const adminPassword = 'Fireon5253'
  const adminUsername = adminEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'admin'
  
  // Check if admin user already exists, if not create it
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!adminUser) {
    adminUser = await prisma.user.create({ 
      data: { 
        username: adminUsername, 
        email: adminEmail, 
        password_hash: hashPassword(adminPassword),
        role: 'admin'
      } 
    })
  } else {
    // Update existing user to admin if not already
    if (adminUser.role !== 'admin') {
      adminUser = await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'admin', password_hash: hashPassword(adminPassword) }
      })
    }
  }
  
  // Create demo users
  const u1 = await prisma.user.create({ data: { username:'alice', email:'alice@example.com', password_hash:hashPassword('alice123') } })
  const u2 = await prisma.user.create({ data: { username:'bob', email:'bob@example.com', password_hash:hashPassword('bob123') } })
  
  // Use existing categories instead of creating new ones (they should already exist from resetCategories)
  const allCats = await prisma.category.findMany()
  const getId = (name) => allCats.find(c=>c.name===name)?.category_id
  
  // Only create categories that don't exist yet
  const catsToCreate = [
    { name:'House', description:'Property listings', icon:'fa-house' },
    { name:'Motercycles', description:'Bikes and motorcycles', icon:'fa-motorcycle' },
    { name:'Tv - Video - Audio', description:'Electronics & Home Appliances', icon:'fa-tv' },
    { name:'Land & Plots', description:'Property for sale', icon:'fa-map-location-dot' },
    { name:'Animals', description:'Pets & animals', icon:'fa-dove' },
    { name:'Furniture', description:'Home & office furniture', icon:'fa-chair' },
    { name:'Fashion & Beauty', description:'Clothing & accessories', icon:'fa-person-dress' },
    { name:'Books, Sports & Hobbies', description:'Leisure & hobbies', icon:'fa-book' },
    { name:'Kids', description:'Kids items', icon:'fa-child' },
    { name:'Business', description:'Industrial & business', icon:'fa-industry' },
  ].filter(cat => !allCats.some(existing => existing.name === cat.name))
  
  const newCats = await Promise.all(
    catsToCreate.map(cat => 
      prisma.category.create({ data: cat })
    )
  )
  const cats = [...allCats, ...newCats]
  
  // Posts seeding removed - no default posts will be created
  return { users:[adminUser, u1, u2], categories:cats, posts:[] }
}