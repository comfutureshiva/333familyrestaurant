import { useState, useEffect, useRef, useCallback } from 'react'
import logo from './assets/logo.png'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewKey = 'home' | 'about' | 'menu' | 'signature' | 'gallery' | 'locations' | 'reservation' | 'contact' | 'order' | 'privacy' | 'terms'
type DishType = 'veg' | 'chicken' | 'mutton' | 'seafood' | 'egg' | 'biryani' | 'bread' | 'tandoor' | 'soup' | 'dessert' | 'drink' | 'combo' | 'chinese'

interface FlatItem {
  id: string; name: string; type: DishType; spice: number; price: number
  desc?: string; sec: string; secTitle: string; sub: string; filters: string[]
}
interface CartEntry {
  key: string; id: string; name: string; type: DishType; portion: string
  pmult: number; base: number; extras: { n: string; p: number }[]; qty: number
}

// ─── BRAND / LOCATION CONSTANTS ────────────────────────────────────────────────
const BRAND = '333 Family Restaurant'
// WhatsApp booking — set your number with country code, digits only (India example: '919876543210').
// Leave '' and the reservation form stays a plain confirmation until a number is added.
const WHATSAPP_NUMBER = '919514800333'
const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
const MAPS_MAIN = 'https://www.google.com/maps/search/?api=1&query=333%20Family%20Restaurant%2C%20Madukkarai%20Main%20Rd%2C%20Machampalayam%2C%20Coimbatore'

// ─── DATA ─────────────────────────────────────────────────────────────────────
const RS = '₹'
const money = (n: number) => RS + n.toLocaleString('en-IN')
const GLYPH: Record<string, string> = {
  veg:'🥗',chicken:'🍗',mutton:'🍖',seafood:'🦐',egg:'🍳',biryani:'🍛',bread:'🫓',
  tandoor:'🔥',soup:'🍲',dessert:'🍮',drink:'🥤',combo:'🍱',chinese:'🍜',
}
const glyph = (t: string) => GLYPH[t] ?? '🍽️'

