export async function resetCategories(prisma){
  await prisma.postBid.deleteMany({})
  await prisma.postReview.deleteMany({})
  await prisma.postImage.deleteMany({})
  await prisma.favorite.deleteMany({})
  await prisma.chatMessage.deleteMany({})
  await prisma.postFlag.deleteMany({})
  await prisma.post.deleteMany({})
  await prisma.category.deleteMany({})
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
    const parent = await prisma.category.create({ data:{ name:g.name, description:'', icon:g.icon, parent_id: null } })
    for (const c of g.children){
      const child = await prisma.category.create({ data:{ name:c, description:'', icon:'fa-tags', parent_id: parent.category_id } })
      created.push(child)
    }
    created.push(parent)
  }
  return created
}

import { hashPassword } from './auth'

export async function seedDemo(prisma){
  const u1 = await prisma.user.create({ data: { username:'alice', email:'alice@example.com', password_hash:hashPassword('alice123') } })
  const u2 = await prisma.user.create({ data: { username:'bob', email:'bob@example.com', password_hash:hashPassword('bob123') } })
  const cats = await prisma.$transaction([
    prisma.category.create({ data:{ name:'Cars', description:'Vehicles and cars', icon:'fa-car' } }),
    prisma.category.create({ data:{ name:'Mobile Phones', description:'Smartphones and mobiles', icon:'fa-mobile-screen' } }),
    prisma.category.create({ data:{ name:'House', description:'Property listings', icon:'fa-house' } }),
    prisma.category.create({ data:{ name:'Motercycles', description:'Bikes and motorcycles', icon:'fa-motorcycle' } }),
    prisma.category.create({ data:{ name:'Tv - Video - Audio', description:'Electronics & Home Appliances', icon:'fa-tv' } }),
    prisma.category.create({ data:{ name:'Tablets', description:'Android & iOS tablets', icon:'fa-tablet-screen-button' } }),
    prisma.category.create({ data:{ name:'Land & Plots', description:'Property for sale', icon:'fa-map-location-dot' } }),
    prisma.category.create({ data:{ name:'Jobs', description:'Find jobs', icon:'fa-briefcase' } }),
    prisma.category.create({ data:{ name:'Animals', description:'Pets & animals', icon:'fa-dove' } }),
    prisma.category.create({ data:{ name:'Furniture', description:'Home & office furniture', icon:'fa-chair' } }),
    prisma.category.create({ data:{ name:'Fashion & Beauty', description:'Clothing & accessories', icon:'fa-person-dress' } }),
    prisma.category.create({ data:{ name:'Books, Sports & Hobbies', description:'Leisure & hobbies', icon:'fa-book' } }),
    prisma.category.create({ data:{ name:'Kids', description:'Kids items', icon:'fa-child' } }),
    prisma.category.create({ data:{ name:'Services', description:'Home & business services', icon:'fa-paint-roller' } }),
    prisma.category.create({ data:{ name:'Business', description:'Industrial & business', icon:'fa-industry' } }),
  ])
  const getId = (name) => cats.find(c=>c.name===name)?.category_id
  const posts = await prisma.$transaction([
    prisma.post.create({ data:{ title:'Toyota Corolla 2018', content:'Excellent condition, low mileage, single owner.', user_id:u1.user_id, category_id:getId('Cars') } }),
    prisma.post.create({ data:{ title:'iPhone 13 Pro', content:'Graphite, 256GB, like new.', user_id:u2.user_id, category_id:getId('Mobile Phones') } }),
    prisma.post.create({ data:{ title:'2 Bed Apartment', content:'Downtown, near metro, furnished.', user_id:u2.user_id, category_id:getId('House') } }),
    prisma.post.create({ data:{ title:'Honda CG 125 2022', content:'Genuine parts, single owner.', user_id:u1.user_id, category_id:getId('Motercycles') } }),
    prisma.post.create({ data:{ title:'LG OLED TV 55"', content:'4K Ultra HD, smart features.', user_id:u2.user_id, category_id:getId('Tv - Video - Audio') } }),
    prisma.post.create({ data:{ title:'iPad Air 4 64GB', content:'PTA approved, with box.', user_id:u1.user_id, category_id:getId('Tablets') } }),
    prisma.post.create({ data:{ title:'5 Marla Plot', content:'Prime location near boulevard.', user_id:u2.user_id, category_id:getId('Land & Plots') } }),
    prisma.post.create({ data:{ title:'Sales Executive', content:'Full-time role, 2+ years experience.', user_id:u1.user_id, category_id:getId('Jobs') } }),
    prisma.post.create({ data:{ title:'German Shepherd Puppy', content:'Vaccinated, 8 weeks old.', user_id:u2.user_id, category_id:getId('Animals') } }),
    prisma.post.create({ data:{ title:'Wooden Dining Table', content:'6 chairs included.', user_id:u1.user_id, category_id:getId('Furniture') } }),
    prisma.post.create({ data:{ title:'Designer Bridal Dress', content:'Lightly used.', user_id:u2.user_id, category_id:getId('Fashion & Beauty') } }),
    prisma.post.create({ data:{ title:'Cricket Kit', content:'Bat, pads, gloves.', user_id:u1.user_id, category_id:getId('Books, Sports & Hobbies') } }),
    prisma.post.create({ data:{ title:'Kids Cycle 14"', content:'Good condition.', user_id:u2.user_id, category_id:getId('Kids') } }),
    prisma.post.create({ data:{ title:'AC Installation Service', content:'Split AC fitting and gas refill.', user_id:u1.user_id, category_id:getId('Services') } }),
    prisma.post.create({ data:{ title:'Industrial Drill Machine', content:'3-phase, heavy duty.', user_id:u2.user_id, category_id:getId('Business') } }),
  ])
  return { users:[u1,u2], categories:cats, posts }
}