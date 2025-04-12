export const products = {
  "Starters": [
    {
      id: 1,
      name: "Bruschetta",
      description: "Crispy bread topped with fresh tomatoes, garlic, and basil",
      imageUrl: "/src/assets/images/Bruschetta.jpg",
      price: 899
    },
    {
      id: 2,
      name: "Hummus",
      description: "Smooth chickpea dip with olive oil and pita bread",
      imageUrl: "/src/assets/images/Hummus.jpg",
      price: 699
    },
    {
      id: 3,
      name: "Calamari",
      description: "Tender calamari rings, lightly fried with marinara sauce",
      imageUrl: "/src/assets/images/Calamari.jpg",
      price: 1099
    }
  ],
  "Main Course": [
    {
      id: 4,
      name: "Grilled Steak",
      description: "Perfectly grilled steak with seasonal vegetables",
      imageUrl: "/src/assets/images/Grilled Steak.jpg",
      price: 2499
    },
    {
      id: 5,
      name: "Chicken Alfredo",
      description: "Creamy Alfredo sauce with grilled chicken and pasta",
      imageUrl: "/src/assets/images/Chicken Alfredo.jpg",
      price: 1899
    },
    {
      id: 6,
      name: "Vegetable Stir-fry",
      description: "Seasonal vegetables stir-fried in Asian sauce",
      imageUrl: "/src/assets/images/Vegetable Stir-fry.jpg",
      price: 1599
    }
  ]
};

export const getAllProducts = () => {
  return Object.entries(products).flatMap(([category, items]) => 
    items.map(item => ({
      ...item,
      category
    }))
  );
}; 