// Unsplash photo ids by dish type
const PHOTO: Record<string, string> = {
  hero:     '1552960226-639240203497',
  interior: '1718371985489-b75b9bdf6fcc',
  fancy:    '1753202048970-16fe8f5e55fa',
  chicken:  '1565557623262-b51c2513a641',
  mutton:   '1617692855027-33b14f061079',
  biryani:  '1728910107534-e04e261768ae',
  seafood:  '1682862279256-b2a9e4f3d22c',
  spread:   '1626508035297-0cd27c397d67',
  tray:     '1579783411194-f697db862dcd',
}
const photoUrl = (key: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${PHOTO[key] ?? PHOTO.spread}?w=${w}&h=${h}&fit=crop&auto=format`

// Per-dish photos. Each dish type has a matching keyword so no two sections share one photo.
// TIP: for the real launch, drop your own dish photos into /public and point these at them.
const DISH_KW: Record<string, string> = {
  veg: 'paneer', chicken: 'chicken', mutton: 'mutton', seafood: 'prawn', egg: 'omelette',
  biryani: 'biryani', bread: 'naan', tandoor: 'kebab', soup: 'soup', dessert: 'dessert',
  drink: 'juice', combo: 'thali', chinese: 'noodles',
}
const seedOf = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 100000 }
// A keyword photo (varies per item via a stable lock seed) — used where each card should differ.
const kwPhoto = (type: string, w: number, h: number, seed: string) =>
  `https://loremflickr.com/${w}/${h}/${DISH_KW[type] ?? 'indian,food'}?lock=${seedOf(seed)}`
// Best photo for a dish type: a curated Unsplash shot when we have one, else a keyword photo.
const dishPhoto = (type: string, w = 800, h = 600) =>
  PHOTO[type]
    ? `https://images.unsplash.com/photo-${PHOTO[type]}?w=${w}&h=${h}&fit=crop&auto=format`
    : `https://loremflickr.com/${w}/${h}/${DISH_KW[type] ?? 'indian,food'}`

type MenuSection = {
  id: string; title: string; sub?: string; filters?: string[]
  groups?: { label: string; items: (string|number)[][] }[]
  items?: (string|number)[][]
  type?: string
}

const MENU: MenuSection[] = [
  {id:'soups',title:'Soups',sub:'Slow-simmered, warming starts',filters:['South Indian'],groups:[
    {label:'Vegetarian',items:[
      ['Sweet Corn Veg Soup','veg',0,120],['Hot & Sour Veg Soup','veg',1,130],['Veg Manchow Soup','veg',1,130],
      ['Mushroom Soup','veg',0,140],['Tomato Soup','veg',0,120]]},
    {label:'Non-Vegetarian',items:[
      ['Chicken Sweet Corn Soup','chicken',0,150],['Chicken Hot & Sour Soup','chicken',1,160],
      ['Chicken Manchow Soup','chicken',1,160],['Mutton Pepper Soup','mutton',2,180,'Peppery, bone-brothed'],
      ['Mutton Bone Soup','mutton',2,190],['Nattu Kozhi Soup','chicken',2,190,'Country chicken, slow-boiled'],
      ['Aatukal Soup','mutton',2,200,'Trotters, herbs & pepper']]}
  ]},
  {id:'chicken-start',title:'Chicken Starters',sub:'Fry-shop favourites, freshly tossed',filters:[],type:'chicken',items:[
    ['Chicken 65','chicken',2,220,'Crisp, curry-leaf tossed, signature'],['Chicken Lollipop','chicken',2,240],
    ['Dragon Chicken','chicken',2,250],['Chilli Chicken','chicken',2,240],['Pepper Chicken','chicken',3,250],
    ['Garlic Chicken','chicken',1,240],['Ginger Chicken','chicken',1,240],['Schezwan Chicken','chicken',3,250],
    ['Chicken Manchurian','chicken',1,240],['Chicken Chukka','chicken',3,260,'Dry-roasted, masala coated'],
    ['Chicken Sukka','chicken',3,260],['Chicken Pallipalayam','chicken',3,270,'Kongu-style, coconut & chilli'],
    ['Kongu Chicken Fry','chicken',2,260],['Madurai Chicken Fry','chicken',3,260],
    ['Nattu Kozhi Fry','chicken',3,290,'Country chicken, pepper heavy'],['Chicken Pepper Fry','chicken',3,260]]},
  {id:'mutton-start',title:'Mutton Starters',sub:'Chettinad heat, tender cuts',filters:[],type:'mutton',items:[
    ['Mutton Chukka','mutton',3,320,'Dry, black-pepper forward, signature'],['Mutton Sukka','mutton',3,320],
    ['Mutton Pepper Fry','mutton',3,330],['Mutton Varuval','mutton',3,330],['Madurai Mutton','mutton',3,340,'Fiery Madurai masala'],
    ['Mutton Liver Fry','mutton',2,300],['Mutton Brain Fry','mutton',2,320],['Mutton Kola Urundai','mutton',2,300,'Spiced meatballs'],
    ['Mutton Keema','mutton',2,310],['Mutton Bone Roast','mutton',3,340]]},
  {id:'fish',title:'Seafood · Fish',sub:'From the coast, fried & curried',filters:['Seafood'],type:'seafood',items:[
    ['Vanjaram Fish Fry','seafood',2,360,'Seer fish, tawa-fried, signature'],['Pomfret Fry','seafood',2,380],
    ['Sankara Fish Fry','seafood',2,320],['Nethili Fry','seafood',2,240,'Crisp anchovies'],['Fish 65','seafood',2,260],
    ['Fish Pepper Fry','seafood',3,300],['Chilli Fish','seafood',2,290],['Dragon Fish','seafood',2,300],
    ['Fish Manchurian','seafood',1,290],['Tawa Fish','seafood',2,300],['Fish Tikka','seafood',2,320],
    ['Chettinad Fish Curry','seafood',3,320],['Meen Kuzhambu','seafood',3,300,'Tangy tamarind fish curry']]},
  {id:'prawns',title:'Seafood · Prawns',sub:'',filters:['Seafood'],type:'seafood',items:[
    ['Prawn 65','seafood',2,300],['Prawn Pepper Fry','seafood',3,320],['Prawn Masala','seafood',2,320,'Signature coastal masala'],
    ['Chilli Prawn','seafood',2,320],['Dragon Prawn','seafood',2,330],['Prawn Manchurian','seafood',1,320],
    ['Prawn Tawa Fry','seafood',2,320],['Prawn Chettinad','seafood',3,340]]},
  {id:'crab',title:'Seafood · Crab',sub:'',filters:['Seafood'],type:'seafood',items:[
    ['Crab Masala','seafood',3,420,'Whole crab, thick masala'],['Crab Pepper Fry','seafood',3,440],
    ['Crab Chettinad','seafood',3,450],['Nandu Rasam','seafood',3,260,'Crab-broth pepper rasam'],
    ['Nandu Omelette','seafood',2,220]]},
  {id:'egg',title:'Egg',sub:'Kai-veetu classics',filters:[],type:'egg',items:[
    ['Boiled Egg','egg',0,40],['Half Boil','egg',0,50],['Kalakki','egg',1,70,'Spiced scramble'],['Plain Omelette','egg',0,60],
    ['Masala Omelette','egg',1,80],['Egg Podimas','egg',1,90],['Egg Pepper Fry','egg',2,110],['Egg Masala','egg',2,120],
    ['Egg Curry','egg',2,130],['Chilli Egg','egg',2,120],['Egg Fried Rice','egg',1,160],['Egg Noodles','egg',1,160]]},
  {id:'biryani',title:'Biryani Festival',sub:'Seeraga samba & dum, sealed with aroma',filters:['Biryani'],items:[
    ['Special Chicken Biryani','chicken',2,260,'House special, boneless & bone mix'],['Chicken Dum Biryani','chicken',2,250],
    ['Seeraga Samba Chicken Biryani','chicken',2,280,'Fragrant short-grain rice'],['Nattu Kozhi Biryani','chicken',3,320,'Country chicken'],
    ['Mutton Biryani','mutton',2,340],['Mutton Dum Biryani','mutton',2,350],['Seeraga Samba Mutton Biryani','mutton',2,370],
    ['Mutton Keema Biryani','mutton',2,320],['Prawn Biryani','seafood',2,340],['Fish Biryani','seafood',2,320],
    ['Egg Biryani','egg',1,180],['Vegetable Biryani','veg',1,190],['Mushroom Biryani','veg',1,210],
    ['Paneer Biryani','veg',1,220],['Kuska','veg',1,150,'Plain flavoured biryani rice']]},
  {id:'si-chicken',title:'South Indian Main · Chicken',sub:'Gravies for rice, dosai & parotta',filters:['South Indian'],type:'chicken',items:[
    ['Chicken Chettinad','chicken',3,270,'Roasted spice, coconut base'],['Chicken Curry','chicken',2,250],
    ['Nattu Kozhi Kuzhambu','chicken',3,320],['Kongu Chicken Curry','chicken',2,270],['Chicken Pepper Masala','chicken',3,270],
    ['Butter Chicken','chicken',1,290],['Chicken Tikka Masala','chicken',2,290],['Kadai Chicken','chicken',2,280]]},
  {id:'si-mutton',title:'South Indian Main · Mutton',sub:'',filters:['South Indian'],type:'mutton',items:[
    ['Mutton Chettinad','mutton',3,350],['Mutton Curry','mutton',2,330],['Mutton Pepper Masala','mutton',3,350],
    ['Mutton Keema Masala','mutton',2,330],['Mutton Kola Curry','mutton',2,340],['Mutton Paaya','mutton',2,340,'Trotter stew for idiyappam'],
    ['Mutton Kuzhambu','mutton',3,340]]},
  {id:'si-seafood',title:'South Indian Main · Seafood',sub:'',filters:['South Indian','Seafood'],type:'seafood',items:[
    ['Meen Kuzhambu','seafood',3,300],['Fish Chettinad','seafood',3,320],['Prawn Masala','seafood',2,320],
    ['Prawn Chettinad','seafood',3,340],['Crab Masala','seafood',3,420]]},
  {id:'tandoor',title:'North Indian · Tandoor & Grill',sub:'Clay-oven smoke, charcoal char',filters:['North Indian','Tandoor','Grill'],items:[
    ['Tandoori Chicken','chicken',2,320,'Half / full, yoghurt-marinated'],['Chicken Tikka','chicken',2,290],
    ['Chicken Malai Tikka','chicken',1,300,'Creamy, mild'],['Hariyali Chicken Tikka','chicken',2,300,'Mint & coriander'],
    ['Chicken Seekh Kebab','chicken',2,300],['Mutton Seekh Kebab','mutton',2,340],['Fish Tikka','seafood',2,320],
    ['Tandoori Fish','seafood',2,360],['Tandoori Prawns','seafood',2,380],['Grilled Chicken','chicken',2,300],
    ['BBQ Chicken','chicken',2,310],['Pepper BBQ Chicken','chicken',3,320]]},
  {id:'ni-curry',title:'North Indian Curries',sub:'Rich, buttery, tandoor-friendly',filters:['North Indian'],items:[
    ['Butter Chicken','chicken',1,290],['Chicken Tikka Masala','chicken',2,290],['Kadai Chicken','chicken',2,280],
    ['Chicken Mughlai','chicken',1,300],['Mutton Rogan Josh','mutton',2,360],['Mutton Masala','mutton',2,350],
    ['Kadai Mutton','mutton',2,350],['Dal Tadka','veg',1,180],['Dal Makhani','veg',1,200],
    ['Paneer Butter Masala','veg',1,240],['Kadai Paneer','veg',2,240],['Palak Paneer','veg',1,240],['Mushroom Masala','veg',1,230]]},
  {id:'chinese-start',title:'Indo-Chinese · Starters',sub:'Wok-tossed, veg & non-veg',filters:['Chinese'],items:[
    ['Gobi 65','veg',2,190],['Gobi Manchurian','veg',1,190],['Chilli Gobi','veg',2,190],['Chilli Paneer','veg',2,230],
    ['Paneer Manchurian','veg',1,230],['Mushroom 65','veg',2,210],['Chilli Mushroom','veg',2,210],
    ['Veg Spring Roll','veg',0,170],['Chicken Lollipop','chicken',2,240],['Chilli Chicken','chicken',2,240],
    ['Dragon Chicken','chicken',2,250],['Schezwan Chicken','chicken',3,250],['Garlic Chicken','chicken',1,240],
    ['Chicken Manchurian','chicken',1,240],['Chilli Fish','seafood',2,290],['Dragon Prawn','seafood',2,330],['Chilli Prawn','seafood',2,320]]},
  {id:'fried-rice',title:'Indo-Chinese · Fried Rice',sub:'',filters:['Chinese'],items:[
    ['Veg Fried Rice','veg',1,160],['Mushroom Fried Rice','veg',1,180],['Paneer Fried Rice','veg',1,190],
    ['Schezwan Veg Fried Rice','veg',2,180],['Egg Fried Rice','egg',1,170],['Chicken Fried Rice','chicken',1,200],
    ['Schezwan Chicken Fried Rice','chicken',2,210],['Mixed Fried Rice','chicken',1,230],['Prawn Fried Rice','seafood',1,240],
    ['Seafood Fried Rice','seafood',1,260]]},
  {id:'noodles',title:'Indo-Chinese · Noodles',sub:'',filters:['Chinese'],items:[
    ['Veg Hakka Noodles','veg',1,160],['Schezwan Veg Noodles','veg',2,180],['Mushroom Noodles','veg',1,180],
    ['Egg Noodles','egg',1,170],['Chicken Hakka Noodles','chicken',1,200],['Schezwan Chicken Noodles','chicken',2,210],
    ['Mixed Noodles','chicken',1,230],['Prawn Noodles','seafood',1,240],['Seafood Noodles','seafood',1,260]]},
  {id:'tiffin',title:'South Indian Tiffin & Breads',sub:'Dosai, parotta & the classics',filters:['South Indian','Bread'],items:[
    ['Idli','veg',0,40],['Kal Dosai','veg',0,60],['Egg Kal Dosai','egg',1,80],['Kari Dosai','chicken',2,140,'Dosai layered with minced meat'],
    ['Mutton Kari Dosai','mutton',2,170],['Chicken Kari Dosai','chicken',2,150],['Appam','veg',0,50],['Idiyappam','veg',0,60],
    ['Parotta','veg',0,25],['Bun Parotta','veg',0,35],['Kothu Parotta','veg',1,140],['Chicken Kothu Parotta','chicken',2,180],
    ['Mutton Kothu Parotta','mutton',2,210],['Egg Kothu Parotta','egg',1,160],['Chapati','veg',0,30],['Naan','veg',0,45],
    ['Butter Naan','veg',0,55],['Garlic Naan','veg',0,65],['Roti','veg',0,35],['Kulcha','veg',0,60]]},
  {id:'veg',title:'Vegetarian',sub:'A full veg table, cooked with the same care',filters:[],type:'veg',items:[
    ['Paneer 65','veg',2,220],['Gobi 65','veg',2,190],['Mushroom 65','veg',2,210],['Baby Corn 65','veg',2,200],
    ['Paneer Tikka','veg',1,250],['Gobi Manchurian','veg',1,190],['Mushroom Pepper Fry','veg',2,220],
    ['Paneer Butter Masala','veg',1,240],['Kadai Paneer','veg',2,240],['Palak Paneer','veg',1,240],
    ['Veg Chettinad','veg',2,210],['Mushroom Chettinad','veg',2,220],['Kadai Vegetable','veg',1,210],
    ['Dal Fry','veg',1,170],['Dal Tadka','veg',1,180],['Dal Makhani','veg',1,200],['Veg Kurma','veg',1,190],
    ['Vegetable Biryani','veg',1,190],['Paneer Biryani','veg',1,220],['Mushroom Biryani','veg',1,210]]},
  {id:'combos',title:'Meals & Combos',sub:'Value plates & family buckets',filters:['combos'],items:[
    ['South Indian Veg Meals','veg',1,180,'Rice, sambar, rasam, poriyal, curd, appalam'],
    ['South Indian Non-Veg Meals','chicken',2,240,'Full meals with chicken curry & fry'],
    ['Chicken Meals','chicken',2,260,'Biryani or rice + chicken curry, fry, egg'],
    ['Mutton Meals','mutton',2,320,'Rice + mutton curry, chukka, egg'],
    ['Fish Meals','seafood',2,300,'Rice + meen kuzhambu & fish fry'],
    ['Chicken Biryani Combo','chicken',2,320,'Biryani + starter + drink'],
    ['Mutton Biryani Combo','mutton',2,390,'Biryani + starter + drink'],
    ['Family Biryani Bucket','chicken',2,899,'Serves 4 · biryani, gravy, raita & shorba'],
    ['Grill Chicken Combo','chicken',2,420,'Half grill + parotta + drink'],
    ['Parotta + Chicken Curry','chicken',2,180],['Parotta + Mutton Curry','mutton',2,240],
    ['Idiyappam + Paaya','mutton',2,220],['Kari Dosai Combo','chicken',2,220,'Kari dosai + egg + drink']]},
  {id:'desserts',title:'Desserts',sub:'Sweet endings, cooling scoops',filters:['Desserts'],type:'dessert',items:[
    ['Gulab Jamun','dessert',0,80],['Rasmalai','dessert',0,100],['Carrot Halwa','dessert',0,110],['Bread Halwa','dessert',0,110],
    ['Elaneer Payasam','dessert',0,120,'Tender-coconut kheer'],['Payasam','dessert',0,90],['Falooda','dessert',0,160],
    ['Brownie with Ice Cream','dessert',0,180],['Vanilla Ice Cream','dessert',0,80],['Chocolate Ice Cream','dessert',0,90],
    ['Butterscotch Ice Cream','dessert',0,90],['Kulfi','dessert',0,100]]},
  {id:'beverages',title:'Beverages',sub:'Filter coffee to jigarthanda',filters:['Beverages'],type:'drink',items:[
    ['Filter Coffee','drink',0,50],['Tea','drink',0,40],['Masala Tea','drink',0,50],['Fresh Lime','drink',0,60],
    ['Lemon Soda','drink',0,70],['Rose Milk','drink',0,80],['Badam Milk','drink',0,90],['Jigarthanda','drink',0,120,"Madurai's iced classic"],
    ['Buttermilk','drink',0,50],['Lassi','drink',0,90],['Mango Lassi','drink',0,110],['Fresh Fruit Juices','drink',0,110],
    ['Milkshakes','drink',0,130],['Soft Drinks','drink',0,50],['Mineral Water','drink',0,30]]},
]

// Flatten all menu items
const ALL_ITEMS: FlatItem[] = []
MENU.forEach(sec => {
  const push = (arr: (string|number)[][], sub: string) => arr.forEach(it => {
    const [name, type, spice, price, desc] = it
    const id = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const filters = new Set<string>(sec.filters ?? [])
    if (type === 'veg') filters.add('Veg')
    if (type === 'chicken') filters.add('Chicken')
    if (type === 'mutton') filters.add('Mutton')
    if (type === 'seafood') filters.add('Seafood')
    if (type === 'egg') filters.add('Egg')
    ALL_ITEMS.push({ id, name: String(name), type: type as DishType, spice: Number(spice), price: Number(price), desc: desc ? String(desc) : undefined, sec: sec.id, secTitle: sec.title, sub, filters: [...filters] })
  })
  if (sec.groups) sec.groups.forEach(g => push(g.items, g.label))
  else if (sec.items) push(sec.items, '')
})
const itemById = (id: string) => ALL_ITEMS.find(i => i.id === id)

const SIGNATURE_IDS = ['special-chicken-biryani','mutton-biryani','chicken-chukka','chicken-pallipalayam',
  'chicken-chettinad','pepper-chicken','mutton-chukka','mutton-pepper-fry','madurai-mutton',
  'vanjaram-fish-fry','prawn-masala','tandoori-chicken']
const BIRYANI_IDS = MENU.find(s => s.id === 'biryani')!.items!.map(it => String(it[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-'))

const GALLERY = [
  {t:'Special Chicken Biryani',type:'biryani',cat:'Biryani',tall:true,photo:'biryani'},
  {t:'Mutton Chukka',type:'mutton',cat:'Mutton',tall:false,photo:'mutton'},
  {t:'Vanjaram Fish Fry',type:'seafood',cat:'Seafood',tall:false,photo:'seafood'},
  {t:'Tandoori Platter',type:'chicken',cat:'Tandoor',tall:true,photo:'tray'},
  {t:'Chicken 65',type:'chicken',cat:'Chicken',tall:false,photo:'chicken'},
  {t:'Crab Masala',type:'seafood',cat:'Seafood',tall:true,photo:'seafood'},
  {t:'Prawn Masala',type:'seafood',cat:'Seafood',tall:false,photo:'spread'},
  {t:'Mutton Biryani',type:'biryani',cat:'Biryani',tall:true,photo:'biryani'},
  {t:'Chilli Chicken',type:'chinese',cat:'Chinese',tall:false,photo:'chicken'},
  {t:'Chicken Chettinad',type:'chicken',cat:'Chicken',tall:false,photo:'chicken'},
  {t:'Grilled Chicken',type:'chicken',cat:'Tandoor',tall:true,photo:'tray'},
  {t:'Schezwan Noodles',type:'chinese',cat:'Chinese',tall:false,photo:'spread'},
  {t:'Pallipalayam Chicken',type:'chicken',cat:'Chicken',tall:true,photo:'chicken'},
  {t:'Fish Curry',type:'seafood',cat:'Seafood',tall:false,photo:'seafood'},
  {t:'Dining Hall',type:'combo',cat:'Restaurant',tall:false,photo:'interior'},
  {t:'The Live Grill',type:'chicken',cat:'Restaurant',tall:true,photo:'fancy'},
]

const REVIEWS = [
  {n:'Priya R.',r:5,t:'The mutton biryani is the closest thing to my grandmother\'s cooking I\'ve found outside home. Seeraga samba rice done right.',b:'Machampalayam, Coimbatore'},
  {n:'Karthik S.',r:5,t:'Chettinad chicken with a heat that builds slowly — proper, honest cooking. The kothu parotta is unmissable.',b:'Madukkarai Main Rd'},
  {n:'Fatima A.',r:5,t:'We ordered the family biryani bucket for a get-together and everyone asked where it was from. Generous cuts, great aroma.',b:'Online Order · Coimbatore'},
  {n:'Vignesh M.',r:4,t:'Vanjaram fish fry was fresh and crisp. Service was warm and quick even on a busy Sunday.',b:'Machampalayam, Coimbatore'},
  {n:'Deepa K.',r:5,t:'Finally a non-veg-focused place that treats its vegetarian dishes seriously. The paneer butter masala is rich and balanced.',b:'Sundarapuram, Coimbatore'},
  {n:'Arjun P.',r:5,t:'Tandoori chicken with real charcoal smoke and a jigarthanda to finish. Feels like a proper Kongu-style meal.',b:'Madukkarai Main Rd'},
]

const BRANCHES = [
  {name:'Machampalayam',area:'Family Dining · 4.8★',addr:'50, Madukkarai Main Rd, Reddy Colony, Machampalayam, Coimbatore, Tamil Nadu 641024',rating:'Rated 4.8 on Google · 24 reviews',hrs:'Open daily · Closes 11:00 PM',map:MAPS_MAIN},
  {name:'Sundarapuram',area:'Family Dining',addr:'Sundarapuram, Coimbatore, Tamil Nadu — full address to be confirmed',rating:'New branch',hrs:'Open daily · Closes 11:00 PM (to confirm)',map:'https://www.google.com/maps/search/?api=1&query=333%20Family%20Restaurant%2C%20Sundarapuram%2C%20Coimbatore'},
]

const FILTERS = ['All','Veg','Chicken','Mutton','Seafood','Egg','Biryani','South Indian','North Indian','Chinese','Tandoor','Desserts','Beverages']
const PORTIONS = [{n:'Half',m:.6},{n:'Full',m:1},{n:'Family',m:1.8}]
const EXTRAS = [{n:'Extra Gravy',p:40},{n:'Onion Raita',p:30},{n:'Boiled Egg',p:20},{n:'Extra Spicy',p:0},{n:'Less Spicy',p:0}]
const COUPONS: Record<string, {off: number; flat?: boolean; label: string}> = {
  'WELCOME10':{off:.10,label:'10% off'},
  'BIRYANI50':{off:50,flat:true,label:'₹50 off'},
  'FEAST15':{off:.15,label:'15% off'},
}
const DESC_BITS: Record<string, string[]> = {
  chicken:['Marinated overnight, tossed with curry leaves and shallots.','Slow-roasted in freshly ground Chettinad masala.','Fiery, glossy and packed with pepper heat.'],
  mutton:['Tender cuts dry-roasted with black pepper and coconut.','Cooked low and slow until the masala clings to the bone.','Madurai-style heat with a deep, layered finish.'],
  seafood:['Fresh from the coast, tawa-fried to a crisp edge.','Simmered in a tangy, aromatic coastal gravy.','Griddled with pepper, garlic and curry leaf.'],
  veg:['Freshly prepared with hand-ground spices.','Rich, buttery and full of flavour.','A vegetarian plate cooked with the same care as our grills.'],
  egg:['Simple, satisfying and made to order.','Spiced, folded and pan-finished.'],
  biryani:['Seeraga samba rice, sealed and dum-cooked with aroma.','Layered with fried onions, herbs and generous cuts.'],
}
const autoDesc = (it: FlatItem) => { const a = DESC_BITS[it.type] ?? DESC_BITS.chicken; return a[it.name.length % a.length] }

// ─── SMALL HELPERS / ATOMS ────────────────────────────────────────────────────
function BrandMark({ size = 46 }: { size?: number }) {
  return (
    <span style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0,
      border:'1.5px solid var(--gold)', background:'#000', boxShadow:'0 6px 18px -8px rgba(0,0,0,.7)' }}>
      <img src={logo} alt={BRAND} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
    </span>
  )
}
function Vind({ type }: { type: string }) {
  const isVeg = type === 'veg'
  return (
    <span role="img" aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'} title={isVeg ? 'Veg' : 'Non-veg'} style={{
      display:'inline-grid', placeItems:'center', width:16, height:16, borderRadius:3, flexShrink:0,
      border: `1.6px solid ${isVeg ? 'var(--veg)' : 'var(--nonveg)'}`,
    }}>
      {isVeg
        ? <span style={{width:8,height:8,borderRadius:'50%',background:'var(--veg)'}} />
        : <span style={{width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderBottom:'9px solid var(--nonveg)'}} />}
    </span>
  )
}
function Spice({ level }: { level: number }) {
  if (!level) return null
  return (
    <span style={{display:'inline-flex',gap:1,fontSize:'.78rem',lineHeight:1}} title={['Mild','Medium','Spicy','Fiery'][level]+' spice'}>
      {[0,1,2].map(i => <span key={i} style={{opacity:i<level?1:.25}}>🌶</span>)}
    </span>
  )
}
function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <span style={{
      fontFamily:'var(--sans)',fontWeight:700,fontSize:'.7rem',letterSpacing:'.28em',textTransform:'uppercase',
      color:'var(--gold-ink)',display:'inline-flex',gap:'.6em',alignItems:'center',
      justifyContent: center ? 'center' : undefined,
    }}>
      <span style={{width:26,height:1,background:'var(--gold)',opacity:.7,flexShrink:0}} />
      {children}
      {center && <span style={{width:26,height:1,background:'var(--gold)',opacity:.7,flexShrink:0}} />}
    </span>
  )
}
function Btn({ children, variant='gold', size='md', block, onClick, type='button', style: s }: {
  children: React.ReactNode; variant?: 'gold'|'outline'|'maroon'; size?: 'md'|'sm'
  block?: boolean; onClick?: () => void; type?: 'button'|'submit'; style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'.5em',
    padding: size==='sm' ? '.55em 1.05em' : '.82em 1.5em',
    borderRadius:999,fontWeight:700,fontSize: size==='sm' ? '.82rem' : '.9rem',
    whiteSpace:'nowrap',transition:'transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s,background .22s',
    cursor:'pointer',border:'none',fontFamily:'inherit',
    width: block ? '100%' : undefined,
  }
  const variants: Record<string, React.CSSProperties> = {
    gold: {background:'linear-gradient(135deg,var(--gold-soft),var(--gold) 60%,var(--gold-deep))',color:'#22160a',
      boxShadow:'0 10px 26px -12px rgba(201,162,75,.7)'},
    outline: {border:'1.5px solid var(--line-strong)',background:'transparent',color:'var(--ink)'},
    maroon: {background:'linear-gradient(135deg,var(--burg),var(--maroon))',color:'var(--cream)',
      boxShadow:'0 10px 26px -12px rgba(124,29,43,.7)'},
  }
  return (
    <button type={type} onClick={onClick} style={{...base,...variants[variant],...s}}
      onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform='')}>
      {children}
    </button>
  )
}
function LinkBtn({ children, href, variant='gold', size='sm', style: s }: {
  children: React.ReactNode; href: string; variant?: 'gold'|'outline'; size?: 'md'|'sm'; style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'.5em',
    padding: size==='sm' ? '.55em 1.05em' : '.82em 1.5em',
    borderRadius:999,fontWeight:700,fontSize: size==='sm' ? '.82rem' : '.9rem',
    whiteSpace:'nowrap',textDecoration:'none',fontFamily:'inherit',transition:'transform .22s',
    ...(variant==='gold'
      ? {background:'linear-gradient(135deg,var(--gold-soft),var(--gold) 60%,var(--gold-deep))',color:'#22160a',boxShadow:'0 10px 26px -12px rgba(201,162,75,.7)'}
      : {border:'1.5px solid var(--line-strong)',background:'transparent',color:'var(--ink)'}),
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{...base,...s}}
      onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform='')}>
      {children}
    </a>
  )
}
function DishCard({ type, photo, ribbon, children }: {
  type: string; photo?: string; ribbon?: string; children: React.ReactNode
}) {
  const photoKey = (photo ?? type) as string
  const src = PHOTO[photoKey] ? photoUrl(photoKey, 600, 450) : dishPhoto(type, 600, 450)
  return (
    <div style={{
      background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',
      overflow:'hidden',display:'flex',flexDirection:'column',position:'relative',
      transition:'transform .3s,border-color .3s,box-shadow .3s',
    }}
    onMouseEnter={e => { const el = e.currentTarget; el.style.transform='translateY(-6px)'; el.style.borderColor='var(--line-strong)'; el.style.boxShadow='var(--shadow)' }}
    onMouseLeave={e => { const el = e.currentTarget; el.style.transform=''; el.style.borderColor='var(--line)'; el.style.boxShadow='' }}>
      {ribbon && (
        <span style={{
          position:'absolute',top:14,left:-2,background:'linear-gradient(90deg,var(--gold),var(--gold-deep))',
          color:'#22160a',fontSize:'.6rem',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',
          padding:'5px 12px 5px 10px',borderRadius:'0 6px 6px 0',boxShadow:'0 4px 10px -4px rgba(0,0,0,.5)',zIndex:2,
        }}>{ribbon}</span>
      )}
      <div style={{position:'relative',aspectRatio:'4/3',overflow:'hidden'}}>
        {src
          ? <img src={src} alt="" loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
          : <div style={{width:'100%',height:'100%',background:'linear-gradient(150deg,var(--panel-2),var(--char))',display:'grid',placeItems:'center',fontSize:'2.8rem'}}>{glyph(type)}</div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,7,5,.7) 0%,transparent 50%)'}} />
      </div>
      {children}
    </div>
  )
}

