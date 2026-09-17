import { useState, useEffect, useRef, useCallback } from 'react'
import logo from './assets/logo.png'
import fBiryani from './assets/food/biryani.jpg'
import fChicken from './assets/food/chicken.jpg'
import fNattukozhi from './assets/food/nattukozhi.jpg'
import fKaadai from './assets/food/kaadai.jpg'
import fMutton from './assets/food/mutton.jpg'
import fGrill from './assets/food/grill.jpg'
import fTandoori from './assets/food/tandoori.jpg'
import fFish from './assets/food/fish.jpg'
import fPrawn from './assets/food/prawn.jpg'
import fCrab from './assets/food/crab.jpg'
import fPaneer from './assets/food/paneer.jpg'
import fVeg from './assets/food/veg.jpg'
import fFriedrice from './assets/food/friedrice.jpg'
import fNoodles from './assets/food/noodles.jpg'
import fMomos from './assets/food/momos.jpg'
import fBreads from './assets/food/breads.jpg'
import fSoup from './assets/food/soup.jpg'
import fBeverages from './assets/food/beverages.jpg'

// Category food photos keyed by menu section id
const FOOD: Record<string, string> = {
  specials:fChicken, soups:fSoup, 'chicken-oilfried':fChicken, 'chicken-boneless':fChicken,
  nattukozhi:fNattukozhi, kaadai:fKaadai, mutton:fMutton, grilled:fGrill, alfaham:fGrill,
  tandoori:fTandoori, fish:fFish, prawn:fPrawn, crab:fCrab, gobi:fVeg, mushroom:fVeg,
  paneer:fPaneer, babycorn:fVeg, biryani:fBiryani, 'nv-friedrice':fFriedrice, 'veg-friedrice':fFriedrice,
  'nv-noodles':fNoodles, 'veg-noodles':fNoodles, momos:fMomos, parotta:fBreads, naan:fBreads,
  roti:fBreads, kulcha:fBreads, beverages:fBeverages,
}
// Best photo for a dish: veg specials get the paneer shot, else by section.
const foodPhoto = (sec: string, type?: string): string =>
  (sec === 'specials' && type === 'veg') ? fPaneer : (FOOD[sec] ?? fChicken)

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
// Brand-colored gradient panels instead of stock photos (no external/irrelevant images).
// Real photos can replace these later. Tone varies by key for subtle variety.
const photoUrl = (key = '', _w = 800, _h = 600) => {
  const pairs = [['5a0f1e','7c1d2b'],['7c1d2b','96263a'],['3a2a12','6f5210'],['5a0f1e','a07c2e'],['201613','5a0f1e']]
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  const [a, b] = pairs[h % pairs.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='30'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23${a}'/><stop offset='1' stop-color='%23${b}'/></linearGradient></defs><rect width='40' height='30' fill='url(%23g)'/></svg>`
  return `data:image/svg+xml,${svg}`
}

// Per-dish photos. Each dish type has a matching keyword so no two sections share one photo.
// TIP: for the real launch, drop your own dish photos into /public and point these at them.
const DISH_KW: Record<string, string> = {
  veg: 'paneer', chicken: 'chicken', mutton: 'mutton', seafood: 'prawn', egg: 'omelette',
  biryani: 'biryani', bread: 'naan', tandoor: 'kebab', soup: 'soup', dessert: 'dessert',
  drink: 'juice', combo: 'thali', chinese: 'noodles',
}
const seedOf = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 100000 }
// Per-dish photos are disabled (return empty) so every dish shows a clean icon tile
// instead of random/irrelevant stock images. Real dish photos can be dropped in later.
const kwPhoto = (_type: string, _w?: number, _h?: number, _seed?: string) => ''
const dishPhoto = (_type: string, _w = 800, _h = 600) => ''
void seedOf; void DISH_KW

type MenuSection = {
  id: string; title: string; sub?: string; filters?: string[]
  groups?: { label: string; items: (string|number)[][] }[]
  items?: (string|number)[][]
  type?: string
}

