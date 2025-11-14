import express from "express";
import { connectMongoDB } from "./mongo";
import routerAuth from "./routes/auth";
import routerProducts from "./routes/products";
import routerCarts from "./routes/carts";
import dotenv from "dotenv";

dotenv.config();

connectMongoDB();

const app = express();
app.use(express.json());

app.use("/api/auth", routerAuth);
app.use("/api/products", routerProducts);
app.use("/api/cart", routerCarts);

app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});