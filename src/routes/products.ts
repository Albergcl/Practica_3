import { Router } from "express";
import { getDb } from "../mongo";
import { Product } from "../types";
import { AuthRequest, verifyToken } from "../middleware/verifyToken";

const router = Router();

const productsCollection = () => getDb().collection<Product>("products");

// Publico
router.get("/", async (req, res) => {
    try {
        const products = await productsCollection().find(). toArray();
        res.status(200).json(products);
    }catch(err){
        res.status(500).json({ message: "Internal server error." });
    }
});

// Privado
router.post("/", verifyToken, async (req: AuthRequest, res) => {
    try {
        const { name, description, price, stock } = req.body as { name: string, description?: string, price: number, stock: number };
        if (!name || price == null || stock == null) {
            return res.status(400).json({ message: "Missing fields: name, price, stock." });
        }

        if (typeof price !== "number" || typeof stock !== "number") {
            return res.status(400).json({ message: "Fields price and stock must be numbers." });
        }

        if (price <= 0) return res.status(400).json({ message: "Price must be >0." });
        if (stock < 0) return res.status(400).json({ message: "Stock must be >=0." });

        const products = productsCollection();

        const product = {
            name,
            description: description || "",
            price,
            stock,
            createdAt: new Date()
        };

        const result = await products.insertOne(product);
        const createdProduct = await products.findOne({ _id: result.insertedId });

        res.status(201).json({ message: "Product created successfully.", createdProduct });
    }catch(err){
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;