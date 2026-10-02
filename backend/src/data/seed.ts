import { Dish, Restaurant } from "../providers/types";

export const restaurants: Restaurant[] = [
  { id: "r1", name: "Biryani Blues", cuisines: ["Biryani", "North Indian"], rating: 4.3, deliveryMins: 35, area: "HSR Layout" },
  { id: "r2", name: "Green Bowl", cuisines: ["South Indian", "Healthy"], rating: 4.5, deliveryMins: 25, area: "Koramangala" },
  { id: "r3", name: "Dragon Wok", cuisines: ["Chinese", "Thai"], rating: 4.1, deliveryMins: 30, area: "Indiranagar" },
];

export const dishes: Dish[] = [
  { id: "d1", restaurantId: "r1", name: "Chicken Dum Biryani", description: "Seeraga samba rice, fried onions, raita", price: 249, veg: false, cuisine: "Biryani", tags: ["biryani", "spicy", "chicken", "bestseller"], rating: 4.6, available: true },
  { id: "d2", restaurantId: "r1", name: "Veg Hyderabadi Biryani", description: "Mixed veg, saffron, mirchi ka salan", price: 199, veg: true, cuisine: "Biryani", tags: ["biryani", "veg", "spicy"], rating: 4.4, available: true },
  { id: "d3", restaurantId: "r1", name: "Paneer Tikka Masala + Naan", description: "Smoky paneer curry, 2 butter naans", price: 229, veg: true, cuisine: "North Indian", tags: ["paneer", "curry", "veg"], rating: 4.3, available: true },
  { id: "d4", restaurantId: "r1", name: "Egg Curry Meal", description: "Egg curry, rice, dal fry", price: 159, veg: false, cuisine: "North Indian", tags: ["egg", "budget", "meal"], rating: 4.1, available: true },
  { id: "d5", restaurantId: "r1", name: "Chicken 65 (8 pc)", description: "Curry leaves, red chillies, mayo dip", price: 189, veg: false, cuisine: "South Indian", tags: ["chicken", "spicy", "starter"], rating: 4.5, available: true },
  { id: "d6", restaurantId: "r1", name: "Gulab Jamun (4 pc)", description: "Warm, soft, rose syrup", price: 79, veg: true, cuisine: "Dessert", tags: ["dessert", "sweet", "veg"], rating: 4.7, available: true },
  { id: "d7", restaurantId: "r2", name: "Masala Dosa", description: "Crispy, potato palya, chutney + sambar", price: 99, veg: true, cuisine: "South Indian", tags: ["dosa", "veg", "budget", "breakfast"], rating: 4.6, available: true },
  { id: "d8", restaurantId: "r2", name: "Idli Vada Combo", description: "3 idli + 1 vada, chutney sambar", price: 79, veg: true, cuisine: "South Indian", tags: ["idli", "vada", "veg", "budget", "breakfast"], rating: 4.4, available: true },
  { id: "d9", restaurantId: "r2", name: "Paneer Buddha Bowl", description: "Quinoa, paneer, greens, peanut dressing", price: 219, veg: true, cuisine: "Healthy", tags: ["paneer", "healthy", "veg", "bowl"], rating: 4.2, available: true },
  { id: "d10", restaurantId: "r2", name: "Curd Rice + Pickle", description: "Comfort meal, pomegranate, pickle", price: 109, veg: true, cuisine: "South Indian", tags: ["rice", "veg", "budget", "comfort"], rating: 4.3, available: true },
  { id: "d11", restaurantId: "r2", name: "Filter Coffee", description: "Strong degree coffee, jaggery option", price: 49, veg: true, cuisine: "Beverage", tags: ["coffee", "beverage", "veg"], rating: 4.8, available: true },
  { id: "d12", restaurantId: "r2", name: "Mango Lassi", description: "Alphonso pulp, curd, cardamom", price: 89, veg: true, cuisine: "Beverage", tags: ["mango", "beverage", "sweet", "veg"], rating: 4.5, available: true },
  { id: "d13", restaurantId: "r3", name: "Hakka Noodles Veg", description: "Wok-tossed, burnt garlic, spring onion", price: 149, veg: true, cuisine: "Chinese", tags: ["noodles", "veg", "chinese"], rating: 4.2, available: true },
  { id: "d14", restaurantId: "r3", name: "Chicken Manchuria + Fried Rice", description: "Indo-chinese combo, spicy schezwan", price: 219, veg: false, cuisine: "Chinese", tags: ["chicken", "chinese", "spicy", "combo"], rating: 4.4, available: true },
  { id: "d15", restaurantId: "r3", name: "Veg Fried Rice", description: "Smoky wok hei, carrot beans", price: 139, veg: true, cuisine: "Chinese", tags: ["rice", "veg", "chinese", "budget"], rating: 4.1, available: true },
  { id: "d16", restaurantId: "r3", name: "Chilli Paneer Dry", description: "Crisp paneer, peppers, soy-chilli glaze", price: 199, veg: true, cuisine: "Chinese", tags: ["paneer", "spicy", "starter", "veg"], rating: 4.3, available: true },
  { id: "d17", restaurantId: "r3", name: "Momos Steamed Veg (8 pc)", description: "Spicy red chutney, mayo", price: 119, veg: true, cuisine: "Chinese", tags: ["momos", "veg", "starter", "budget"], rating: 4.5, available: true },
  { id: "d18", restaurantId: "r3", name: "Chicken Momos Fried (8 pc)", description: "Crispy, chutney + mayo", price: 149, veg: false, cuisine: "Chinese", tags: ["momos", "chicken", "starter"], rating: 4.4, available: true },
];
