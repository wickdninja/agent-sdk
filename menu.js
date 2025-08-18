// Menu data
const menu = {
  drinks: {
    espresso: [
      {
        id: "espresso",
        name: "Espresso",
        price: 3.0,
        description: "Single shot of espresso",
      },
      {
        id: "double-espresso",
        name: "Double Espresso",
        price: 4.0,
        description: "Double shot of espresso",
      },
      {
        id: "americano",
        name: "Americano",
        price: 3.5,
        description: "Espresso with hot water",
      },
      {
        id: "cappuccino",
        name: "Cappuccino",
        price: 4.5,
        description: "Espresso with steamed milk and foam",
      },
      {
        id: "latte",
        name: "Latte",
        price: 5.0,
        description: "Espresso with steamed milk",
      },
      {
        id: "cortado",
        name: "Binary Brew (Cortado)",
        price: 4.5,
        description: "Our signature perfectly balanced cortado",
      },
      {
        id: "flat-white",
        name: "Flat White",
        price: 5.0,
        description: "Double shot with microfoam milk",
      },
      {
        id: "mocha",
        name: "Mocha",
        price: 5.5,
        description: "Chocolate espresso with steamed milk",
      },
      {
        id: "macchiato",
        name: "Macchiato",
        price: 4.0,
        description: "Espresso marked with foam",
      },
    ],
    cold: [
      {
        id: "iced-coffee",
        name: "Iced Coffee",
        price: 3.5,
        description: "Cold brew coffee over ice",
      },
      {
        id: "iced-latte",
        name: "Iced Latte",
        price: 5.0,
        description: "Espresso with cold milk over ice",
      },
      {
        id: "cold-brew",
        name: "Cold Brew",
        price: 4.0,
        description: "24-hour steeped cold brew",
      },
      {
        id: "nitro-cold-brew",
        name: "Nitro Cold Brew",
        price: 5.0,
        description: "Nitrogen-infused cold brew",
      },
      {
        id: "frappuccino",
        name: "Frappuccino",
        price: 6.0,
        description: "Blended ice coffee drink",
      },
    ],
    non_coffee: [
      {
        id: "matcha-latte",
        name: "Matcha Latte",
        price: 5.5,
        description: "Premium matcha with steamed milk",
      },
      {
        id: "chai-latte",
        name: "Chai Latte",
        price: 4.5,
        description: "Spiced chai with steamed milk",
      },
      {
        id: "hot-chocolate",
        name: "Hot Chocolate",
        price: 4.0,
        description: "Rich Belgian hot chocolate",
      },
      {
        id: "tea",
        name: "Tea",
        price: 3.0,
        description: "Selection of premium teas",
      },
    ],
  },
  food: {
    pastries: [
      {
        id: "croissant",
        name: "Croissant",
        price: 3.5,
        description: "Buttery French croissant",
      },
      {
        id: "pain-au-chocolat",
        name: "Pain au Chocolat",
        price: 4.0,
        description: "Chocolate croissant",
      },
      {
        id: "muffin",
        name: "Blueberry Muffin",
        price: 3.5,
        description: "Fresh blueberry muffin",
      },
      {
        id: "scone",
        name: "Chocolate Scone",
        price: 3.5,
        description: "Chocolate chip scone",
      },
      {
        id: "danish",
        name: "Danish Pastry",
        price: 4.0,
        description: "Fruit-filled Danish",
      },
    ],
    sandwiches: [
      {
        id: "avocado-toast",
        name: "Avocado Toast",
        price: 9.0,
        description: "Smashed avocado on sourdough",
      },
      {
        id: "breakfast-sandwich",
        name: "Breakfast Sandwich",
        price: 8.5,
        description: "Egg, cheese, and bacon",
      },
      {
        id: "club-sandwich",
        name: "Club Sandwich",
        price: 10.0,
        description: "Turkey, bacon, lettuce, tomato",
      },
      {
        id: "veggie-wrap",
        name: "Veggie Wrap",
        price: 8.0,
        description: "Grilled vegetables in a wrap",
      },
    ],
  },
  customizations: {
    milk: [
      {
        id: "whole",
        name: "Whole Milk",
        price: 0,
        description: "Regular whole milk",
      },
      { id: "skim", name: "Skim Milk", price: 0, description: "Non-fat milk" },
      {
        id: "oat",
        name: "Oat Milk",
        price: 0.7,
        description: "Creamy oat milk",
      },
      {
        id: "almond",
        name: "Almond Milk",
        price: 0.7,
        description: "Almond milk",
      },
      { id: "soy", name: "Soy Milk", price: 0.7, description: "Soy milk" },
      {
        id: "coconut",
        name: "Coconut Milk",
        price: 0.7,
        description: "Coconut milk",
      },
    ],
    extras: [
      {
        id: "extra-shot",
        name: "Extra Shot",
        price: 1.0,
        description: "Additional espresso shot",
      },
      {
        id: "decaf",
        name: "Decaf",
        price: 0,
        description: "Decaffeinated option",
      },
      {
        id: "vanilla",
        name: "Vanilla Syrup",
        price: 0.5,
        description: "Vanilla flavoring",
      },
      {
        id: "caramel",
        name: "Caramel Syrup",
        price: 0.5,
        description: "Caramel flavoring",
      },
      {
        id: "hazelnut",
        name: "Hazelnut Syrup",
        price: 0.5,
        description: "Hazelnut flavoring",
      },
      {
        id: "whipped-cream",
        name: "Whipped Cream",
        price: 0.5,
        description: "Whipped cream topping",
      },
    ],
  },
};

module.exports = { menu };