// ─── CART HELPERS ─────────────────────────────────────────────────────────────
const lineTotal = (i: CartEntry) => Math.round((i.base * i.pmult + i.extras.reduce((s, e) => s + e.p, 0)) * i.qty)
const cartCount = (cart: CartEntry[]) => cart.reduce((s, i) => s + i.qty, 0)
const cartSubtotal = (cart: CartEntry[]) => cart.reduce((s, i) => s + lineTotal(i), 0)

// ─── SECTIONS ────────────────────────────────────────────────────────────────
function PageHero({ title, sub, crumb, onNav }: { title: string; sub: string; crumb: string; onNav: (v: ViewKey) => void }) {
  return (
    <div style={{
      padding:'56px 0 32px',borderBottom:'1px solid var(--line)',position:'relative',
      background:'radial-gradient(100% 120% at 100% 0,rgba(124,29,43,.22),transparent 55%)',
    }}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
        <div style={{fontSize:'.78rem',color:'var(--ink-mute)',marginBottom:10}}>
          <span onClick={() => onNav('home')} style={{cursor:'pointer',transition:'.2s'}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--gold-ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-mute)')}>Home</span>
          {' / '}{crumb}
        </div>
        <Eyebrow>{BRAND} · Coimbatore</Eyebrow>
        <h1 style={{fontSize:'clamp(2.1rem,5vw,3.4rem)',marginTop:'.35em',marginBottom:'.25em'}}>{title}</h1>
        <p style={{color:'var(--ink-soft)',fontSize:'1.05rem',maxWidth:'44em'}}>{sub}</p>
      </div>
    </div>
  )
}
function MarqueeBar() {
  const items = ['Chicken Biryani','Mutton Chukka','Chicken Chettinad','Vanjaram Fish Fry','Prawn Masala','Tandoori Chicken','Kothu Parotta','Jigarthanda']
  const joined = items.map((it, i) => <span key={i}>{it} <span style={{color:'var(--gold-ink)'}}>◆</span></span>)
  return (
    <div style={{background:'linear-gradient(90deg,var(--maroon),var(--burg))',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',overflow:'hidden',padding:'11px 0'}}>
      <div className="marquee-track" style={{color:'var(--cream)',opacity:.92}}>
        <span style={{display:'inline-flex',gap:44,alignItems:'center'}}>{[...joined,...joined]}</span>
      </div>
    </div>
  )
}
function Testimonials() {
  const [idx, setIdx] = useState(0)
  const [perView, setPerView] = useState(3)
  useEffect(() => {
    const update = () => setPerView(window.innerWidth >= 1080 ? 3 : window.innerWidth >= 760 ? 2 : 1)
    update(); window.addEventListener('resize', update, {passive:true}); return () => window.removeEventListener('resize', update)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % Math.max(1, REVIEWS.length - perView + 1)), 5000)
    return () => clearInterval(t)
  }, [perView])
  const pages = Math.max(1, REVIEWS.length - perView + 1)
  return (
    <section style={{background:'linear-gradient(var(--char),var(--char-2))',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',padding:'88px 0'}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <Eyebrow center>Kind Words</Eyebrow>
          <h2 style={{fontSize:'clamp(1.9rem,4vw,2.8rem)',marginTop:'.5em'}}>What Our Guests Say</h2>
        </div>
        <div style={{overflow:'hidden'}}>
          <div style={{display:'flex',gap:22,transition:'transform .5s cubic-bezier(.2,.8,.2,1)',transform:`translateX(calc(-${idx}*(100%/${perView} + ${22/perView}px)))`}}>
            {REVIEWS.map((r, i) => (
              <div key={i} style={{flex:`0 0 calc(${100/perView}% - ${22*(perView-1)/perView}px)`,background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:'30px 32px',display:'flex',flexDirection:'column',gap:14}}>
                <div style={{color:'var(--gold-ink)',letterSpacing:2,fontSize:'1.1rem'}}>{'★'.repeat(r.r)}{'☆'.repeat(5-r.r)}</div>
                <p style={{fontFamily:'var(--serif)',fontStyle:'italic',fontSize:'1.05rem',color:'var(--ink)',lineHeight:1.55,flex:1}}>"{r.t}"</p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:'radial-gradient(circle at 30% 25%,var(--burg-2),var(--maroon))',display:'grid',placeItems:'center',fontFamily:'var(--serif)',color:'var(--gold-ink)',fontWeight:700,border:'1px solid var(--line-strong)',flexShrink:0}}>{r.n[0]}</div>
                  <div><b style={{display:'block',fontSize:'.93rem'}}>{r.n}</b><span style={{fontSize:'.76rem',color:'var(--ink-mute)'}}>{r.b}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:26}}>
          {Array.from({length:pages},(_,i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width:i===idx?26:9,height:9,borderRadius:9,border:'none',cursor:'pointer',transition:'.2s',
              background:i===idx?'var(--gold)':'var(--line-strong)',
            }} />
          ))}
        </div>
        <p style={{textAlign:'center',fontSize:'.76rem',color:'var(--ink-mute)',marginTop:16,fontStyle:'italic'}}>
          {BRAND} is rated <b style={{color:'var(--gold-ink)'}}>4.8★ across 24 Google reviews</b>. Quotes above are sample placeholders for layout.
        </p>
      </div>
    </section>
  )
}
function LocationCards({ onNav }: { onNav?: (v: ViewKey) => void }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:22}}>
      {BRANCHES.map((b, i) => (
        <article key={i} style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',overflow:'hidden',transition:'.3s'}}
          onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor='var(--line-strong)';el.style.boxShadow='var(--shadow)'}}
          onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor='var(--line)';el.style.boxShadow=''}}>
          <div style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',alignItems:'start',gap:10}}>
            <h3 style={{fontSize:'1.24rem'}}>{BRAND} — {b.name}</h3>
            <span style={{fontSize:'.62rem',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--leaf)',border:'1px solid rgba(92,138,68,.5)',borderRadius:999,padding:'3px 9px',whiteSpace:'nowrap'}}>{b.area}</span>
          </div>
          <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:10}}>
            {[{icon:'📍',text:b.addr},{icon:'🕑',text:b.hrs},{icon:'⭐',text:b.rating}].map(({icon,text},j)=>(
              <div key={j} style={{display:'flex',gap:10,alignItems:'flex-start',color:'var(--ink-soft)',fontSize:'.88rem'}}>
                <span style={{flexShrink:0}}>{icon}</span><span>{text}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}}>
              <LinkBtn href={b.map}>Get Directions</LinkBtn>
              {onNav && <Btn variant="outline" size="sm" onClick={() => onNav('order')}>Order Online</Btn>}
              {onNav && <Btn variant="outline" size="sm" onClick={() => onNav('reservation')}>Reserve</Btn>}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// ─── HOME VIEW ────────────────────────────────────────────────────────────────
function HomeView({ onNav, onAdd }: { onNav: (v: ViewKey) => void; onAdd: (id: string) => void }) {
  const sig = SIGNATURE_IDS.map(itemById).filter(Boolean) as FlatItem[]
  const biry = BIRYANI_IDS.map(itemById).filter(Boolean).slice(0, 10) as FlatItem[]
  const photoIds = { chicken: 'chicken', mutton: 'mutton', seafood: 'seafood', biryani: 'biryani', veg: 'spread', egg: 'tray' } as Record<string, string>
  return (
    <>
      {/* HERO */}
      <section style={{position:'relative',minHeight:'clamp(560px,90vh,860px)',display:'flex',alignItems:'center',overflow:'hidden',borderBottom:'1px solid var(--line)',background:'linear-gradient(120deg,#150f0d 30%,#3a1420 120%)'}}>
        <div style={{position:'absolute',inset:0}}>
          <img src={photoUrl('hero',1600,900)} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(100deg,rgba(10,7,5,.96) 38%,rgba(10,7,5,.72) 60%,rgba(90,15,30,.45))' }} />
        </div>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',position:'relative',zIndex:2,width:'100%'}}>
          <div style={{maxWidth:640,paddingTop:40,paddingBottom:40,animation:'heroRise .8s ease both'}}>
            <img src={logo} alt={BRAND} style={{width:118,height:118,borderRadius:'50%',border:'1px solid var(--line-strong)',boxShadow:'0 20px 44px -18px rgba(0,0,0,.85)',background:'#000',objectFit:'cover',marginBottom:22}} />
            <Eyebrow>Chettinad · Kongu Nadu · Madurai · Coimbatore</Eyebrow>
            <h1 style={{fontSize:'clamp(2.7rem,6.5vw,5.2rem)',lineHeight:1.02,margin:'.3em 0 .45em',color:'#f6ecd8'}}>
              Authentic Flavours.<br /><em style={{fontStyle:'italic',color:'#e6c780'}}>Legendary Taste.</em>
            </h1>
            <p style={{fontSize:'clamp(1rem,1.6vw,1.18rem)',color:'rgba(245,235,214,.84)',maxWidth:'34em',marginBottom:'2em'}}>
              Experience the rich flavours of Tamil Nadu — aromatic biryanis, fiery Chettinad curries, sizzling grills, fresh seafood and irresistible Indo-Chinese favourites.
            </p>
            <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:38}}>
              <Btn onClick={() => onNav('menu')}>Explore Our Menu</Btn>
              <Btn variant="outline" onClick={() => onNav('order')}>Order Online</Btn>
            </div>
            <div style={{display:'flex',gap:28,flexWrap:'wrap'}}>
              {[['150+','Dishes'],['15','Biryani Varieties'],['4.8★','Guest Rating'],['Daily','Fresh Catch']].map(([b, s]) => (
                <div key={s} style={{display:'flex',flexDirection:'column',gap:2}}>
                  <b style={{fontFamily:'var(--serif)',fontSize:'1.5rem',color:'#e6c780'}}>{b}</b>
                  <span style={{fontSize:'.72rem',letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(245,235,214,.6)'}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{position:'absolute',bottom:22,left:'50%',transform:'translateX(-50%)',zIndex:2,color:'rgba(245,235,214,.55)',fontSize:'.68rem',letterSpacing:'.24em',textTransform:'uppercase',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
          Scroll
          <span style={{width:1,height:34,background:'linear-gradient(var(--gold),transparent)',display:'block',animation:'drop 1.8s infinite'}} />
        </div>
      </section>

      <MarqueeBar />

      {/* SIGNATURE */}
      <section style={{padding:'88px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <div style={{textAlign:'center',maxWidth:580,margin:'0 auto 48px'}}>
            <Eyebrow center>Chef's Picks</Eyebrow>
            <h2 style={{fontSize:'clamp(1.9rem,4.2vw,3rem)',marginTop:'.5em',marginBottom:'.4em'}}>Our Signature Favourites</h2>
            <p style={{color:'var(--ink-soft)',fontSize:'1.04rem'}}>The dishes our regulars come back for — twelve plates that define the 333 kitchen.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:22}}>
            {sig.map((it, i) => (
              <DishCard key={it.id} type={it.type} photo={photoIds[it.type]} ribbon={i===0?'Most Loved':i===4?"Chef's Special":undefined}>
                <div style={{padding:'16px 18px 18px',display:'flex',flexDirection:'column',gap:8,flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}><Vind type={it.type} /><h3 style={{fontSize:'1.18rem'}}>{it.name}</h3></div>
                  <p style={{color:'var(--ink-soft)',fontSize:'.88rem',flex:1}}>{it.desc ?? autoDesc(it)}</p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:4}}>
                    <span style={{fontFamily:'var(--serif)',fontSize:'1.22rem',color:'var(--gold-ink)',fontWeight:600}}>{money(it.price)}</span>
                    <Btn variant="maroon" size="sm" onClick={() => onAdd(it.id)}>Add to Cart</Btn>
                  </div>
                </div>
              </DishCard>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:38}}>
            <Btn variant="outline" onClick={() => onNav('signature')}>View All Signature Dishes</Btn>
          </div>
        </div>
      </section>

      {/* BIRYANI */}
      <section style={{padding:'88px 0',background:'radial-gradient(120% 100% at 100% 0,rgba(124,29,43,.28),transparent 55%) var(--char-2)',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <div style={{marginBottom:36}}>
            <Eyebrow>The Biryani Festival</Eyebrow>
            <h2 style={{fontSize:'clamp(1.9rem,4vw,2.9rem)',marginTop:'.4em',marginBottom:'.35em'}}>Sealed. Dum-cooked. Unforgettable.</h2>
            <p style={{color:'var(--ink-soft)',fontSize:'1.02rem',maxWidth:'40em'}}>Seeraga samba and long-grain biryanis, layered with hand-pounded masala, fried onions and generous cuts — served with raita and shorba.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
            {biry.map(it => (
              <article key={it.id} style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',overflow:'hidden',transition:'.3s',position:'relative'}}
                onMouseEnter={e=>{const el=e.currentTarget;el.style.transform='translateY(-5px)';el.style.borderColor='var(--line-strong)';el.style.boxShadow='var(--shadow)'}}
                onMouseLeave={e=>{const el=e.currentTarget;el.style.transform='';el.style.borderColor='var(--line)';el.style.boxShadow=''}}>
                <div style={{position:'relative',aspectRatio:'1/1',overflow:'hidden'}}>
                  <img src={kwPhoto(it.type,400,400,it.id)} alt={it.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,7,5,.75),transparent 55%)'}} />
                  <div style={{position:'absolute',inset:'auto 0 0 0',padding:'10px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}><Vind type={it.type} /><h4 style={{fontSize:'.95rem',color:'#f6ecd8'}}>{it.name}</h4></div>
                  </div>
                </div>
                <div style={{padding:'10px 12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontFamily:'var(--serif)',fontSize:'1.08rem',color:'var(--gold-ink)',fontWeight:600}}>{money(it.price)}</span>
                  <button onClick={() => onAdd(it.id)} aria-label={`Add ${it.name} to cart`} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--line-strong)',display:'grid',placeItems:'center',color:'var(--gold-ink)',fontSize:'1.1rem',cursor:'pointer',transition:'.2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--gold)';e.currentTarget.style.color='#22160a'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.color='var(--gold-ink)'}}>+</button>
                </div>
              </article>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:32}}>
            <Btn onClick={() => onNav('menu')}>See All 15 Biryanis</Btn>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section style={{padding:'88px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <Eyebrow center>The 333 Promise</Eyebrow>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',marginTop:'.5em'}}>Why Guests Choose Us</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20}}>
            {[{n:'01',ic:'🌿',t:'Authentic Recipes',p:'Traditional flavours inspired by regional Indian kitchens — Chettinad, Kongu Nadu and Madurai.'},
              {n:'02',ic:'🐟',t:'Fresh Ingredients',p:'Carefully selected meat, seafood, vegetables and spices, sourced fresh every single day.'},
              {n:'03',ic:'👨‍🍳',t:'Master Chefs',p:'Experienced chefs preserving authentic cooking techniques over open flame and clay ovens.'},
              {n:'04',ic:'❤️',t:'Made With Passion',p:'Every dish is prepared to deliver a memorable, consistent flavour — plate after plate.'},
            ].map(w => (
              <div key={w.n} style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:'28px 24px',position:'relative',overflow:'hidden',transition:'.3s'}}
                onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor='var(--line-strong)';el.style.transform='translateY(-4px)'}}
                onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor='var(--line)';el.style.transform=''}}>
                <span style={{position:'absolute',top:14,right:20,fontFamily:'var(--serif)',fontSize:'2.2rem',color:'var(--line-strong)',fontStyle:'italic'}}>{w.n}</span>
                <div style={{width:54,height:54,borderRadius:13,display:'grid',placeItems:'center',marginBottom:16,background:'radial-gradient(circle at 30% 25%,var(--burg),var(--maroon))',border:'1px solid var(--line-strong)',fontSize:'1.4rem'}}>{w.ic}</div>
                <h3 style={{fontSize:'1.24rem',marginBottom:8}}>{w.t}</h3>
                <p style={{color:'var(--ink-soft)',fontSize:'.92rem'}}>{w.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section style={{padding:'88px 0',background:'linear-gradient(var(--char-2),var(--char))',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:52,alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <div style={{aspectRatio:'4/5',borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--line-strong)',boxShadow:'var(--shadow-lg)'}}>
                <img src={photoUrl('interior',700,900)} alt={`${BRAND} interior`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(90,15,30,.5),transparent 60%)'}} />
              </div>
              <div style={{position:'absolute',bottom:-18,right:-14,background:'var(--panel)',border:'1px solid var(--line-strong)',borderRadius:14,padding:'14px 18px',boxShadow:'var(--shadow)',display:'flex',gap:12,alignItems:'center'}}>
                <b style={{fontFamily:'var(--serif)',fontSize:'1.8rem',color:'var(--gold-ink)',lineHeight:1}}>100%</b>
                <span style={{fontSize:'.74rem',color:'var(--ink-soft)',maxWidth:'9em'}}>Freshly ground spices, every day</span>
              </div>
            </div>
            <div>
              <Eyebrow>Our Story</Eyebrow>
              <h2 style={{fontSize:'clamp(1.9rem,4vw,2.8rem)',margin:'.4em 0 .6em'}}>Born from a passion for real Tamil cooking</h2>
              <p style={{color:'var(--ink-soft)',marginBottom:14,lineHeight:1.72}}>{BRAND} began with a simple belief — that the flavours of a Tamil Nadu home kitchen deserve a place worth celebrating. Freshly ground spices, generous hospitality and recipes passed down through the family are at the heart of every plate we serve.</p>
              <p style={{color:'var(--ink-soft)',marginBottom:22,lineHeight:1.72}}>From the pepper-heavy chukkas of Chettinad to the coastal catch of the day and the aromatic dum biryanis of Madurai, our kitchen is built on consistency, quality and care.</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:26}}>
                {['Authentic recipes','Quality meat','Fresh seafood','Traditional spices','Skilled chefs','Family dining','Hygiene first','Warm hospitality'].map(p => (
                  <span key={p} style={{fontSize:'.76rem',fontWeight:600,color:'var(--ink-soft)',border:'1px solid var(--line)',borderRadius:999,padding:'5px 12px',background:'var(--panel)'}}>◆ {p}</span>
                ))}
              </div>
              <Btn variant="outline" onClick={() => onNav('about')}>Read Our Full Story</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY TEASER */}
      <section style={{padding:'88px 0',borderTop:'1px solid var(--line)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <Eyebrow center>Feast Your Eyes</Eyebrow>
            <h2 style={{fontSize:'clamp(1.9rem,4vw,2.8rem)',marginTop:'.5em'}}>From Our Kitchen</h2>
          </div>
          <div style={{columns:3,columnGap:16}}>
            {GALLERY.slice(0,9).map((g, i) => (
              <div key={i} style={{breakInside:'avoid',marginBottom:16,borderRadius:'var(--r-sm)',overflow:'hidden',border:'1px solid var(--line)',position:'relative',transition:'.3s',cursor:'pointer'}}
                onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor='var(--gold)';el.style.transform='scale(1.01)'}}
                onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor='var(--line)';el.style.transform=''}}>
                <div style={{position:'relative',aspectRatio: g.tall ? '3/4' : '4/3',overflow:'hidden'}}>
                  <img src={photoUrl(g.photo, 500, g.tall ? 670 : 500)} alt={g.t} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <div style={{position:'absolute',inset:'auto 0 0 0',padding:'26px 14px 12px',fontWeight:700,fontSize:'.88rem',background:'linear-gradient(transparent,rgba(0,0,0,.72))',color:'#f6ecd8'}}>{g.t}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:28}}>
            <Btn variant="outline" onClick={() => onNav('gallery')}>Open Full Gallery</Btn>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* FIND US */}
      <section style={{padding:'88px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <Eyebrow center>Find Us</Eyebrow>
            <h2 style={{fontSize:'clamp(1.9rem,4vw,2.8rem)',marginTop:'.5em',marginBottom:'.35em'}}>Visit {BRAND}</h2>
            <p style={{color:'var(--ink-soft)',fontSize:'1.04rem'}}>Now at two branches in Coimbatore — Machampalayam and Sundarapuram. Dine in with the family, or order for pickup and delivery.</p>
          </div>
          <LocationCards onNav={onNav} />
          <div style={{textAlign:'center',marginTop:28}}>
            <Btn onClick={() => onNav('locations')}>All Locations & Map</Btn>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section style={{padding:'88px 0',textAlign:'center',background:'radial-gradient(90% 130% at 50% 0,rgba(124,29,43,.22),transparent 55%)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <Eyebrow center>Hungry Already?</Eyebrow>
          <h2 style={{fontSize:'clamp(2rem,5vw,3.4rem)',margin:'.4em auto .5em',maxWidth:'14em'}}>Your table — or your doorstep — is one tap away</h2>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <Btn onClick={() => onNav('order')}>Order Online</Btn>
            <Btn variant="outline" onClick={() => onNav('reservation')}>Reserve a Table</Btn>
          </div>
        </div>
      </section>
    </>
  )
}

// ─── MENU VIEW ────────────────────────────────────────────────────────────────
function MenuView({ onAdd, filter, setFilter, search, setSearch }: {
  onAdd: (id: string) => void; filter: string; setFilter: (f: string) => void
  search: string; setSearch: (s: string) => void
}) {
  const itemMatches = useCallback((it: FlatItem) => {
    if (search) { const q = search.toLowerCase(); if (!it.name.toLowerCase().includes(q) && !(it.desc ?? '').toLowerCase().includes(q) && !it.secTitle.toLowerCase().includes(q)) return false }
    if (filter === 'All') return true
    if (filter === 'Grill') return it.filters.includes('Grill') || it.filters.includes('Tandoor')
    return it.filters.includes(filter)
  }, [filter, search])
  const visibleSecs = MENU.map(sec => ({ sec, items: ALL_ITEMS.filter(i => i.sec === sec.id && itemMatches(i)) })).filter(({items}) => items.length)
  return (
    <>
      <div style={{padding:'48px 0 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <Eyebrow>150+ Dishes · Veg & Non-Veg</Eyebrow>
          <h1 style={{fontSize:'clamp(2.1rem,5vw,3.3rem)',margin:'.35em 0 .25em'}}>The Full Menu</h1>
          <p style={{color:'var(--ink-soft)',fontSize:'1.02rem',maxWidth:'44em',marginBottom:22}}>Search any dish, filter by category or diet, and add straight to your cart.</p>
          <div style={{display:'flex',gap:12,alignItems:'center',background:'var(--panel)',border:'1px solid var(--line)',borderRadius:999,padding:'6px 6px 6px 18px',maxWidth:520,marginBottom:20}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-soft)" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search biryani, chukka, prawn, paneer…" style={{flex:1,background:'none',border:'none',color:'var(--ink)',fontSize:'1rem',padding:'10px 0',outline:'none',fontFamily:'inherit'}} />
            {search && <button onClick={() => setSearch('')} style={{padding:'6px 12px',borderRadius:999,border:'1px solid var(--line)',fontSize:'.8rem',color:'var(--ink-mute)',cursor:'pointer'}}>Clear</button>}
          </div>
        </div>
      </div>
      <div style={{position:'sticky',top:68,zIndex:30,background:'color-mix(in oklab,var(--paper) 90%,transparent)',backdropFilter:'blur(10px)',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',padding:'11px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'thin'}}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{flexShrink:0,padding:'.52em 1em',borderRadius:999,border:'1px solid var(--line)',fontWeight:600,fontSize:'.84rem',cursor:'pointer',transition:'.2s',whiteSpace:'nowrap',
              background: f===filter ? 'linear-gradient(135deg,var(--gold-soft),var(--gold))' : 'var(--panel)',
              color: f===filter ? '#22160a' : 'var(--ink-soft)',
              borderColor: f===filter ? 'transparent' : 'var(--line)'}}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 88px'}}>
        {visibleSecs.length === 0 && (
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--ink-mute)'}}>
            <div style={{fontSize:'2.6rem',marginBottom:10}}>🍽️</div>
            <b>No dishes match "{search}"</b>
            <p style={{color:'var(--ink-mute)',marginTop:4}}>Try another spelling or clear your filters.</p>
          </div>
        )}
        {visibleSecs.map(({sec, items}) => {
          const subs = [...new Set(items.map(i => i.sub))]
          return (
            <div key={sec.id} id={`cat-${sec.id}`} style={{marginTop:44,scrollMarginTop:150}}>
              <div style={{display:'flex',alignItems:'baseline',gap:14,borderBottom:'1px solid var(--line)',paddingBottom:11,marginBottom:6}}>
                <h2 style={{fontSize:'1.65rem'}}>{sec.title}</h2>
                <span style={{color:'var(--ink-mute)',fontSize:'.8rem',fontWeight:600}}>{items.length} item{items.length>1?'s':''}</span>
              </div>
              {sec.sub && <p style={{fontFamily:'var(--serif)',fontStyle:'italic',color:'var(--gold-ink)',fontSize:'1rem',margin:'18px 0 6px'}}>{sec.sub}</p>}
              {subs.length > 1 || (subs.length === 1 && subs[0]) ? subs.map(sub => {
                const g = items.filter(i => i.sub === sub)
                return (
                  <div key={sub}>
                    {sub && <p style={{fontFamily:'var(--serif)',fontStyle:'italic',color:'var(--gold-ink)',fontSize:'.98rem',margin:'18px 0 6px'}}>{sub}</p>}
                    <MenuList items={g} onAdd={onAdd} />
                  </div>
                )
              }) : <MenuList items={items} onAdd={onAdd} />}
            </div>
          )
        })}
      </div>
    </>
  )
}
function MenuList({ items, onAdd }: { items: FlatItem[]; onAdd: (id: string) => void }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'0 32px'}}>
      {items.map(it => (
        <div key={it.id} style={{display:'flex',gap:12,alignItems:'center',padding:'13px 4px',borderBottom:'1px dashed var(--line)'}}>
          <Vind type={it.type} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,fontWeight:700,fontSize:'.98rem'}}>
              {it.name}
              {it.spice > 0 && <Spice level={it.spice} />}
            </div>
            {it.desc && <div style={{color:'var(--ink-mute)',fontSize:'.81rem',marginTop:2}}>{it.desc}</div>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <span style={{fontFamily:'var(--serif)',color:'var(--gold-ink)',fontSize:'1.06rem',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{money(it.price)}</span>
            <button onClick={() => onAdd(it.id)} aria-label={`Add ${it.name} to cart`} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--line-strong)',display:'grid',placeItems:'center',color:'var(--gold-ink)',fontSize:'1.15rem',fontWeight:700,cursor:'pointer',transition:'.18s',lineHeight:1}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--gold)';e.currentTarget.style.color='#22160a';e.currentTarget.style.borderColor='transparent'}}
              onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.color='var(--gold-ink)';e.currentTarget.style.borderColor='var(--line-strong)'}}>+</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── GALLERY VIEW ─────────────────────────────────────────────────────────────
function GalleryView() {
  const [galFilter, setGalFilter] = useState('All')
  const [lbOpen, setLbOpen] = useState(false)
  const [lbI, setLbI] = useState(0)
  const cats = ['All','Biryani','Chicken','Mutton','Seafood','Chinese','Tandoor','Restaurant']
  const filtered = GALLERY.map((g, i) => ({...g, i})).filter(g => galFilter === 'All' || g.cat === galFilter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lbOpen) return
      if (e.key === 'Escape') setLbOpen(false)
      if (e.key === 'ArrowLeft') setLbI(i => (i - 1 + filtered.length) % filtered.length)
      if (e.key === 'ArrowRight') setLbI(i => (i + 1) % filtered.length)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lbOpen, filtered.length])
  return (
    <>
      <div style={{padding:'56px 0 0',borderBottom:'1px solid var(--line)',background:'radial-gradient(100% 120% at 100% 0,rgba(124,29,43,.2),transparent 55%)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px 0'}}>
          <Eyebrow>{BRAND} · Coimbatore</Eyebrow>
          <h1 style={{fontSize:'clamp(2.1rem,5vw,3.3rem)',margin:'.35em 0 .25em'}}>Food Gallery</h1>
          <p style={{color:'var(--ink-soft)',fontSize:'1.02rem',maxWidth:'40em',marginBottom:0}}>Warm light, real texture, honest plates.</p>
        </div>
      </div>
      <div style={{position:'sticky',top:68,zIndex:30,background:'color-mix(in oklab,var(--paper) 90%,transparent)',backdropFilter:'blur(10px)',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',padding:'11px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',display:'flex',gap:8,overflowX:'auto'}}>
          {cats.map(c => (
            <button key={c} onClick={() => setGalFilter(c)} style={{flexShrink:0,padding:'.52em 1em',borderRadius:999,border:'1px solid var(--line)',fontWeight:600,fontSize:'.84rem',cursor:'pointer',transition:'.2s',
              background: c===galFilter ? 'linear-gradient(135deg,var(--gold-soft),var(--gold))' : 'var(--panel)',
              color: c===galFilter ? '#22160a' : 'var(--ink-soft)'}}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'26px 24px 88px'}}>
        <div style={{columns:3,columnGap:16}}>
          {filtered.map((g, idx) => (
            <div key={g.i} style={{breakInside:'avoid',marginBottom:16,borderRadius:'var(--r-sm)',overflow:'hidden',border:'1px solid var(--line)',cursor:'pointer',transition:'.3s'}}
              onClick={() => { setLbI(idx); setLbOpen(true) }}
              onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor='var(--gold)';el.style.transform='scale(1.01)'}}
              onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor='var(--line)';el.style.transform=''}}>
              <div style={{position:'relative',aspectRatio:g.tall?'3/4':'4/3',overflow:'hidden'}}>
                <img src={photoUrl(g.photo,500,g.tall?670:500)} alt={g.t} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                <div style={{position:'absolute',inset:'auto 0 0 0',padding:'24px 14px 12px',fontWeight:700,fontSize:'.88rem',color:'#f6ecd8',background:'linear-gradient(transparent,rgba(0,0,0,.7))'}}>{g.t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {lbOpen && (
        <div style={{position:'fixed',inset:0,zIndex:120,background:'rgba(6,4,3,.95)',display:'grid',placeItems:'center',padding:24}} onClick={() => setLbOpen(false)}>
          <div style={{maxWidth:640,width:'100%'}} onClick={e => e.stopPropagation()}>
            <div style={{borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--line-strong)',position:'relative',aspectRatio:'4/3'}}>
              <img src={photoUrl(filtered[lbI].photo, 800, 600)} alt={filtered[lbI].t} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            </div>
            <p style={{textAlign:'center',marginTop:14,fontFamily:'var(--serif)',fontSize:'1.35rem',color:'var(--gold-ink)'}}>{filtered[lbI].t}</p>
          </div>
          <button aria-label="Close image" style={{position:'absolute',top:20,right:24,fontSize:'1.6rem',color:'var(--ink)',cursor:'pointer',border:'none',background:'none'}} onClick={() => setLbOpen(false)}>✕</button>
          <button style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:'2rem',color:'var(--ink-soft)',cursor:'pointer',border:'none',background:'none',padding:20}} onClick={e => { e.stopPropagation(); setLbI(i => (i-1+filtered.length)%filtered.length) }}>‹</button>
          <button style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',fontSize:'2rem',color:'var(--ink-soft)',cursor:'pointer',border:'none',background:'none',padding:20}} onClick={e => { e.stopPropagation(); setLbI(i => (i+1)%filtered.length) }}>›</button>
        </div>
      )}
    </>
  )
}

// ─── ABOUT VIEW ───────────────────────────────────────────────────────────────
function AboutView({ onNav }: { onNav: (v: ViewKey) => void }) {
  return (
    <>
      <PageHero title="Our Story" sub="Rooted in Tamil Nadu, cooked with heart" crumb="About" onNav={onNav} />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'56px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:52,alignItems:'center',marginBottom:64}}>
          <div style={{aspectRatio:'4/5',borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--line-strong)',boxShadow:'var(--shadow-lg)',position:'relative'}}>
            <img src={photoUrl('interior',700,900)} alt="Restaurant interior" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            <div style={{position:'absolute',bottom:22,left:22,right:22,background:'rgba(10,7,5,.82)',border:'1px solid var(--line-strong)',borderRadius:12,padding:'14px 18px'}}>
              <b style={{fontFamily:'var(--serif)',fontSize:'1.6rem',color:'var(--gold-ink)',display:'block',lineHeight:1}}>100%</b>
              <span style={{fontSize:'.76rem',color:'var(--ink-soft)'}}>Freshly ground spices, every day</span>
            </div>
          </div>
          <div>
            <Eyebrow>Our Story</Eyebrow>
            <h2 style={{fontSize:'clamp(1.8rem,3.8vw,2.7rem)',margin:'.4em 0 .6em'}}>Born from a passion for real Tamil cooking</h2>
            <p style={{color:'var(--ink-soft)',marginBottom:14,lineHeight:1.74}}>{BRAND} was born from a simple, stubborn belief: that the food of a Tamil Nadu home — the pepper-dark chukkas, the slow biryanis, the tangy meen kuzhambu — deserves to be cooked with the same care in a restaurant as it is in a family kitchen.</p>
            <p style={{color:'var(--ink-soft)',marginBottom:14,lineHeight:1.74}}>We started with our grandmother's recipes and a masala grinder that never rests. Today our chefs still pound their own spice blends, source meat and seafood fresh each morning, and cook over open flame and clay ovens the way it has always been done across Chettinad, Kongu Nadu and Madurai.</p>
            <h3 style={{fontSize:'1.4rem',margin:'26px 0 10px',color:'var(--ink)'}}>What we stand for</h3>
            <p style={{color:'var(--ink-soft)',lineHeight:1.74}}>Authentic recipes and consistent taste. Quality meat and fresh seafood. Traditional spices and fresh ingredients. Skilled chefs who respect technique. Hygiene we're proud of, family dining that feels like home, and the kind of hospitality that makes you want to come back.</p>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,marginBottom:64}}>
          {[{ic:'🌿',t:'Authentic Recipes',p:'Traditional flavours inspired by regional Indian kitchens.'},
            {ic:'🐟',t:'Fresh Ingredients',p:'Carefully selected meat, seafood, vegetables and spices.'},
            {ic:'👨‍🍳',t:'Master Chefs',p:'Experienced chefs preserving authentic cooking techniques.'},
            {ic:'❤️',t:'Made With Passion',p:'Every dish prepared to deliver memorable flavour.'},
          ].map(w => (
            <div key={w.t} style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:'26px 22px'}}>
              <div style={{fontSize:'1.4rem',marginBottom:12}}>{w.ic}</div>
              <h3 style={{fontSize:'1.22rem',marginBottom:7}}>{w.t}</h3>
              <p style={{color:'var(--ink-soft)',fontSize:'.9rem'}}>{w.p}</p>
            </div>
          ))}
        </div>
      </div>
      <Testimonials />
    </>
  )
}

// ─── LOCATIONS VIEW ───────────────────────────────────────────────────────────
function LocationsView({ onNav }: { onNav: (v: ViewKey) => void }) {
  return (
    <>
      <PageHero title="Visit Us" sub="Two family branches in Coimbatore — Machampalayam & Sundarapuram" crumb="Locations" onNav={onNav} />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'52px 24px 88px'}}>
        <LocationCards onNav={onNav} />
        <div style={{marginTop:32,border:'1px solid var(--line)',borderRadius:'var(--r)',height:340,display:'grid',placeItems:'center',position:'relative',backgroundImage:'linear-gradient(rgba(201,162,75,.04) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(201,162,75,.04) 1px,transparent 1px) 0 0/40px 40px,radial-gradient(circle at 60% 45%,var(--panel-2),var(--char))'}}>
          {[{t:'44%',l:'38%'},{t:'58%',l:'62%'}].map((p, i) => (
            <span key={i} style={{position:'absolute',top:p.t,left:p.l,width:14,height:14,background:'var(--burg-2)',border:'2px solid var(--gold-soft)',borderRadius:'50% 50% 50% 0',transform:'rotate(-45deg)',boxShadow:'0 0 0 6px rgba(124,29,43,.22)'}} />
          ))}
          <a href="https://www.google.com/maps/search/?api=1&query=333%20Family%20Restaurant%20Coimbatore" target="_blank" rel="noopener noreferrer" style={{background:'rgba(0,0,0,.4)',border:'1px solid var(--line)',padding:'8px 18px',borderRadius:999,fontSize:'.82rem',color:'var(--ink-soft)',zIndex:2}}>📍 Open in Google Maps · Machampalayam & Sundarapuram, Coimbatore</a>
        </div>
      </div>
    </>
  )
}

// Reservation field — MODULE-LEVEL so it keeps a stable component identity. Defining it inside
// ReservationView made React remount every input on each keystroke, so the fields couldn't be typed in.
function Field({ name, label, required, errors, children }: {
  name: string; label: string; required?: boolean; errors: Record<string, boolean>; children: React.ReactNode
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{display:'flex',flexDirection:'column',gap:5,fontSize:'.78rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--ink-soft)'}}>
        <span>{label} {required && <span aria-hidden="true" style={{color:'#e8836f'}}>*</span>}</span>
        {children}
      </label>
      {errors[name] && <span role="alert" style={{color:'#e8836f',fontSize:'.74rem'}}>This field is required</span>}
    </div>
  )
}

