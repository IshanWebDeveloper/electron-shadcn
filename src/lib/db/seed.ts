import { getDb } from "./index";
import {
  categories,
  customers,
  menuItems,
  settings,
  tables,
} from "./schemas/schemas";

export function seedDatabase() {
  const db = getDb();

  // Seed settings
  const existingSettings = db.select().from(settings).limit(1).all();
  if (existingSettings.length === 0) {
    db.insert(settings)
      .values([
        { key: "restaurant_name", value: "My Restaurant" },
        { key: "currency", value: "LKR" },
        { key: "tax_rate", value: "0" },
        { key: "receipt_footer", value: "Thank you for dining with us!" },
        { key: "printer_name", value: "" },
      ])
      .run();
  }

  // Seed categories
  const existingCategories = db.select().from(categories).limit(1).all();
  if (existingCategories.length === 0) {
    db.insert(categories)
      .values([
        { id: "cat_1", name: "Mains", emoji: "🍛", sortOrder: 0 },
        { id: "cat_2", name: "Starters", emoji: "🥗", sortOrder: 1 },
        { id: "cat_3", name: "Beverages", emoji: "🥤", sortOrder: 2 },
        { id: "cat_4", name: "Desserts", emoji: "🍮", sortOrder: 3 },
      ])
      .run();
  }

  // Seed tables
  const existingTables = db.select().from(tables).limit(1).all();
  if (existingTables.length === 0) {
    db.insert(tables)
      .values([
        { id: "t1", name: "T1", capacity: 2, posX: 60, posY: 60 },
        { id: "t2", name: "T2", capacity: 4, posX: 200, posY: 60 },
        { id: "t3", name: "T3", capacity: 4, posX: 340, posY: 60 },
        { id: "t4", name: "T4", capacity: 6, posX: 60, posY: 200 },
        { id: "t5", name: "T5", capacity: 6, posX: 200, posY: 200 },
        { id: "t6", name: "T6", capacity: 2, posX: 340, posY: 200 },
      ])
      .run();
  }

  // Seed Menu Items
  const existingMenuItems = db.select().from(menuItems).limit(1).all();
  if (existingMenuItems.length === 0) {
    db.insert(menuItems)
      .values([
        // Mains
        {
          id: "mi_1",
          categoryId: "cat_1",
          name: "Chicken Kottu",
          price: 1200,
          description: "Spicy Sri Lankan Chicken Kottu",
        },
        {
          id: "mi_2",
          categoryId: "cat_1",
          name: "Seafood Rice",
          price: 1500,
          description: "Mixed seafood fried rice",
        },
        {
          id: "mi_9",
          categoryId: "cat_1",
          name: "Cheese Pepperoni Pizza",
          price: 2300,
          description: "Large wood-fired pizza",
        },
        // Starters
        {
          id: "mi_3",
          categoryId: "cat_2",
          name: "Hot Butter Cuttlefish",
          price: 950,
          description: "Crispy HBC",
        },
        {
          id: "mi_4",
          categoryId: "cat_2",
          name: "French Fries",
          price: 500,
          description: "Crispy golden fries",
        },
        {
          id: "mi_10",
          categoryId: "cat_2",
          name: "Garlic Bread",
          price: 400,
          description: "4 slices of toasted garlic bread",
        },
        // Beverages
        {
          id: "mi_5",
          categoryId: "cat_3",
          name: "Lime Juice",
          price: 400,
          description: "Fresh minty lime juice",
        },
        {
          id: "mi_6",
          categoryId: "cat_3",
          name: "Iced Milo",
          price: 600,
          description: "Chocolate iced milo",
        },
        {
          id: "mi_11",
          categoryId: "cat_3",
          name: "Cappuccino",
          price: 650,
          description: "Freshly brewed Illy coffee",
        },
        // Desserts
        {
          id: "mi_7",
          categoryId: "cat_4",
          name: "Watalappan",
          price: 350,
          description: "Traditional sweet dessert",
        },
        {
          id: "mi_8",
          categoryId: "cat_4",
          name: "Chocolate Biscuit Pudding",
          price: 450,
          description: "Classic CBP",
        },
        {
          id: "mi_12",
          categoryId: "cat_4",
          name: "Vanilla Ice Cream",
          price: 300,
          description: "2 scoops of classic vanilla",
        },
      ])
      .run();
  }

  // Seed customers
  const existingCustomers = db.select().from(customers).limit(1).all();
  if (existingCustomers.length === 0) {
    db.insert(customers)
      .values([
        {
          id: "cust_1",
          name: "Walk-in Guest",
          phone: "0000000000",
          email: null,
          notes: "Default walk-in profile",
        },
        {
          id: "cust_2",
          name: "Nimal Perera",
          phone: "0771234567",
          email: "nimal@example.com",
        },
        {
          id: "cust_3",
          name: "Kasuni Silva",
          phone: "0779876543",
          email: "kasuni@example.com",
        },
        {
          id: "cust_4",
          name: "Dilan Fernando",
          phone: "0715552233",
          email: "dilan@example.com",
        },
      ])
      .run();
  }

  console.log("[DB] Data seeding completed");
}
