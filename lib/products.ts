export interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number;
  compareAt?: number;
  image: string; // emoji or gradient key
  gradient: string;
  badge?: string;
  category: string;
  rating: number;
  reviews: number;
  features: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "planner-bundle",
    name: "Ultimate Digital Planner Bundle",
    tagline: "Life, goals & daily planning — 120+ pages",
    price: 19,
    compareAt: 49,
    image: "📒",
    gradient: "linear-gradient(145deg,#0e3a3a,#041c1c)",
    badge: "Best Seller",
    category: "Planners",
    rating: 4.9,
    reviews: 1247,
    features: ["120+ pages", "PDF + Notion", "Lifetime updates", "Instant download"],
  },
  {
    id: "wellness-journal",
    name: "Mindful Wellness Journal",
    tagline: "Guided journaling for mental clarity & calm",
    price: 15,
    compareAt: 39,
    image: "🧠",
    gradient: "linear-gradient(145deg,#1a2e22,#0a1f1a)",
    badge: "Trending",
    category: "Wellness",
    rating: 4.8,
    reviews: 892,
    features: ["60+ prompts", "Printable + digital", "Self-care trackers", "Instant download"],
  },
  {
    id: "ai-prompts",
    name: "AI Prompt Power Pack",
    tagline: "500+ pro prompts for business & content",
    price: 25,
    compareAt: 69,
    image: "🤖",
    gradient: "linear-gradient(145deg,#123c3a,#072625)",
    badge: "High Margin",
    category: "AI Tools",
    rating: 4.9,
    reviews: 2031,
    features: ["500+ prompts", "10 categories", "Copy-paste ready", "Lifetime updates"],
  },
  {
    id: "budget-templates",
    name: "Smart Budget & Finance Templates",
    tagline: "Excel & Google Sheets money trackers",
    price: 12,
    compareAt: 29,
    image: "📊",
    gradient: "linear-gradient(145deg,#0a3030,#041c1c)",
    category: "Finance",
    rating: 4.7,
    reviews: 654,
    features: ["10 templates", "Auto-calculations", "Excel + Sheets", "Instant download"],
  },
  {
    id: "social-templates",
    name: "Social Media Content Kit",
    tagline: "Canva templates for viral content",
    price: 18,
    compareAt: 45,
    image: "🎨",
    gradient: "linear-gradient(145deg,#164040,#0a2c2c)",
    badge: "New",
    category: "Marketing",
    rating: 4.8,
    reviews: 1103,
    features: ["200+ Canva templates", "Reels + posts", "Brand fonts", "Instant download"],
  },
  {
    id: "ebook-bundle",
    name: "Side Hustle eBook Bundle",
    tagline: "5 eBooks to start making money online",
    price: 22,
    compareAt: 59,
    image: "📚",
    gradient: "linear-gradient(145deg,#0e3a3a,#061f1f)",
    category: "eBooks",
    rating: 4.6,
    reviews: 478,
    features: ["5 eBooks", "Step-by-step guides", "PDF format", "Instant download"],
  },
];