// ─── RESERVATION VIEW ─────────────────────────────────────────────────────────
function ReservationView({ onNav }: { onNav: (v: ViewKey) => void }) {
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = formRef.current!
    const newErrs: Record<string, boolean> = {}
    form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[required]').forEach(el => {
      if (!el.value.trim()) newErrs[el.name] = true
      if (el.name === 'mobile' && el.value && !/^\d{10}$/.test(el.value.replace(/\D/g,'').slice(-10))) newErrs[el.name] = true
    })
    setErrors(newErrs)
    if (!Object.keys(newErrs).length) {
      const g = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() || ''
      const msg =
        `Hi ${BRAND}, I'd like to book a table.\n\n` +
        `Name: ${g('name')}\n` +
        `Mobile: ${g('mobile')}\n` +
        `Date: ${g('date')}\n` +
        `Time: ${g('time')}\n` +
        `Guests: ${g('guests')}\n` +
        `Branch: ${g('branch')}` +
        (g('request') ? `\nSpecial request: ${g('request')}` : '')
      if (WHATSAPP_NUMBER) window.open(waLink(msg), '_blank', 'noopener')
      setDone(true); form.reset()
    }
  }
  const inputStyle = (name: string): React.CSSProperties => ({
    background:'var(--panel)',border:`1px solid ${errors[name]?'var(--nonveg)':'var(--line)'}`,
    borderRadius:10,padding:'11px 13px',color:'var(--ink)',fontFamily:'inherit',fontSize:'.94rem',outline:'none',transition:'.2s',
  })
  return (
    <>
      <PageHero title="Reserve a Table" sub="Plan a family meal or a celebration" crumb="Reserve" onNav={onNav} />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'52px 24px 88px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:44,alignItems:'start'}}>
          <div style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:30}}>
            {done && (
              <div style={{background:'rgba(92,138,68,.12)',border:'1px solid rgba(92,138,68,.5)',borderRadius:12,padding:'15px 18px',display:'flex',gap:12,alignItems:'center',marginBottom:20}}>
                <span style={{width:26,height:26,borderRadius:'50%',background:'var(--leaf)',display:'grid',placeItems:'center',color:'#fff',flexShrink:0,fontSize:'.85rem'}}>✓</span>
                <div>{WHATSAPP_NUMBER ? <><b>Booking opened in WhatsApp!</b> Press send there and we'll confirm your table shortly.</> : <><b>Request received!</b> We'll confirm your table shortly.</>}</div>
              </div>
            )}
            <form ref={formRef} onSubmit={submit} noValidate>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <Field errors={errors} name="name" label="Full Name" required><input name="name" required style={inputStyle('name')} onChange={() => setErrors(e=>({...e,name:false}))} /></Field>
                <Field errors={errors} name="mobile" label="Mobile Number" required><input name="mobile" inputMode="tel" required style={inputStyle('mobile')} onChange={() => setErrors(e=>({...e,mobile:false}))} /></Field>
                <div style={{gridColumn:'1/-1'}}><Field errors={errors} name="email" label="Email"><input name="email" type="email" style={inputStyle('email')} /></Field></div>
                <Field errors={errors} name="date" label="Date" required><input name="date" type="date" required min={new Date().toISOString().split('T')[0]} style={inputStyle('date')} onChange={() => setErrors(e=>({...e,date:false}))} /></Field>
                <Field errors={errors} name="time" label="Time" required><input name="time" type="time" required style={inputStyle('time')} onChange={() => setErrors(e=>({...e,time:false}))} /></Field>
                <Field errors={errors} name="guests" label="Guests" required>
                  <select name="guests" required style={{...inputStyle('guests'),cursor:'pointer'}} onChange={() => setErrors(e=>({...e,guests:false}))}>
                    <option value="">Select</option>{[1,2,3,4,5,6,7,8,'9+'].map(n=><option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field errors={errors} name="branch" label="Branch" required>
                  <select name="branch" required style={{...inputStyle('branch'),cursor:'pointer'}} onChange={() => setErrors(e=>({...e,branch:false}))}>
                    <option value="">Select branch</option>{BRANCHES.map(b=><option key={b.name}>{b.name}</option>)}
                  </select>
                </Field>
                <div style={{gridColumn:'1/-1'}}>
                  <Field errors={errors} name="request" label="Special Request">
                    <textarea name="request" rows={3} placeholder="Birthday cake, high chair, window seating…" style={{...inputStyle('request'),resize:'vertical'}} />
                  </Field>
                </div>
              </div>
              <Btn type="submit" block style={{marginTop:18,...(WHATSAPP_NUMBER?{background:'#25D366',borderColor:'#25D366',color:'#04310f'}:{})}}>
                {WHATSAPP_NUMBER ? '💬  Book on WhatsApp' : 'Reserve Your Table'}
              </Btn>
              <p style={{fontSize:'.78rem',color:'var(--ink-mute)',marginTop:10}}>
                {WHATSAPP_NUMBER
                  ? "This opens WhatsApp with your booking details filled in — just press send and we'll confirm."
                  : 'Tip: add your number to WHATSAPP_NUMBER in the code to turn this into one-tap WhatsApp booking.'}
              </p>
            </form>
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:28,position:'sticky',top:90}}>
            <h3 style={{fontSize:'1.28rem',marginBottom:16}}>Good to Know</h3>
            {[{ic:'🕑',l:'Hours',t:'Open daily · Closes 11:00 PM'},
              {ic:'📍',l:'Location',t:'Madukkarai Main Rd, Machampalayam, Coimbatore'},
              {ic:'👨‍👩‍👧',l:'Groups',t:'Family halls & party seating available'},
              {ic:'🎉',l:'Celebrations',t:'Birthdays & functions catered on request'},
            ].map(r => (
              <div key={r.l} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'13px 0',borderBottom:'1px solid var(--line)'}}>
                <div style={{width:40,height:40,borderRadius:10,background:'var(--panel-2)',border:'1px solid var(--line-strong)',display:'grid',placeItems:'center',flexShrink:0}}>{r.ic}</div>
                <div><b style={{display:'block',fontSize:'.7rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-mute)',marginBottom:2}}>{r.l}</b><span style={{color:'var(--ink)',fontSize:'.94rem'}}>{r.t}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── CONTACT VIEW ─────────────────────────────────────────────────────────────
function ContactView({ onNav }: { onNav: (v: ViewKey) => void }) {
  const [done, setDone] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = formRef.current!
    let ok = true
    form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('[required]').forEach(el => { if (!el.value.trim()) ok = false })
    if (ok) { setDone(true); form.reset() }
  }
  const inp: React.CSSProperties = {background:'var(--panel)',border:'1px solid var(--line)',borderRadius:10,padding:'11px 13px',color:'var(--ink)',fontFamily:'inherit',fontSize:'.94rem',outline:'none',width:'100%'}
  return (
    <>
      <PageHero title="Contact Us" sub="We'd love to hear from you" crumb="Contact" onNav={onNav} />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'52px 24px 88px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:44,alignItems:'start'}}>
          <div style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:30}}>
            {done && <div style={{background:'rgba(92,138,68,.12)',border:'1px solid rgba(92,138,68,.5)',borderRadius:12,padding:'15px 18px',display:'flex',gap:12,alignItems:'center',marginBottom:20}}>
              <span style={{width:26,height:26,borderRadius:'50%',background:'var(--leaf)',display:'grid',placeItems:'center',color:'#fff',flexShrink:0}}>✓</span>
              <div><b>Message sent!</b> Our team will get back to you soon.</div>
            </div>}
            <form ref={formRef} onSubmit={submit} noValidate style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <label style={{fontSize:'.78rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--ink-soft)'}}>Name *</label>
                  <input name="name" required style={inp} />
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <label style={{fontSize:'.78rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--ink-soft)'}}>Mobile *</label>
                  <input name="mobile" inputMode="tel" required style={inp} />
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <label style={{fontSize:'.78rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--ink-soft)'}}>Email *</label>
                <input name="email" type="email" required style={inp} />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <label style={{fontSize:'.78rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--ink-soft)'}}>Message *</label>
                <textarea name="msg" required rows={4} placeholder="Feedback, catering enquiry, bulk order…" style={{...inp,resize:'vertical'}} />
              </div>
              <Btn type="submit" block>Send Message</Btn>
            </form>
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:28}}>
            {[{ic:'📍',l:'Address',t:'50, Madukkarai Main Rd, Reddy Colony, Machampalayam, Coimbatore, Tamil Nadu 641024'},
              {ic:'🕑',l:'Open',t:'Open daily · Closes 11:00 PM'},
              {ic:'⭐',l:'Google Rating',t:'4.8 · 24 reviews'},
              {ic:'💬',l:'WhatsApp',t:'Chat with us'},
              {ic:'📞',l:'Phone',t:'Coming soon — share your number to enable Call & WhatsApp'}].map(r=>(
              <div key={r.l} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'13px 0',borderBottom:'1px solid var(--line)'}}>
                <div style={{width:40,height:40,borderRadius:10,background:'var(--panel-2)',border:'1px solid var(--line-strong)',display:'grid',placeItems:'center',flexShrink:0}}>{r.ic}</div>
                <div><b style={{display:'block',fontSize:'.7rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-mute)',marginBottom:2}}>{r.l}</b><span style={{color:'var(--ink)',fontSize:'.94rem'}}>{r.t}</span></div>
              </div>
            ))}
            <a href={MAPS_MAIN} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',marginTop:16,color:'var(--gold-ink)',fontSize:'.88rem',fontWeight:700}}>📍 Open in Google Maps →</a>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── ORDER VIEW ───────────────────────────────────────────────────────────────