const MENU: MenuSection[] = [
  {id:'specials',title:'333 Specials',sub:'Our signature house creations',filters:[],groups:[
    {label:'Non-Veg Specials',items:[
      ['Texas Chicken','chicken',2,350,'House signature'],['Chicken Popcorn','chicken',2,250],
      ['Navaratna Chicken','chicken',2,320],['Kashmiri Chicken with Omelette Roll','chicken',2,350],
      ['Injipuli Chicken','chicken',3,200],['Japan Chicken','chicken',2,300],['Maharaja Chicken','chicken',2,150]]},
    {label:'Veg Specials',items:[
      ['Veg Popcorn','veg',1,200],['Paneer 50/50','veg',1,250],['Paneer Dice Cube','veg',1,300],
      ['Mushroom Chilli Honey','veg',2,200],['Paneer Finger','veg',1,200]]}
  ]},
  {id:'soups',title:'Soups',sub:'Slow-simmered, warming starts',filters:[],items:[
    ['Veg Soup','veg',0,50],['Mushroom Soup','veg',0,70],['Chicken Soup','chicken',0,70],
    ['Nattukozhi Soup','chicken',2,80,'Country chicken, slow-boiled'],['Mutton Leg Soup','mutton',2,70],
    ['Crab Soup','seafood',2,90]]},
  {id:'chicken-oilfried',title:'Chicken · Oil Fried (Boneless)',sub:'Fry-shop favourites, freshly tossed',filters:[],type:'chicken',items:[
    ['Chilly Chicken','chicken',2,140],['Chicken 65','chicken',2,180,'Crisp, curry-leaf tossed — signature'],
    ['Chicken Lollipop (4 Pcs)','chicken',2,160],['Chicken Leg Piece','chicken',1,80],
    ['Chicken 777','chicken',3,240],['Bullet Chicken','chicken',3,220],['Chicken Hot Pepper','chicken',3,240],
    ['Moru Moru Chicken','chicken',2,240,'Extra-crisp fried chicken'],['Wings Chilli','chicken',2,150],
    ['Wings Hot Pepper','chicken',3,180],['Moru Moru Wings','chicken',2,220]]},
  {id:'chicken-boneless',title:'Chicken · Boneless (Dry & Gravy)',sub:'Choose dry or gravy',filters:[],type:'chicken',items:[
    ['Chettinadu Chicken (Gravy)','chicken',3,250,'Roasted spice, coconut base'],
    ['Pallipalayam Chicken (Dry)','chicken',3,220,'Kongu-style, coconut & chilli'],['Pallipalayam Chicken (Gravy)','chicken',3,250],
    ['Pepper Chicken (Dry)','chicken',3,220],['Pepper Chicken (Gravy)','chicken',3,250],
    ['Hydrabad Chicken (Dry)','chicken',2,220],['Hydrabad Chicken (Gravy)','chicken',2,250],
    ['Kerala Fried Chicken','chicken',2,220],
    ['Maharani Chicken (Dry)','chicken',2,220],['Maharani Chicken (Gravy)','chicken',2,250],
    ['Butter Chicken (Gravy)','chicken',1,250],
    ['Chicken Manchurian (Dry)','chicken',1,220],['Chicken Manchurian (Gravy)','chicken',1,250],
    ['Dragon Chicken','chicken',2,220],['Chicken Tikka Masala (Gravy)','chicken',2,250],
    ['Kadaai Chicken Masala (Gravy)','chicken',2,250],['Uppukari','chicken',2,220],
    ['Chinthamani Chicken','chicken',3,240],
    ['Chicken Chukka (Dry)','chicken',3,220,'Dry-roasted, masala coated'],['Chicken Chukka (Gravy)','chicken',3,250]]},
  {id:'nattukozhi',title:'Country Chicken · Nattukozhi',sub:'',filters:[],type:'chicken',items:[
    ['Nattukozhi Chettinadu (Gravy)','chicken',3,220],
    ['Nattukozhi Pallipalayam (Dry)','chicken',3,190],['Nattukozhi Pallipalayam (Gravy)','chicken',3,220],
    ['Nattukozhi Pepper (Dry)','chicken',3,190],['Nattukozhi Pepper (Gravy)','chicken',3,220],
    ['Nattukozhi Chukka (Dry)','chicken',3,190],['Nattukozhi Chukka (Gravy)','chicken',3,220]]},
  {id:'kaadai',title:'Quail · Kaadai',sub:'',filters:[],type:'chicken',items:[
    ['Kaadai Roast (Oil Fry)','chicken',2,150],['Kaadai Chilly (Oil Fry)','chicken',2,150],
    ['Kaadai (Dry)','chicken',2,170],['Kaadai (Gravy)','chicken',2,200],
    ['Kaadai Pepper (Dry)','chicken',3,190],['Kaadai Pepper (Gravy)','chicken',3,200],['Kaadai 65','chicken',2,170]]},
  {id:'mutton',title:'Mutton · Boneless',sub:'Chettinad heat, tender cuts',filters:[],type:'mutton',items:[
    ['Mutton Brain','mutton',2,160],
    ['Mutton Liver (Dry)','mutton',2,180],['Mutton Liver (Gravy)','mutton',2,210],
    ['Mutton Thalakari (Dry)','mutton',2,160],['Mutton Thalakari (Gravy)','mutton',2,190],
    ['Mutton Kudal (Dry)','mutton',2,160],['Mutton Kudal (Gravy)','mutton',2,190],
    ['Mutton Kudal Pepper (Dry)','mutton',3,180],['Mutton Kudal Pepper (Gravy)','mutton',3,210],
    ['Mutton Chukka (Dry)','mutton',3,230,'Dry, black-pepper forward — signature'],['Mutton Chukka (Gravy)','mutton',3,260],
    ['Mutton Kadaai Masala (Gravy)','mutton',3,290]]},
  {id:'grilled',title:'Grilled Chicken',sub:'Charcoal char, half or full',filters:['Tandoor'],type:'chicken',items:[
    ['Grilled Chicken (Half)','chicken',2,200],['Grilled Chicken (Full)','chicken',2,380],
    ['Pepper Grilled Chicken (Half)','chicken',3,220],['Pepper Grilled Chicken (Full)','chicken',3,420]]},
  {id:'alfaham',title:'Alfaham',sub:'Arabian charcoal grill, half or full',filters:['Tandoor'],type:'chicken',items:[
    ['Alfaham (Half)','chicken',2,200],['Alfaham (Full)','chicken',2,380],
    ['Spicy Alfaham (Half)','chicken',3,220],['Spicy Alfaham (Full)','chicken',3,420],
    ['Peri Peri Alfaham (Half)','chicken',3,220],['Peri Peri Alfaham (Full)','chicken',3,420],
    ['Honey Alfaham (Half)','chicken',1,240],['Honey Alfaham (Full)','chicken',1,460],
    ['Pepper Alfaham (Half)','chicken',3,220],['Pepper Alfaham (Full)','chicken',3,420]]},
  {id:'tandoori',title:'Tandoori · Veg & Non-Veg',sub:'Clay-oven smoke',filters:['Tandoor'],items:[
    ['Tandoori Chicken (Half)','chicken',2,220,'Yoghurt-marinated'],['Tandoori Chicken (Full)','chicken',2,420],
    ['Pepper Tandoori (Half)','chicken',3,240],['Pepper Tandoori (Full)','chicken',3,460],
    ['Chicken Tikka (8 Pcs)','chicken',2,220],['Fish Tikka','seafood',2,240],['Panneer Tikka (8 Pcs)','veg',1,240]]},
  {id:'fish',title:'Seafood · Fish',sub:'From the coast, fried & curried',filters:['Seafood'],type:'seafood',items:[
    ['Vaval Fish (Dry)','seafood',2,60],['Vaval Fish (Gravy)','seafood',2,150],
    ['Nethili Fish (Dry)','seafood',2,120,'Crisp anchovies'],['Nethili Fish (Gravy)','seafood',2,180],
    ['Fish Boneless (Dry)','seafood',2,140],['Fish Boneless (Gravy)','seafood',2,200],
    ['Fish Manchurian (Dry)','seafood',1,180],['Fish Manchurian (Gravy)','seafood',1,210],
    ['Fish 65 (Boneless)','seafood',2,180],['Fish 85 (Boneless)','seafood',2,180],
    ['Fish Pepper (Boneless)','seafood',3,200],['Fish Hot Pepper (Boneless)','seafood',3,220],
    ['Fish Finger','seafood',2,220],['Vanjaram Fish','seafood',2,180,'Seer fish, tawa-fried — signature']]},
  {id:'prawn',title:'Seafood · Prawn',sub:'',filters:['Seafood'],type:'seafood',items:[
    ['Prawn Chilly','seafood',2,200],
    ['Prawn Masala (Dry)','seafood',2,200,'Coastal masala'],['Prawn Masala (Gravy)','seafood',2,230],
    ['Prawn Pepper (Dry)','seafood',3,220],['Prawn Pepper (Gravy)','seafood',3,250],
    ['Prawn Hot Pepper Fry','seafood',3,240],['Prawn 65','seafood',2,240],
    ['Prawn Manchurian (Dry)','seafood',1,240],['Prawn Manchurian (Gravy)','seafood',1,270]]},
  {id:'crab',title:'Seafood · Crab',sub:'',filters:['Seafood'],type:'seafood',items:[
    ['Crab (Dry)','seafood',3,220,'Whole crab, thick masala'],['Crab (Gravy)','seafood',3,250],
    ['Crab Pepper (Dry)','seafood',3,240],['Crab Pepper (Gravy)','seafood',3,270]]},
  {id:'gobi',title:'Veg · Gobi',sub:'',filters:[],type:'veg',items:[
    ['Gobi Masala (Gravy)','veg',1,200],['Gobi Manchurian (Dry)','veg',1,170],['Gobi Manchurian (Gravy)','veg',1,200],
    ['Gobi Chilly','veg',2,110],['Gobi 65','veg',2,120],['Gobi Hot Pepper','veg',3,140]]},
  {id:'mushroom',title:'Veg · Mushroom',sub:'',filters:[],type:'veg',items:[
    ['Mushroom Masala (Gravy)','veg',1,200],['Mushroom Kadaai (Gravy)','veg',2,220],
    ['Mushroom Manchurian (Dry)','veg',1,180],['Mushroom Manchurian (Gravy)','veg',1,210],
    ['Mushroom Chilly','veg',2,130],['Mushroom 65','veg',2,140],['Mushroom Hot Pepper','veg',3,160]]},
  {id:'paneer',title:'Veg · Paneer & Vegetables',sub:'',filters:[],type:'veg',items:[
    ['Paneer Masala (Gravy)','veg',1,210],['Paneer Pepper (Dry)','veg',2,200],['Paneer Pepper (Gravy)','veg',2,230],
    ['Paneer Kadaai (Gravy)','veg',2,240],['Paneer Manchurian (Dry)','veg',1,200],['Paneer Manchurian (Gravy)','veg',1,230],
    ['Paneer Chilly','veg',2,150],['Paneer 65','veg',2,170],['Paneer Hot Pepper','veg',3,200],
    ['Paneer Butter Masala (Gravy)','veg',1,200],['Mixed Vegetable Gravy','veg',1,200],['Green Peas Masala (Gravy)','veg',1,160]]},
  {id:'babycorn',title:'Veg · Baby Corn',sub:'',filters:[],type:'veg',items:[
    ['Baby Corn Chilli','veg',2,100],['Baby Corn 65','veg',2,110],['Baby Corn Hot Pepper Fry','veg',3,140],['Baby Corn Masala (Gravy)','veg',1,160]]},
  {id:'biryani',title:'Biryani',sub:'Sealed & dum-cooked, unlimited',filters:['Biryani'],items:[
    ['Chicken Biriyani (With Egg)','biryani',2,150,'House biryani, served with egg'],
    ['Chilli Biriyani (With Egg)','biryani',2,150],['Chicken 65 Biriyani (With Egg)','biryani',2,170],
    ['Gilma Biriyani','biryani',3,200,'333 special — rich & spicy'],['Mutton Biriyani (Boneless)','biryani',2,270],
    ['Nattukozhi Biryani','biryani',3,230,'Country chicken biryani'],['Empty Biriyani','veg',1,100,'Plain flavoured biryani rice'],
    ['Chicken Biriyani (1 Kg)','biryani',2,300],['Chicken Biriyani (2 Kg)','biryani',2,600],
    ['Chilli Biriyani (1 Kg)','biryani',2,325],['Chilli Biriyani (2 Kg)','biryani',2,650],
    ['Chicken 65 Biriyani (1 Kg)','biryani',2,350],['Chicken 65 Biriyani (2 Kg)','biryani',2,700],
    ['Mutton Biriyani (1 Kg)','biryani',2,550],['Mutton Biriyani (2 Kg)','biryani',2,1100],
    ['Grilled Biriyani Combo (2 Person)','biryani',2,350],['Grilled Biriyani Combo (4 Person)','biryani',2,700],
    ['Tandoori Biriyani Combo (2 Person)','biryani',2,375],['Tandoori Biriyani Combo (4 Person)','biryani',2,750],
    ['Alfaham Biriyani Combo (2 Person)','biryani',2,350],['Alfaham Biriyani Combo (4 Person)','biryani',2,700]]},
  {id:'nv-friedrice',title:'Non-Veg Fried Rice',sub:'',filters:['Chinese'],items:[
    ['Egg Fried Rice','egg',1,100],['Chicken Fried Rice','chicken',1,130],['Prawn Fried Rice','seafood',1,160],
    ['Fish Fried Rice','seafood',1,160],['Chicken Pulao','chicken',1,160]]},
  {id:'veg-friedrice',title:'Veg Fried Rice',sub:'',filters:['Chinese'],type:'veg',items:[
    ['Veg Fried Rice','veg',1,80],['Cauliflower Fried Rice','veg',1,90],['Mushroom Fried Rice','veg',1,110],
    ['Panneer Fried Rice','veg',1,150],['Mixed Veg Fried Rice','veg',1,130],['Ghee Fried Rice','veg',0,140],['Jeera Fried Rice','veg',0,120]]},
  {id:'nv-noodles',title:'Non-Veg Noodles',sub:'',filters:['Chinese'],items:[
    ['Egg Noodles','egg',1,100],['Chicken Noodles','chicken',1,130],['Prawn Noodles','seafood',1,160],
    ['Fish Noodles','seafood',1,160],['Mixed Non-Veg Noodles','chicken',1,160]]},
  {id:'veg-noodles',title:'Veg Noodles',sub:'',filters:['Chinese'],type:'veg',items:[
    ['Veg Noodles','veg',1,80],['Gobi Noodles','veg',1,90],['Mushroom Noodles','veg',1,110],
    ['Panneer Noodles','veg',1,150],['Mixed Veg Noodles','veg',1,150]]},
  {id:'momos',title:'Momos',sub:'Steamed & fried, 8 pcs',filters:[],items:[
    ['Chicken Momos (Steam · 8 Pcs)','chicken',1,180],['Chicken Fried Momos (8 Pcs)','chicken',1,200],
    ['Chinese Chicken Momos (8 Pcs)','chicken',2,220],['Paneer Momos (8 Pcs)','veg',1,220],['Mix Veg Momos (8 Pcs)','veg',1,170]]},
  {id:'parotta',title:'Parotta Varieties',sub:'Flaky, fresh off the tawa',filters:['Breads'],items:[
    ['Plain Parotta','veg',0,30],['Bun Parotta','veg',0,40],['Poricha Parotta','veg',0,40],['Nool Parotta','veg',0,50],
    ['Chicken Kothu Parotta (B/L)','chicken',2,180],['Pallipalayam Chicken Kothu Parotta (B/L)','chicken',3,220],
    ['Chilly Parotta','veg',2,120],['Egg Kothu Parotta','egg',1,100],['Mushroom Laba Parotta','veg',1,150],
    ['Egg Laba Parotta','egg',1,100],['Chicken Laba Parotta','chicken',2,250]]},
  {id:'naan',title:'Tandoori Bread · Naan',sub:'',filters:['Breads'],items:[
    ['Naan','veg',0,40],['Butter Naan','veg',0,50],['Garlic Naan','veg',0,60],['Egg Stuff Naan','egg',1,60],['Chicken Stuff Naan','chicken',1,100]]},
  {id:'roti',title:'Roti',sub:'',filters:['Breads'],items:[
    ['Roti','veg',0,30],['Butter Roti','veg',0,40],['Garlic Roti','veg',0,50],['Egg Stuff Roti','egg',1,60],
    ['Chicken Stuff Roti','chicken',1,80],['Rumali Roti','veg',0,50],['Tandoori Wheat Parotta','veg',0,50]]},
  {id:'kulcha',title:'Kulcha',sub:'',filters:['Breads'],items:[
    ['Kulcha','veg',0,40],['Butter Kulcha','veg',0,50],['Egg Stuff Kulcha','egg',1,70],['Chicken Stuff Kulcha','chicken',1,100]]},
  {id:'beverages',title:'Beverages',sub:'Juices, mocktails, smoothies & shakes',filters:['Beverages'],type:'veg',groups:[
    {label:'Juices',items:[
      ['Lemon Juice','veg',0,40],['Lemon Soda','veg',0,50],['Lemon Mint Juice','veg',0,50],['Lemon Mint Soda','veg',0,60]]},
    {label:'Mocktails',items:[
      ['Fruit Punch','veg',0,120],['Sunrise Mocktail','veg',0,100],['Virgin Mojito','veg',0,100],['Blue Lagoon','veg',0,120],['Virgin Pinacolada','veg',0,120]]},
    {label:'Smoothies',items:[
      ['Banana Smoothie','veg',0,100],['Mango Smoothie','veg',0,100],['Orange Smoothie','veg',0,100]]},
    {label:'Shakes',items:[
      ['Banana Milk Shake','veg',0,80],['Chocolate Milk Shake','veg',0,120],['Mango Milk Shake','veg',0,100]]}
  ]},
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

const SIGNATURE_IDS = ['chicken-65','chicken-777','bullet-chicken','chilly-chicken',
  'moru-moru-chicken','wings-chilli','gilma-biriyani','nattukozhi-biryani',
  'prawn-65','fish-finger','chinthamani-chicken','kerala-fried-chicken']
const BIRYANI_IDS = MENU.find(s => s.id === 'biryani')!.items!.map(it => String(it[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-'))

const GALLERY = [
  {t:'Chicken Biryani',type:'biryani',cat:'Biryani',tall:true,food:fBiryani},
  {t:'Mutton Chukka',type:'mutton',cat:'Mutton',tall:false,food:fMutton},
  {t:'Vanjaram Fish Fry',type:'seafood',cat:'Seafood',tall:false,food:fFish},
  {t:'Tandoori Chicken',type:'chicken',cat:'Tandoor',tall:true,food:fTandoori},
  {t:'Chicken 65',type:'chicken',cat:'Chicken',tall:false,food:fChicken},
  {t:'Crab Masala',type:'seafood',cat:'Seafood',tall:true,food:fCrab},
  {t:'Prawn Masala',type:'seafood',cat:'Seafood',tall:false,food:fPrawn},
  {t:'Grilled Chicken (Alfaham)',type:'chicken',cat:'Tandoor',tall:true,food:fGrill},
  {t:'Hakka Noodles',type:'chinese',cat:'Chinese',tall:false,food:fNoodles},
  {t:'Chicken Fried Rice',type:'chinese',cat:'Chinese',tall:false,food:fFriedrice},
  {t:'Paneer Butter Masala',type:'veg',cat:'Veg',tall:false,food:fPaneer},
  {t:'Gobi 65 & Baby Corn',type:'veg',cat:'Veg',tall:true,food:fVeg},
  {t:'Chicken Momos',type:'chicken',cat:'Chinese',tall:false,food:fMomos},
  {t:'Nattu Kozhi Pepper Fry',type:'chicken',cat:'Chicken',tall:true,food:fNattukozhi},
  {t:'Quail (Kaadai) Roast',type:'chicken',cat:'Chicken',tall:false,food:fKaadai},
  {t:'Mutton Pepper Soup',type:'mutton',cat:'Soups',tall:false,food:fSoup},
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

const FILTERS = ['All','Veg','Chicken','Mutton','Seafood','Egg','Biryani','Tandoor','Chinese','Breads','Beverages']
const PORTIONS = [{n:'Regular',m:1}]
const EXTRAS = [{n:'Extra Gravy',p:40},{n:'Onion Raita',p:30},{n:'Boiled Egg',p:20},{n:'Extra Spicy',p:0},{n:'Less Spicy',p:0}]
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
function DishCard({ type, photo, ribbon, children, src: srcProp }: {
  type: string; photo?: string; ribbon?: string; children: React.ReactNode; src?: string
}) {
  const photoKey = (photo ?? type) as string
  const src = srcProp ?? (PHOTO[photoKey] ? photoUrl(photoKey, 600, 450) : dishPhoto(type, 600, 450))
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
          <img src={fBiryani} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
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
              <DishCard key={it.id} type={it.type} src={foodPhoto(it.sec, it.type)} ribbon={i===0?'Most Loved':i===4?"Chef's Special":undefined}>
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
                  <img src={foodPhoto(it.sec, it.type)} alt={it.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
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
                  <img src={g.food} alt={g.t} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
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
          <Eyebrow>200+ Dishes · Veg & Non-Veg</Eyebrow>
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
          <img src={foodPhoto(it.sec, it.type)} alt="" loading="lazy" style={{width:58,height:58,borderRadius:10,objectFit:'cover',flexShrink:0,border:'1px solid var(--line)'}} />
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
  const cats = ['All','Biryani','Chicken','Mutton','Seafood','Veg','Chinese','Tandoor','Soups']
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
                <img src={g.food} alt={g.t} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
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
              <img src={filtered[lbI].food} alt={filtered[lbI].t} style={{width:'100%',height:'100%',objectFit:'cover'}} />
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
            <DishCard key={it.id} type={it.type} src={foodPhoto(it.sec, it.type)} ribbon={i===0?'Most Loved':undefined}>
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
  const [pincode, setPincode] = useState('')
  const [orderErr, setOrderErr] = useState<string|null>(null)
  const pinOk = /^641\d{3}$/.test(pincode.trim())
  const sub = cartSubtotal(cart)
  const delivery = mode === 'delivery' ? (sub >= 499 || sub === 0 ? 0 : 40) : 0
  const gst = Math.round(sub * 0.05)
  const grand = sub + delivery + gst
  const checkout = () => {
    if (!cart.length) return
    if (mode === 'delivery') {
      const pin = pincode.trim()
      if (!/^641\d{3}$/.test(pin)) {
        setOrderErr(!pin
          ? 'Please enter your 6-digit delivery pincode.'
          : `Sorry — we currently deliver only within Coimbatore (pincodes starting 641). We can't deliver to ${pin}. Please choose Pickup, or call us on 95148 00333.`)
        return
      }
    }
    setOrderErr(null)
    const lines = cart.map(i => {
      const extras = i.extras.length ? ` (+${i.extras.map(e => e.n).join(', ')})` : ''
      return `• ${i.qty} x ${i.name} — ${i.portion}${extras} = ${money(lineTotal(i))}`
    }).join('\n')
    const msg =
      `Hi ${BRAND}, I'd like to place an order (${mode === 'delivery' ? 'Delivery' : 'Pickup'}).\n\n` +
      `${lines}\n\n` +
      `Subtotal: ${money(sub)}\n` +
      `GST (5%): ${money(gst)}\n` +
      `${mode === 'delivery' ? 'Delivery' : 'Pickup'}: ${delivery ? money(delivery) : 'FREE'}\n` +
      (mode === 'delivery' ? `Delivery pincode: ${pincode.trim()}\n` : '') +
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
                <button key={m} onClick={() => { setMode(m); setOrderErr(null) }} style={{flex:1,padding:'8px',borderRadius:7,fontWeight:700,fontSize:'.83rem',cursor:'pointer',border:'none',transition:'.2s',
                  background:mode===m?'linear-gradient(135deg,var(--gold-soft),var(--gold))':'transparent',
                  color:mode===m?'#22160a':'var(--ink-soft)'}}>
                  {m==='delivery'?'🛵 Delivery':'🥡 Pickup'}
                </button>
              ))}
            </div>
            {mode==='delivery' && (
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <input value={pincode} onChange={e=>{ setPincode(e.target.value.replace(/\D/g,'').slice(0,6)); if(orderErr) setOrderErr(null) }} inputMode="numeric" maxLength={6} placeholder="Delivery pincode (e.g. 641024)" aria-label="Delivery pincode" style={{background:'var(--panel)',border:`1px solid ${pincode.length===6 && !pinOk ? '#e8836f' : 'var(--line)'}`,borderRadius:8,padding:'9px 11px',color:'var(--ink)',fontSize:'.84rem',outline:'none',fontFamily:'inherit',letterSpacing:'.06em'}} />
                {pincode.length===6 && !pinOk
                  ? <span style={{fontSize:'.74rem',fontWeight:700,color:'#e8836f'}}>Outside our delivery area — we deliver only within Coimbatore (641xxx). Choose Pickup or call 95148&nbsp;00333.</span>
                  : pinOk
                    ? <span style={{fontSize:'.74rem',fontWeight:700,color:'var(--leaf)'}}>✓ We deliver to your area.</span>
                    : <span style={{fontSize:'.7rem',color:'var(--ink-mute)'}}>We deliver within Coimbatore only.</span>}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:5,fontSize:'.86rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-soft)'}}><span>Subtotal</span><span style={{fontVariantNumeric:'tabular-nums'}}>{money(sub)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-soft)'}}><span>GST (5%)</span><span style={{fontVariantNumeric:'tabular-nums'}}>{money(gst)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-soft)'}}><span>{mode==='delivery'?'Delivery':'Pickup'}</span><span style={{fontVariantNumeric:'tabular-nums'}}>{delivery?money(delivery):'FREE'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--line)',paddingTop:8,marginTop:2,fontFamily:'var(--serif)',fontSize:'1.18rem',fontWeight:600}}>
                <span>Total</span><b style={{color:'var(--gold-ink)',fontVariantNumeric:'tabular-nums'}}>{money(grand)}</b>
              </div>
            </div>
            {orderErr && <span role="alert" style={{fontSize:'.78rem',fontWeight:700,color:'#e8836f',lineHeight:1.45,background:'rgba(232,131,111,.1)',border:'1px solid rgba(232,131,111,.35)',borderRadius:8,padding:'8px 11px'}}>{orderErr}</span>}
            {(() => { const blocked = mode === 'delivery' && !pinOk; return (
            <Btn block onClick={checkout} style={{...(WHATSAPP_NUMBER?{background:'#25D366',borderColor:'#25D366',color:'#04310f'}:{}), ...(blocked?{opacity:.5,cursor:'not-allowed'}:{})}}>
              {blocked ? '📍 Enter a Coimbatore pincode' : WHATSAPP_NUMBER ? `💬  Order on WhatsApp · ${money(grand)}` : `Proceed to Checkout · ${money(grand)}`}
            </Btn> ) })()}
            {WHATSAPP_NUMBER && <span style={{fontSize:'.72rem',color:'var(--ink-mute)',textAlign:'center'}}>Opens WhatsApp with your order — we'll confirm and arrange {mode==='delivery'?'delivery':'pickup'}.</span>}
          </div>
        )}
      </aside>
    </>
  )
}

