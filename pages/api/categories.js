export default function handler(req, res) {
  res.status(200).json({
    categories: [
      'Mobile Phones','Cars','Motercycles','House','Tv - Video - Audio','Tablets','Land & Ports'
    ],
    tiles: [
      {k:'Mobile Phones', label:'Mobiles', icon:'fa-mobile-screen'},
      {k:'Cars', label:'Vehicles', icon:'fa-car'},
      {k:'House', label:'Property For Sale', icon:'fa-house'},
      {k:'House', label:'Property For Rent', icon:'fa-key'},
      {k:'Tv - Video - Audio', label:'Electronics & Home...', icon:'fa-camera'},
      {k:'Motercycles', label:'Bikes', icon:'fa-motorcycle'},
      {k:'Business', label:'Business, Industrial &...', icon:'fa-industry'},
      {k:'Services', label:'Services', icon:'fa-paint-roller'},
      {k:'Jobs', label:'Jobs', icon:'fa-briefcase'},
      {k:'Animals', label:'Animals', icon:'fa-dove'},
      {k:'Furniture', label:'Furniture & Home Decor', icon:'fa-chair'},
      {k:'Fashion', label:'Fashion & Beauty', icon:'fa-person-dress'},
      {k:'Books', label:'Books, Sports & Hobbies', icon:'fa-book'},
      {k:'Kids', label:'Kids', icon:'fa-child'}
    ]
  })
}