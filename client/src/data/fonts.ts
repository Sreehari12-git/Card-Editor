export interface FontDefinition {
  name: string;
  family: string;
  category: 'Modern' | 'Bold' | 'Decorative' | 'Cursive' | 'Elegant' | 'Creative';
  weights?: number[];
  sampleText?: string;
}

export const FONT_CATEGORIES = [
  'All',
  'Modern',
  'Bold',
  'Decorative',
  'Cursive',
  'Elegant',
  'Creative',
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number];

export const FONTS: FontDefinition[] = [
  // Modern
  { name: 'Inter', family: 'Inter', category: 'Modern', weights: [400, 500, 600, 700] },
  { name: 'Poppins', family: 'Poppins', category: 'Modern', weights: [400, 600, 700] },
  { name: 'Montserrat', family: 'Montserrat', category: 'Modern', weights: [400, 600, 700] },

  // Bold
  { name: 'Anton', family: 'Anton', category: 'Bold', weights: [400] },
  { name: 'Oswald', family: 'Oswald', category: 'Bold', weights: [400, 600, 700] },
  { name: 'Bebas Neue', family: 'Bebas Neue', category: 'Bold', weights: [400] },

  // Decorative
  { name: 'Righteous', family: 'Righteous', category: 'Decorative', weights: [400] },
  { name: 'Bangers', family: 'Bangers', category: 'Decorative', weights: [400] },
  { name: 'Abril Fatface', family: 'Abril Fatface', category: 'Decorative', weights: [400] },

  // Cursive
  { name: 'Pacifico', family: 'Pacifico', category: 'Cursive', weights: [400] },
  { name: 'Lobster', family: 'Lobster', category: 'Cursive', weights: [400] },
  { name: 'Dancing Script', family: 'Dancing Script', category: 'Cursive', weights: [400, 700] },
  { name: 'Caveat', family: 'Caveat', category: 'Cursive', weights: [400, 700] },

  // Elegant
  { name: 'Playfair Display', family: 'Playfair Display', category: 'Elegant', weights: [400, 600, 700] },
  { name: 'Cinzel', family: 'Cinzel', category: 'Elegant', weights: [400, 700] },

  // Other Creative
  { name: 'Permanent Marker', family: 'Permanent Marker', category: 'Creative', weights: [400] },
  { name: 'Fredoka', family: 'Fredoka', category: 'Creative', weights: [400, 600] },
  { name: 'Comfortaa', family: 'Comfortaa', category: 'Creative', weights: [400, 700] },
  { name: 'Bungee', family: 'Bungee', category: 'Creative', weights: [400] },
  { name: 'Luckiest Guy', family: 'Luckiest Guy', category: 'Creative', weights: [400] },
];

export const GOOGLE_FONTS_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Anton&family=Bangers&family=Bebas+Neue&family=Bungee&family=Caveat:wght@400;700&family=Cinzel:wght@400;700&family=Comfortaa:wght@400;700&family=Dancing+Script:wght@400;700&family=Fredoka:wght@400;600&family=Inter:wght@400;500;600;700&family=Lobster&family=Luckiest+Guy&family=Montserrat:wght@400;600;700&family=Oswald:wght@400;600;700&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;600;700&family=Righteous&display=swap';