function OrderView({ cart, onAdd, onOpenCart, filter, setFilter, search, setSearch }: {
  cart: CartEntry[]; onAdd: (id: string) => void; onOpenCart: () => void
  filter: string; setFilter: (f: string) => void; search: string; setSearch: (s: string) => void
}) {
  const sub = cartSubtotal(cart)
  return (
    <>
      <div style={{padding:'52px 0 0',borderBottom:'1px solid var(--line)',background:'radial-gradient(100% 120% at 100% 0,rgba(124,29,43,.2),transparent 55%)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <Eyebrow>{BRAND} · Coimbatore</Eyebrow>
          <h1 style={{fontSize:'clamp(2rem,5vw,3.2rem)',margin:'.35em 0 .25em'}}>Order Online</h1>
          <p style={{color:'var(--ink-soft)',fontSize:'1.02rem',maxWidth:'44em',paddingBottom:30}}>Browse, add and check out — pickup or delivery.</p>
        </div>
      </div>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'24px 24px 88px',display:'grid',gridTemplateColumns:'1fr 360px',gap:40,alignItems:'start'}}>
        <div>
          <MenuView onAdd={onAdd} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
        </div>
        <div style={{position:'sticky',top:90,background:'var(--panel)',border:'1px solid var(--line)',borderRadius:'var(--r)',padding:26}}>
          <h3 style={{fontSize:'1.32rem',marginBottom:6}}>Your Cart</h3>
          <p style={{color:'var(--ink-soft)',fontSize:'.88rem',marginBottom:16}}>Add dishes from the menu and review everything here.</p>
          {cart.length === 0
            ? <p style={{fontSize:'.88rem',color:'var(--ink-mute)'}}>No items yet — tap <b>+</b> on any dish.</p>
            : <>
                {cart.map(i => (
                  <div key={i.key} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--line)',fontSize:'.88rem'}}>
                    <span style={{flex:1}}>{i.qty}× {i.name} <span style={{color:'var(--ink-mute)',fontSize:'.78rem'}}>({i.portion})</span></span>
                    <span style={{fontFamily:'var(--serif)',color:'var(--gold-ink)',fontVariantNumeric:'tabular-nums'}}>{money(lineTotal(i))}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontFamily:'var(--serif)',fontSize:'1.1rem',fontWeight:600}}>
                  <span>Subtotal</span><b style={{color:'var(--gold-ink)'}}>{money(sub)}</b>
                </div>
              </>
          }
          <Btn block style={{marginTop:12}} onClick={onOpenCart}>Open Cart & Checkout</Btn>
          <p style={{fontSize:'.76rem',color:'var(--ink-mute)',marginTop:10}}>Free delivery over {money(499)} · Order & confirm on WhatsApp</p>
        </div>
      </div>
    </>
  )
}

