export interface WholesaleRowProduct {
  name: string;
  collection: string;
  origin: string;
  producer: string;
  estate: string;
  varietal: string;
  process: string;
  sensory: string;
  prices: {
    "100G": number;
    "200G": number;
    "250G": number;
    "1KG": number;
  };
}

export const wholesaleRowProducts: WholesaleRowProduct[] = [
  {
    name: "Tani - El Peñón Natural",
    collection: "BASE",
    origin: "Colombia",
    producer: "Hachi - Diego Bermudez",
    estate: "El Peñón",
    varietal: "Castillo",
    process: "Natural",
    sensory: "Yellow Tropical Fruits, Dulce De Leche, Chocolate",
    prices: { "100G": 5.8, "200G": 10.34, "250G": 12.61, "1KG": 47.24 },
  },
  {
    name: "Chocolate Strudel",
    collection: "BASE",
    origin: "Colombia",
    producer: "Native Collective",
    estate: "Finca El Paraiso",
    varietal: "Regional Selection",
    process: "Washed",
    sensory: "Dutch Cocoa, Tropical, Nutty, Bubblegum Sweetness",
    prices: { "100G": 4.17, "200G": 7.08, "250G": 8.54, "1KG": 30.96 },
  },
  {
    name: "Dragonfruit Spritz",
    collection: "TOP SHELF",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "Finca El Paraiso",
    varietal: "Castillo",
    process: "Double Anaerobic Thermal Shock",
    sensory: "Dragonfruit, Raspberry, Lychee, Rose Candy, Creamy",
    prices: { "100G": 5.8, "200G": 10.34, "250G": 12.61, "1KG": 47.24 },
  },
  {
    name: "Golden Hour",
    collection: "TOP SHELF",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "Finca El Paraiso",
    varietal: "Castillo",
    process: "Double Anaerobic Thermal Shock",
    sensory: "Lychee, Peach, Yellow Fruits, Apple",
    prices: { "100G": 5.8, "200G": 10.34, "250G": 12.61, "1KG": 47.24 },
  },
  {
    name: "Hachi - Asobi (遊び)",
    collection: "HYPER LIMITED",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "Finca La Esperanza",
    varietal: "Maragogipe",
    process: "Natural",
    sensory: "Strawberry, Hibiscus, Citrus, Milk Tea",
    prices: { "100G": 16.92, "200G": 32.58, "250G": 40.41, "1KG": 158.46 },
  },
  {
    name: "Hachi - Kokoro (心)",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "",
    varietal: "Yellow Catuai",
    process: "Natural",
    sensory: "Floral, Candied, Yellow Fruits",
    prices: { "100G": 5.8, "200G": 10.34, "250G": 12.61, "1KG": 47.24 },
  },
  {
    name: "Hachi Chiroso - Clari - TBD",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Chiroso",
    estate: "Hachi Chiroso - Clari - TBD - #57",
    varietal: "",
    process: "Washed",
    sensory: "Jamine, Mandarin, Brilliant Acidity - Silky Body",
    prices: { "100G": 12.58, "200G": 23.9, "250G": 29.56, "1KG": 115.06 },
  },
  {
    name: "Hachi - Yugen (幽玄)",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Hachi - Yugen (幽玄)",
    estate: "Hachi Supremo - Yugen (幽玄)",
    varietal: "Supremo",
    process: "Enzyflow Washed",
    sensory: "Citric, Orange, Dried Fruits, Cocoa Nibs or Dark Chocolate",
    prices: { "100G": 5.8, "200G": 10.34, "250G": 12.61, "1KG": 47.24 },
  },
  {
    name: "Hachi Maragogipe - Koharu (小春)",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "Hachi",
    varietal: "Maragogipe",
    process: "Enzyflow Natural",
    sensory: "Dates, Blueberry, Strawberry, Candied, Brilliant Acidity",
    prices: { "100G": 12.58, "200G": 23.9, "250G": 29.56, "1KG": 115.06 },
  },
  {
    name: "Hachi Gesha Classic Washed - TBD",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Hachi Gesha Classic Washed - TBD",
    estate: "Hachi",
    varietal: "Gesha",
    process: "Washed",
    sensory: "Dates, Blueberry, Strawberry, Candied, Brilliant Acidity",
    prices: { "100G": 9.87, "200G": 18.47, "250G": 22.78, "1KG": 87.93 },
  },
  {
    name: "Gesha Washed - El Agrado - TBD",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Gustavo Molano",
    estate: "Finca El Agrado",
    varietal: "Gesha",
    process: "Washed",
    sensory: "Floral, Mandarin, Orange",
    prices: { "100G": 12.58, "200G": 23.9, "250G": 29.56, "1KG": 115.06 },
  },
  {
    name: "Gesha Washed - La Betania - TBD",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Enar Rodrigo Daza",
    estate: "Finca La Betania",
    varietal: "Gesha",
    process: "Washed",
    sensory: "Violet, Bubblegum, Blueberry",
    prices: { "100G": 15.29, "200G": 29.33, "250G": 36.34, "1KG": 142.19 },
  },
  {
    name: "Gesha Washed - El Manantial - TBD",
    collection: "EXOTIC",
    origin: "Colombia",
    producer: "Anyi Muñoz",
    estate: "Finca El Manantial",
    varietal: "Gesha",
    process: "Washed",
    sensory: "Jasmine, Quito Orange, Lemongrass, Peach",
    prices: { "100G": 12.58, "200G": 23.9, "250G": 29.56, "1KG": 115.06 },
  },
  {
    name: "Arcadia",
    collection: "ESSENTIALS",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "Finca El Paraiso",
    varietal: "Castillo",
    process: "60% Washed Castillo / 40% Double Anaerobic Thermal Shock Castillo",
    sensory: "CHOCOLATE COVERED RASPBERRY, CREAMY, CHERRY, SWEET",
    prices: { "100G": 4.82, "200G": 8.38, "250G": 10.16, "1KG": 37.48 },
  },
  {
    name: "Lumen",
    collection: "ESSENTIALS",
    origin: "Colombia",
    producer: "Diego Bermudez",
    estate: "Finca El Paraiso",
    varietal: "Castillo",
    process: "80% Washed Castillo / 20% Double Anaerobic Thermal Shock Castillo",
    sensory: "Peach Creamsicle, Chocolate Sweet",
    prices: { "100G": 4.5, "200G": 7.73, "250G": 9.35, "1KG": 34.22 },
  },
];

export const getProductsByCollection = () => {
  const collections: Record<string, WholesaleRowProduct[]> = {
    BASE: [],
    ESSENTIALS: [],
    "TOP SHELF": [],
    EXOTIC: [],
    "HYPER LIMITED": [],
  };

  wholesaleRowProducts.forEach((product) => {
    const collection = product.collection.toUpperCase();
    if (collections[collection]) {
      collections[collection].push(product);
    }
  });

  return collections;
};