// ─── OPTIONS MODAL ────────────────────────────────────────────────────────────
function OptionsModal({ itemId, onClose, onConfirm }: { itemId: string|null; onClose: () => void; onConfirm: (it: FlatItem, portion: string, pmult: number, extras: {n:string;p:number}[], qty: number) => void }) {
  const [pIdx, setPIdx] = useState(0)
  const [extras, setExtras] = useState<Set<number>>(new Set())
  const [qty, setQty] = useState(1)
  const it = itemId ? itemById(itemId) : null
  useEffect(() => { if (it) { setPIdx(0); setExtras(new Set()); setQty(1) } }, [itemId])
  if (!it) return null
  const portions = PORTIONS
  const exArr = [...extras].map(i => EXTRAS[i])
  const total = Math.round((it.price * portions[pIdx].m + exArr.reduce((s,e)=>s+e.p,0)) * qty)
  return (
    <div style={{position:'fixed',inset:0,zIndex:110,display:'grid',placeItems:'center',padding:20,background:'rgba(6,4,3,.75)',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div style={{background:'var(--char-2)',border:'1px solid var(--line-strong)',borderRadius:'var(--r)',width:'min(420px,100%)',overflow:'hidden',boxShadow:'var(--shadow-lg)',animation:'pop .28s cubic-bezier(.2,.8,.2,1)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'relative',aspectRatio:'16/9',background:'linear-gradient(150deg,var(--panel-2),var(--char))',display:'grid',placeItems:'center',fontSize:'3rem',overflow:'hidden'}}>
          <img src={foodPhoto(it.sec, it.type)} alt={it.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,7,5,.55),transparent 55%)'}} />
          <button onClick={onClose} aria-label="Close" style={{position:'absolute',top:12,right:14,fontSize:'1.4rem',cursor:'pointer',border:'none',background:'rgba(0,0,0,.4)',borderRadius:8,padding:'4px 8px',color:'var(--ink)'}}>✕</button>
        </div>
        <div style={{padding:22}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><Vind type={it.type} /><h3 style={{fontSize:'1.35rem'}}>{it.name}</h3></div>
          <p style={{color:'var(--ink-soft)',fontSize:'.88rem',marginBottom:18}}>{it.desc ?? autoDesc(it)}</p>
          {portions.length > 1 && (
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
          )}
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
  const openOptions = useCallback((id: string) => {
    const it = itemById(id); if (!it) return
    const key = it.id + '|Regular|'
    setCart(prev => {
      const f = prev.find(c => c.key === key)
      if (f) return prev.map(c => c.key===key ? {...c,qty:c.qty+1} : c)
      return [...prev, {key,id:it.id,name:it.name,type:it.type,portion:'Regular',pmult:1,base:it.price,extras:[],qty:1}]
    })
    showToast(it.name, 'Added to your cart')
  }, [showToast])
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