// ─── SIGNATURE VIEW ───────────────────────────────────────────────────────────
function SignatureView({ onNav, onAdd }: { onNav: (v: ViewKey) => void; onAdd: (id: string) => void }) {
  const items = SIGNATURE_IDS.map(itemById).filter(Boolean) as FlatItem[]
  const photoIds: Record<string, string> = { chicken:'chicken', mutton:'mutton', seafood:'seafood', biryani:'biryani', veg:'spread', egg:'tray' }
  return (
    <>
      <PageHero title="Signature Dishes" sub="The plates that made our name" crumb="Signature" onNav={onNav} />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'48px 24px 88px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:22}}>
          {items.map((it, i) => (
            <DishCard key={it.id} type={it.type} photo={photoIds[it.type]} ribbon={i===0?'Most Loved':undefined}>
              <div style={{padding:'16px 18px 18px',display:'flex',flexDirection:'column',gap:8,flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><Vind type={it.type} /><h3 style={{fontSize:'1.18rem'}}>{it.name}</h3></div>
                <p style={{color:'var(--ink-soft)',fontSize:'.88rem',flex:1}}>{it.desc ?? autoDesc(it)}</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:4}}>
                  <span style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--gold-ink)',fontWeight:600}}>{money(it.price)}</span>
                  <Btn variant="maroon" size="sm" onClick={() => onAdd(it.id)}>Add to Cart</Btn>
                </div>
              </div>
            </DishCard>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── POLICY VIEWS ─────────────────────────────────────────────────────────────
function PolicyView({ type, onNav }: { type: 'privacy'|'terms'; onNav: (v: ViewKey) => void }) {
  const privacy = [
    {h:'1. Information We Collect',p:'When you place an order, reserve a table or contact us, we may collect your name, phone number, email address and delivery details. We collect only what is needed to serve your request.'},
    {h:'2. How We Use It',p:'To process and deliver your orders, confirm reservations, respond to enquiries, and — with your consent — send offers and updates.'},
    {h:'3. Sharing',p:'We do not sell your data. We share it only with delivery and payment partners strictly to fulfil your order.'},
    {h:'4. Cookies',p:'Our website may use cookies to remember your cart and preferences and to understand how the site is used.'},
    {h:'5. Your Rights',p:'You may request access to, correction of, or deletion of your personal data by contacting us.'},
  ]
  const terms = [
    {h:'1. Orders',p:'All orders are subject to availability and confirmation. Prices shown are indicative and may change.'},
    {h:'2. Payments',p:'Applicable taxes and delivery charges are shown at checkout before you confirm.'},
    {h:'3. Delivery & Pickup',p:'Delivery times are estimates. Please provide accurate address and contact details.'},
    {h:'4. Cancellations & Refunds',p:'Cancellation and refund eligibility depends on order status; contact the branch promptly.'},
    {h:'5. Reservations',p:'Tables are held for a limited grace period. Large groups may require advance confirmation.'},
    {h:'6. Liability',p:'Please inform us of any allergies. We prepare food in kitchens that handle nuts, dairy, seafood and gluten.'},
  ]
  const items = type === 'privacy' ? privacy : terms
  return (
    <>
      <PageHero title={type==='privacy'?'Privacy Policy':'Terms & Conditions'} sub={type==='privacy'?'How we handle your information':'The basics of ordering with us'} crumb={type==='privacy'?'Privacy':'Terms'} onNav={onNav} />
      <div style={{maxWidth:760,margin:'0 auto',padding:'52px 24px 88px'}}>
        <p style={{color:'var(--ink-mute)',fontStyle:'italic',marginBottom:8}}>Placeholder policy text — have it reviewed by a legal professional before publishing.</p>
        {items.map(({h, p}) => (
          <div key={h}>
            <h3 style={{fontSize:'1.4rem',margin:'28px 0 10px'}}>{h}</h3>
            <p style={{color:'var(--ink-soft)',lineHeight:1.72}}>{p}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── CART DRAWER ─────────────────────────────────────────────────────────────
function CartDrawer({ cart, open, onClose, onNav, onChange, onRemove }: {
  cart: CartEntry[]; open: boolean; onClose: () => void; onNav: (v: ViewKey) => void
  onChange: (key: string, d: number) => void; onRemove: (key: string) => void
}) {
  const [mode, setMode] = useState<'delivery'|'pickup'>('delivery')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<string|null>(null)
  const [couponMsg, setCouponMsg] = useState<{ok:boolean;text:string}|null>(null)
  const sub = cartSubtotal(cart)
  const couponData = coupon ? COUPONS[coupon] : null
  const disc = couponData ? (couponData.flat ? Math.min(couponData.off, sub) : Math.round(sub * couponData.off)) : 0
  const afterDisc = sub - disc
  const delivery = mode === 'delivery' ? (afterDisc >= 499 || afterDisc === 0 ? 0 : 40) : 0
  const gst = Math.round(afterDisc * 0.05)
  const grand = afterDisc + delivery + gst
  const applyCoupon = () => {
    const v = couponInput.trim().toUpperCase()
    if (COUPONS[v]) { setCoupon(v); setCouponMsg({ok:true,text:`${COUPONS[v].label} applied 🎉`}) }
    else { setCoupon(null); setCouponMsg({ok:false,text:'Invalid code — try WELCOME10'}) }
  }
  const checkout = () => {
    if (!cart.length) return
    const lines = cart.map(i => {
      const extras = i.extras.length ? ` (+${i.extras.map(e => e.n).join(', ')})` : ''
      return `• ${i.qty} x ${i.name} — ${i.portion}${extras} = ${money(lineTotal(i))}`
    }).join('\n')
    const msg =
      `Hi ${BRAND}, I'd like to place an order (${mode === 'delivery' ? 'Delivery' : 'Pickup'}).\n\n` +
      `${lines}\n\n` +
      `Subtotal: ${money(sub)}\n` +
      (disc > 0 ? `Discount${coupon ? ` (${coupon})` : ''}: -${money(disc)}\n` : '') +
      `GST (5%): ${money(gst)}\n` +
      `${mode === 'delivery' ? 'Delivery' : 'Pickup'}: ${delivery ? money(delivery) : 'FREE'}\n` +
      `Total: ${money(grand)}`
    if (WHATSAPP_NUMBER) window.open(waLink(msg), '_blank', 'noopener')
    onClose()
  }
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:90,background:'rgba(6,4,3,.6)',backdropFilter:'blur(3px)',opacity:open?1:0,visibility:open?'visible':'hidden',transition:'.3s'}} />
      <aside style={{position:'fixed',top:0,right:0,height:'100%',width:'min(430px,100%)',zIndex:100,background:'var(--char-2)',borderLeft:'1px solid var(--line-strong)',boxShadow:'-28px 0 60px -28px rgba(0,0,0,.85)',transform:open?'translateX(0)':'translateX(100%)',transition:'transform .35s cubic-bezier(.2,.8,.2,1)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h3 style={{fontSize:'1.3rem'}}>Your Order</h3>
          <button onClick={onClose} aria-label="Close cart" style={{width:38,height:38,borderRadius:9,border:'1px solid var(--line)',display:'grid',placeItems:'center',color:'var(--ink-soft)',cursor:'pointer',fontSize:'1.1rem'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'14px 22px',display:'flex',flexDirection:'column',gap:10}}>
          {cart.length === 0
            ? <div style={{textAlign:'center',padding:'48px 16px',color:'var(--ink-mute)'}}>
                <div style={{fontSize:'2.8rem',marginBottom:10,opacity:.5}}>🍽️</div>
                <b>Your cart is empty</b>
                <p style={{fontSize:'.88rem',marginTop:6}}>Add a biryani or a starter to get going.</p>
                <div style={{marginTop:16}}>
                  <Btn size="sm" onClick={() => { onClose(); onNav('menu') }}>Browse Menu</Btn>
                </div>
              </div>
            : cart.map(i => (
              <div key={i.key} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px solid var(--line)'}}>
                <div style={{width:52,height:52,borderRadius:9,flexShrink:0,display:'grid',placeItems:'center',fontSize:'1.4rem',border:'1px solid var(--line)',background:'var(--panel)'}}>{glyph(i.type)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:'.9rem',display:'flex',gap:6,alignItems:'center'}}><Vind type={i.type} />{i.name}</div>
                  <div style={{fontSize:'.74rem',color:'var(--ink-mute)'}}>{i.portion}</div>
                  {i.extras.length > 0 && <div style={{fontSize:'.7rem',color:'var(--leaf)'}}>+ {i.extras.map(e=>e.n).join(', ')}</div>}
                  <div style={{display:'inline-flex',alignItems:'center',border:'1px solid var(--line-strong)',borderRadius:7,overflow:'hidden',marginTop:5}}>
                    <button onClick={() => onChange(i.key, -1)} style={{width:26,height:26,display:'grid',placeItems:'center',color:'var(--gold-ink)',fontWeight:700,cursor:'pointer'}}>−</button>
                    <span style={{minWidth:28,textAlign:'center',fontWeight:700,fontSize:'.88rem'}}>{i.qty}</span>
                    <button onClick={() => onChange(i.key, 1)} style={{width:26,height:26,display:'grid',placeItems:'center',color:'var(--gold-ink)',fontWeight:700,cursor:'pointer'}}>+</button>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',justifyContent:'space-between'}}>
                  <span style={{fontFamily:'var(--serif)',color:'var(--gold-ink)',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{money(lineTotal(i))}</span>
                  <button onClick={() => onRemove(i.key)} style={{fontSize:'.7rem',color:'var(--ink-mute)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.color='#e8836f')} onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-mute)')}>Remove</button>
                </div>
              </div>
            ))
          }
        </div>
        {cart.length > 0 && (
          <div style={{borderTop:'1px solid var(--line)',padding:'16px 22px',display:'flex',flexDirection:'column',gap:11,background:'var(--char)'}}>
            <div style={{display:'flex',gap:8,background:'var(--panel)',border:'1px solid var(--line)',borderRadius:9,padding:4}}>
              {(['delivery','pickup'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{flex:1,padding:'8px',borderRadius:7,fontWeight:700,fontSize:'.83rem',cursor:'pointer',border:'none',transition:'.2s',
                  background:mode===m?'linear-gradient(135deg,var(--gold-soft),var(--gold))':'transparent',
                  color:mode===m?'#22160a':'var(--ink-soft)'}}>
                  {m==='delivery'?'🛵 Delivery':'🥡 Pickup'}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <input value={couponInput} onChange={e=>setCouponInput(e.target.value)} placeholder="Coupon code" style={{flex:1,background:'var(--panel)',border:'1px solid var(--line)',borderRadius:8,padding:'9px 11px',color:'var(--ink)',fontSize:'.84rem',outline:'none',textTransform:'uppercase',fontFamily:'inherit'}} />
              <Btn variant="outline" size="sm" onClick={applyCoupon}>Apply</Btn>
            </div>
            {couponMsg && <span style={{fontSize:'.74rem',fontWeight:700,color:couponMsg.ok?'var(--leaf)':'#e8836f'}}>{couponMsg.text}</span>}
            <span style={{fontSize:'.7rem',color:'var(--ink-mute)'}}>Try WELCOME10 · BIRYANI50 · FEAST15</span>
            <div style={{display:'flex',flexDirection:'column',gap:5,fontSize:'.86rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-soft)'}}><span>Subtotal</span><span style={{fontVariantNumeric:'tabular-nums'}}>{money(sub)}</span></div>
              {disc > 0 && <div style={{display:'flex',justifyContent:'space-between',color:'var(--leaf)'}}><span>Discount</span><span style={{fontVariantNumeric:'tabular-nums'}}>−{money(disc)}</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-soft)'}}><span>GST (5%)</span><span style={{fontVariantNumeric:'tabular-nums'}}>{money(gst)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-soft)'}}><span>{mode==='delivery'?'Delivery':'Pickup'}</span><span style={{fontVariantNumeric:'tabular-nums'}}>{delivery?money(delivery):'FREE'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--line)',paddingTop:8,marginTop:2,fontFamily:'var(--serif)',fontSize:'1.18rem',fontWeight:600}}>
                <span>Total</span><b style={{color:'var(--gold-ink)',fontVariantNumeric:'tabular-nums'}}>{money(grand)}</b>
              </div>
            </div>
            <Btn block onClick={checkout} style={WHATSAPP_NUMBER?{background:'#25D366',borderColor:'#25D366',color:'#04310f'}:undefined}>
              {WHATSAPP_NUMBER ? `💬  Order on WhatsApp · ${money(grand)}` : `Proceed to Checkout · ${money(grand)}`}
            </Btn>
            {WHATSAPP_NUMBER && <span style={{fontSize:'.72rem',color:'var(--ink-mute)',textAlign:'center'}}>Opens WhatsApp with your order — we'll confirm and arrange {mode==='delivery'?'delivery':'pickup'}.</span>}
          </div>
        )}
      </aside>
    </>
  )
}

// ─── OPTIONS MODAL ────────────────────────────────────────────────────────────
function OptionsModal({ itemId, onClose, onConfirm }: { itemId: string|null; onClose: () => void; onConfirm: (it: FlatItem, portion: string, pmult: number, extras: {n:string;p:number}[], qty: number) => void }) {
  const [pIdx, setPIdx] = useState(1)
  const [extras, setExtras] = useState<Set<number>>(new Set())
  const [qty, setQty] = useState(1)
  const it = itemId ? itemById(itemId) : null
  useEffect(() => { if (it) { setPIdx(1); setExtras(new Set()); setQty(1) } }, [itemId])
  if (!it) return null
  const isBiry = it.filters.includes('Biryani') || it.filters.includes('combos')
  const portions = isBiry ? PORTIONS : PORTIONS.slice(0, 2)
  const exArr = [...extras].map(i => EXTRAS[i])
  const total = Math.round((it.price * portions[pIdx].m + exArr.reduce((s,e)=>s+e.p,0)) * qty)
  return (
    <div style={{position:'fixed',inset:0,zIndex:110,display:'grid',placeItems:'center',padding:20,background:'rgba(6,4,3,.75)',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div style={{background:'var(--char-2)',border:'1px solid var(--line-strong)',borderRadius:'var(--r)',width:'min(420px,100%)',overflow:'hidden',boxShadow:'var(--shadow-lg)',animation:'pop .28s cubic-bezier(.2,.8,.2,1)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'relative',aspectRatio:'16/9',background:'linear-gradient(150deg,var(--panel-2),var(--char))',display:'grid',placeItems:'center',fontSize:'3rem',overflow:'hidden'}}>
          <img src={kwPhoto(it.type,600,340,it.id)} alt={it.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.85}} />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,7,5,.8),transparent 60%)'}} />
          <button onClick={onClose} aria-label="Close" style={{position:'absolute',top:12,right:14,fontSize:'1.4rem',cursor:'pointer',border:'none',background:'rgba(0,0,0,.4)',borderRadius:8,padding:'4px 8px',color:'var(--ink)'}}>✕</button>
        </div>
        <div style={{padding:22}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><Vind type={it.type} /><h3 style={{fontSize:'1.35rem'}}>{it.name}</h3></div>
          <p style={{color:'var(--ink-soft)',fontSize:'.88rem',marginBottom:18}}>{it.desc ?? autoDesc(it)}</p>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-mute)',marginBottom:9}}>Portion</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {portions.map((p, i) => (
                <button key={i} onClick={() => setPIdx(i)} style={{border:`1px solid ${i===pIdx?'var(--gold)':'var(--line)'}`,borderRadius:9,padding:'8px 13px',fontSize:'.84rem',fontWeight:600,cursor:'pointer',transition:'.18s',background:i===pIdx?'rgba(201,162,75,.12)':'transparent',color:i===pIdx?'var(--ink)':'var(--ink-soft)'}}>
                  {p.n} <span style={{color:'var(--gold-ink)',fontSize:'.78rem'}}>{money(Math.round(it.price * p.m))}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:6}}>
            <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-mute)',marginBottom:8}}>Add Extras</div>
            {EXTRAS.map((x, i) => (
              <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px dashed var(--line)',cursor:'pointer'}}>
                <input type="checkbox" checked={extras.has(i)} onChange={e => { const s=new Set(extras); e.target.checked?s.add(i):s.delete(i); setExtras(s) }} style={{accentColor:'var(--gold-deep)',width:16,height:16}} />
                <span style={{flex:1,fontSize:'.88rem'}}>{x.n}</span>
                <span style={{color:'var(--gold-ink)',fontSize:'.83rem'}}>{x.p ? '+'+money(x.p) : 'Free'}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{padding:'0 22px 22px',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',border:'1px solid var(--line-strong)',borderRadius:9,overflow:'hidden'}}>
            <button onClick={() => setQty(q => Math.max(1,q-1))} style={{width:38,height:38,display:'grid',placeItems:'center',color:'var(--gold-ink)',fontWeight:700,cursor:'pointer',fontSize:'1.1rem'}}>−</button>
            <span style={{minWidth:38,textAlign:'center',fontWeight:700}}>{qty}</span>
            <button onClick={() => setQty(q => q+1)} style={{width:38,height:38,display:'grid',placeItems:'center',color:'var(--gold-ink)',fontWeight:700,cursor:'pointer',fontSize:'1.1rem'}}>+</button>
          </div>
          <Btn style={{flex:1}} onClick={() => { onConfirm(it, portions[pIdx].n, portions[pIdx].m, exArr, qty); onClose() }}>
            Add · {money(total)}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg }: { msg: {title:string;sub:string;visible:boolean} }) {
  return (
    <div style={{position:'fixed',bottom:26,left:'50%',zIndex:130,background:'var(--char-2)',border:'1px solid var(--line-strong)',borderRadius:12,padding:'13px 20px',display:'flex',gap:12,alignItems:'center',boxShadow:'var(--shadow)',maxWidth:'90vw',pointerEvents:'none',
      animation: msg.visible ? 'toastIn .4s cubic-bezier(.2,.8,.2,1) both' : 'toastOut .3s ease both',
    }}>
      <span style={{width:26,height:26,borderRadius:'50%',background:'var(--leaf)',display:'grid',placeItems:'center',color:'#fff',flexShrink:0,fontSize:'.88rem'}}>✓</span>
      <div><b style={{color:'var(--ink)',display:'block'}}>{msg.title}</b><small style={{color:'var(--ink-mute)'}}>{msg.sub}</small></div>
    </div>
  )
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
const NAV_LINKS: {label: string; view: ViewKey}[] = [
  {label:'Home',view:'home'},{label:'About',view:'about'},{label:'Menu',view:'menu'},
  {label:'Signature',view:'signature'},{label:'Gallery',view:'gallery'},
  {label:'Locations',view:'locations'},{label:'Reserve',view:'reservation'},{label:'Contact',view:'contact'},
]
function Header({ currentView, cartCount: count, onNav, theme, onToggleTheme, onOpenCart }: {
  currentView: ViewKey; cartCount: number; onNav: (v: ViewKey) => void
  theme: string; onToggleTheme: () => void; onOpenCart: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, {passive:true})
    return () => window.removeEventListener('scroll', h)
  }, [])
  const linkStyle = (v: ViewKey): React.CSSProperties => ({
    padding:'.52em .68em',fontWeight:600,fontSize:'.86rem',color: currentView===v?'var(--ink)':'var(--ink-soft)',
    borderRadius:8,cursor:'pointer',position:'relative',transition:'color .18s',
    textDecoration:'none',border:'none',background:'none',fontFamily:'inherit',
  })
  return (
    <>
      <header style={{position:'sticky',top:0,zIndex:60,transition:'background .3s,border-color .3s,box-shadow .3s',background:scrolled?'color-mix(in oklab,var(--paper) 88%,transparent)':'color-mix(in oklab,var(--paper) 40%,transparent)',backdropFilter:'blur(14px) saturate(1.1)',borderBottom:scrolled?'1px solid var(--line)':'1px solid transparent',boxShadow:scrolled?'0 8px 28px -20px rgba(0,0,0,.5)':'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'13px 24px',maxWidth:1320,margin:'0 auto'}}>
          <button onClick={() => onNav('home')} style={{display:'flex',alignItems:'center',gap:11,marginRight:'auto',border:'none',background:'none',cursor:'pointer'}}>
            <BrandMark size={48} />
            <span style={{display:'flex',flexDirection:'column',lineHeight:1,textAlign:'left'}}>
              <b style={{fontFamily:'var(--serif)',fontWeight:600,fontSize:'1.22rem',color:'var(--ink)'}}>{BRAND}</b>
              <small style={{fontFamily:'var(--sans)',fontWeight:600,fontSize:'.56rem',letterSpacing:'.3em',textTransform:'uppercase',color:'var(--gold-ink)',marginTop:3}}>Chettinad · Biryani · Grill</small>
            </span>
          </button>
          <nav className="desk-nav" style={{display:'flex',alignItems:'center',gap:2}}>
            {NAV_LINKS.map(({label, view}) => (
              <button key={view} onClick={() => onNav(view)} style={linkStyle(view)}>{label}</button>
            ))}
          </nav>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={onToggleTheme} title="Toggle theme" aria-label="Toggle light or dark theme" style={{width:40,height:40,borderRadius:9,border:'1px solid var(--line)',display:'grid',placeItems:'center',color:'var(--ink-soft)',cursor:'pointer',transition:'.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold-ink)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.color='var(--ink-soft)'}}>
              {theme==='dark'?<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v1M12 20v1M4.2 4.2l.7.7M19.1 19.1l.7.7M3 12h1M20 12h1M4.2 19.8l.7-.7M19.1 4.9l.7-.7"/><circle cx="12" cy="12" r="4.2"/></svg>
              :<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>}
            </button>
            <button onClick={onOpenCart} style={{position:'relative',width:40,height:40,borderRadius:9,border:'1px solid var(--line)',display:'grid',placeItems:'center',color:'var(--ink-soft)',cursor:'pointer',transition:'.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold-ink)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.color='var(--ink-soft)'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 8H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/></svg>
              {count > 0 && <span style={{position:'absolute',top:-7,right:-7,minWidth:19,height:19,padding:'0 4px',borderRadius:999,background:'var(--leaf)',color:'#fff',fontSize:'.64rem',fontWeight:800,display:'grid',placeItems:'center',border:'2px solid var(--paper)'}}>{count}</span>}
            </button>
            <span className="desk-nav"><Btn onClick={() => onNav('order')}>Order Online</Btn></span>
            <button onClick={() => setMobileOpen(true)} className="mobile-ham" aria-label="Open menu" aria-expanded={mobileOpen} style={{width:40,height:40,borderRadius:9,border:'1px solid var(--line)',placeItems:'center',cursor:'pointer',color:'var(--ink-soft)'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <div style={{position:'fixed',inset:0,zIndex:80,background:'var(--char)',display:'flex',flexDirection:'column',padding:22}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
            <span style={{display:'flex',alignItems:'center',gap:10}}>
              <BrandMark size={40} />
              <span style={{fontFamily:'var(--serif)',fontWeight:600,fontSize:'1.18rem',color:'var(--ink)'}}>{BRAND}</span>
            </span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" style={{width:38,height:38,borderRadius:9,border:'1px solid var(--line)',display:'grid',placeItems:'center',cursor:'pointer',fontSize:'1.1rem',color:'var(--ink-soft)'}}>✕</button>
          </div>
          {NAV_LINKS.map(({label, view}) => (
            <button key={view} onClick={() => { onNav(view); setMobileOpen(false) }} style={{padding:'15px 0',fontFamily:'var(--serif)',fontSize:'1.45rem',color:'var(--ink-soft)',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',alignItems:'center',border:'none',background:'none',cursor:'pointer',textAlign:'left'}}>{label}<span style={{color:'var(--gold-ink)',opacity:.5}}>→</span></button>
          ))}
          <div style={{marginTop:'auto',paddingTop:20,display:'flex',gap:10}}>
            <Btn variant="outline" style={{flex:1}} onClick={() => { onNav('menu'); setMobileOpen(false) }}>See Menu</Btn>
            <Btn style={{flex:1}} onClick={() => { onNav('order'); setMobileOpen(false) }}>Order Online</Btn>
          </div>
        </div>
      )}
    </>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ onNav }: { onNav: (v: ViewKey) => void }) {
  const cols: {h:string; links:{l:string; v:ViewKey|null; href?:string}[]}[] = [
    {h:'Explore',links:[{l:'Home',v:'home'},{l:'About Us',v:'about'},{l:'Full Menu',v:'menu'},{l:'Signature Dishes',v:'signature'},{l:'Gallery',v:'gallery'}]},
    {h:'Order & Visit',links:[{l:'Order Online',v:'order'},{l:'Reserve a Table',v:'reservation'},{l:'Locations',v:'locations'},{l:'Contact Us',v:'contact'}]},
    {h:'Visit Us',links:[{l:'50, Madukkarai Main Rd, Machampalayam, Coimbatore 641024',v:null,href:MAPS_MAIN},{l:'Get directions on Google Maps',v:null,href:MAPS_MAIN},{l:'Open daily · Closes 11:00 PM',v:null},{l:'Rated 4.8★ · 24 Google reviews',v:null}]},
  ]
  return (
    <footer style={{background:'linear-gradient(var(--char-2),var(--char-3))',borderTop:'1px solid var(--line-strong)',padding:'60px 0 28px',marginTop:20}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1.2fr',gap:36,marginBottom:44}}>
          <div>
            <button onClick={() => onNav('home')} style={{display:'flex',alignItems:'center',gap:10,border:'none',background:'none',cursor:'pointer',marginBottom:14}}>
              <BrandMark size={44} />
              <span style={{fontFamily:'var(--serif)',fontWeight:600,fontSize:'1.16rem',color:'var(--ink)'}}>{BRAND}</span>
            </button>
            <p style={{color:'var(--ink-soft)',fontSize:'.88rem',lineHeight:1.65}}>A premium South Indian non-vegetarian & multi-cuisine family restaurant on Madukkarai Main Road, Machampalayam, Coimbatore. Authentic Tamil Nadu flavours — biryani, seafood, tandoor and Indo-Chinese, cooked fresh with hand-ground spices.</p>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              {['Instagram','Facebook','WhatsApp'].map(s => (
                <a key={s} href="#" onClick={e=>e.preventDefault()} title={s} aria-label={s} style={{width:38,height:38,borderRadius:9,border:'1px solid var(--line)',display:'grid',placeItems:'center',color:'var(--ink-soft)',transition:'.2s'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--gold)';el.style.color='var(--gold-ink)';el.style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--line)';el.style.color='var(--ink-soft)';el.style.transform=''}}>
                  {s==='Instagram'?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  :s==='Facebook'?<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5Z"/></svg>
                  :<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm4.4 12c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3 0-.4l-.7-1.6c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6 9.3c0 1.6 1.2 3.2 1.4 3.4.2.2 2.3 3.6 5.6 4.9 2.8 1.1 2.8.7 3.3.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>}
                </a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <h4 style={{fontFamily:'var(--sans)',fontWeight:800,fontSize:'.74rem',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--gold-ink)',marginBottom:16}}>{col.h}</h4>
              {col.links.map(({l,v,href}) => (
                href ? <a key={l} href={href} target="_blank" rel="noopener noreferrer" style={{display:'block',color:'var(--ink-soft)',fontSize:'.88rem',padding:'4px 0',transition:'.18s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='var(--gold-ink)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-soft)')}>{l}</a>
                : v ? <button key={l} onClick={() => onNav(v)} style={{display:'block',color:'var(--ink-soft)',fontSize:'.88rem',padding:'4px 0',cursor:'pointer',border:'none',background:'none',textAlign:'left',transition:'.18s',fontFamily:'inherit'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='var(--gold-ink)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-soft)')}>{l}</button>
                : <span key={l} style={{display:'block',color:'var(--ink-soft)',fontSize:'.88rem',padding:'4px 0'}}>{l}</span>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid var(--line)',paddingTop:24,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,color:'var(--ink-mute)',fontSize:'.8rem'}}>
          <span>© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
          <span style={{display:'flex',gap:12}}>
            <button onClick={() => onNav('privacy')} style={{color:'var(--ink-mute)',cursor:'pointer',border:'none',background:'none',fontFamily:'inherit',fontSize:'.8rem'}}>Privacy Policy</button>
            <span>·</span>
            <button onClick={() => onNav('terms')} style={{color:'var(--ink-mute)',cursor:'pointer',border:'none',background:'none',fontFamily:'inherit',fontSize:'.8rem'}}>Terms & Conditions</button>
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── FLOATERS ─────────────────────────────────────────────────────────────────
function Floaters({ onNav }: { onNav: (v: ViewKey) => void }) {
  return (
    <div style={{position:'fixed',right:18,bottom:18,zIndex:70,display:'flex',flexDirection:'column',gap:10}}>
      {[
        {label:'WhatsApp',bg:'#25a95a',icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Z"/></svg>,href:WHATSAPP_NUMBER?waLink(`Hi ${BRAND}, I have a question.`):'#'},
        {label:'Get directions',bg:'linear-gradient(135deg,var(--burg),var(--maroon))',icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>,href:MAPS_MAIN},
      ].map(({label,bg,icon,href}) => (
        <a key={label} href={href} target={href==='#'?undefined:'_blank'} rel={href==='#'?undefined:'noopener noreferrer'} onClick={href==='#'?e=>e.preventDefault():undefined} title={label} aria-label={label} style={{width:50,height:50,borderRadius:'50%',display:'grid',placeItems:'center',color:'#fff',background:bg,boxShadow:'0 10px 24px -8px rgba(0,0,0,.7)',transition:'transform .22s',textDecoration:'none'}}
          onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.1) translateY(-2px)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
          {icon}
        </a>
      ))}
      <button onClick={() => onNav('order')} title="Order online" aria-label="Order online" style={{display:'flex',alignItems:'center',gap:8,height:52,padding:'0 20px',borderRadius:999,background:'linear-gradient(135deg,var(--gold-soft),var(--gold-deep))',color:'#22160a',boxShadow:'0 12px 26px -8px rgba(0,0,0,.75)',transition:'transform .22s',cursor:'pointer',border:'none',fontFamily:'var(--serif)',fontWeight:800,fontSize:'.98rem',letterSpacing:'.01em'}}
        onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.06) translateY(-2px)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Order
      </button>
    </div>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<ViewKey>('home')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalItemId, setModalItemId] = useState<string|null>(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('theme333')
      if (saved === 'light' || saved === 'dark') return saved
    } catch { /* ignore */ }
    return 'light' // warm, appetizing light theme is the default look
  })
  const [toast, setToast] = useState({title:'',sub:'',visible:false})
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme333', theme) } catch { /* ignore */ }
  }, [theme])
  const showToast = useCallback((title: string, sub: string) => {
    setToast({title,sub,visible:true})
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({...t,visible:false})), 2400)
  }, [])
  const navTo = useCallback((v: ViewKey) => {
    setView(v)
    window.scrollTo({top:0,behavior:'instant' as ScrollBehavior})
  }, [])
  const openOptions = useCallback((id: string) => { setModalItemId(id) }, [])
  const addToCart = useCallback((it: FlatItem, portion: string, pmult: number, extras: {n:string;p:number}[], qty: number) => {
    const exKey = extras.map(e=>e.n).sort().join(',')
    const key = it.id + '|' + portion + '|' + exKey
    setCart(prev => {
      const found = prev.find(c => c.key === key)
      if (found) return prev.map(c => c.key===key ? {...c,qty:c.qty+qty} : c)
      return [...prev, {key,id:it.id,name:it.name,type:it.type,portion,pmult,base:it.price,extras,qty}]
    })
    showToast(it.name, `${qty} × ${portion} added to your cart`)
  }, [showToast])
  const changeQty = useCallback((key: string, d: number) => {
    setCart(prev => prev.map(c=>c.key===key?{...c,qty:c.qty+d}:c).filter(c=>c.qty>0))
  }, [])
  const removeItem = useCallback((key: string) => {
    setCart(prev => prev.filter(c=>c.key!==key))
  }, [])
  const count = cartCount(cart)
  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView onNav={navTo} onAdd={openOptions} />
      case 'about': return <AboutView onNav={navTo} />
      case 'menu': return <MenuView onAdd={openOptions} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
      case 'signature': return <SignatureView onNav={navTo} onAdd={openOptions} />
      case 'gallery': return <GalleryView />
      case 'locations': return <LocationsView onNav={navTo} />
      case 'reservation': return <ReservationView onNav={navTo} />
      case 'contact': return <ContactView onNav={navTo} />
      case 'order': return <OrderView cart={cart} onAdd={openOptions} onOpenCart={() => setDrawerOpen(true)} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
      case 'privacy': return <PolicyView type="privacy" onNav={navTo} />
      case 'terms': return <PolicyView type="terms" onNav={navTo} />
    }
  }
  return (
    <div style={{minHeight:'100%',display:'flex',flexDirection:'column'}}>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header currentView={view} cartCount={count} onNav={navTo} theme={theme} onToggleTheme={() => setTheme(t => t==='dark'?'light':'dark')} onOpenCart={() => setDrawerOpen(true)} />
      <main id="main" tabIndex={-1} style={{flex:1,outline:'none'}}>{renderView()}</main>
      <Footer onNav={navTo} />
      <CartDrawer cart={cart} open={drawerOpen} onClose={() => setDrawerOpen(false)} onNav={navTo} onChange={changeQty} onRemove={removeItem} />
      <OptionsModal itemId={modalItemId} onClose={() => setModalItemId(null)} onConfirm={addToCart} />
      <Floaters onNav={navTo} />
      {toast.visible && <Toast msg={toast} />}
    </div>
  )
}
