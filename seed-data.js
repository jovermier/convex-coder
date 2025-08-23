#!/usr/bin/env node

// Simple script to seed data for testing the dashboard

const messages = [
  { user: "Alice", body: "Hello from the Convex dashboard!" },
  { user: "Bob", body: "Testing the data functionality" },
  { user: "Charlie", body: "Functions are working great!" }
];

const tasks = [
  { title: "Setup Convex", description: "Get Convex running with dashboard", priority: "high", completed: true },
  { title: "Test functions", description: "Verify all functions work properly", priority: "medium", completed: false },
  { title: "Add more data", description: "Populate with sample data", priority: "low", completed: false }
];

const users = [
  { name: "Alice Johnson", email: "alice@example.com", role: "admin" },
  { name: "Bob Smith", email: "bob@example.com", role: "user" },
  { name: "Charlie Brown", email: "charlie@example.com", role: "guest" }
];

console.log("Sample data prepared for Convex dashboard:");
console.log("Messages:", messages.length);
console.log("Tasks:", tasks.length);  
console.log("Users:", users.length);
console.log("\nTo populate this data, you would need to run Convex mutations from the React app or use the dashboard.");