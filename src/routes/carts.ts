import { Router } from "express";
import { getDb } from "../mongo";
import { Carts, JwtPayload } from "../types";
import { AuthRequest, verifyToken } from "../middleware/verifyToken";
import { ObjectId } from "mongodb";


const router = Router();

const cartsCollection = () => getDb().collection<Carts>("carts");
const productsCollection = () => getDb().collection("products");

// Obtener el carrito de un usuario autenticado
router.get("/", verifyToken, async (req: AuthRequest, res) => {
        try {
            const user = req.user as JwtPayload;
            if (!user || typeof user.id !== "string") return res.status(401).json({ message: "Token inválido." });
            const userId = new ObjectId(user.id);

        const cart = await cartsCollection().findOne({ userId });
        if (!cart) {
            // Devolver carrito vacío si no existe
            return res.status(200).json({ userId: user.id, items: [] });
        }

        res.status(200).json(cart);
    }catch(err){
        res.status(500).json({ message: "Internal server error." });
    }
});

// Añadir producto al carrito
router.put("/add", verifyToken, async (req: AuthRequest, res) => {
        try {
            const { productId, quantity } = req.body as { productId: string, quantity: number };
            if (!productId || quantity == null) {
                return res.status(400).json({ message: "Missing fields: productId, quantity." });
            }

            if (typeof quantity !== "number" || quantity <= 0) {
                return res.status(400).json({ message: "Quantity must be a number >0." });
            }

            const user = req.user as JwtPayload;
            if (!user || typeof user.id !== "string") return res.status(401).json({ message: "Token inválido." });
            const userId = new ObjectId(user.id);
            const prodId = new ObjectId(productId);

            let cart = await cartsCollection().findOne({ userId: userId });
            if (!cart) {
                // Crear un nuevo carrito si no existe
                const newCart = { userId: userId, items: [] };
                const insertCart = await cartsCollection().insertOne(newCart);
                cart = { _id: insertCart.insertedId, ...newCart };
            }

            const product = await productsCollection().findOne({ _id: prodId });
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            const itemIntoCart = cart.items.find(item => item.productId === prodId);
            if (itemIntoCart) {
                // Verificar stock disponible antes de actualizar la cantidad
                if (itemIntoCart.quantity + quantity > product.stock) {
                    return res.status(400).json({ message: "Insufficient stock." });
                }
                // Actualizar la cantidad si el producto ya está en el carrito
                itemIntoCart.quantity += quantity;
            } else {
                if (quantity > product.stock) {
                    return res.status(400).json({ message: "Insufficient stock." });
                }
                // Añadir nuevo producto al carrito
                cart.items.push({ productId: prodId, quantity });
            }

            await cartsCollection().updateOne(
                { _id: cart._id },
                { $set: { items: cart.items } }
            );

            const updatedCart = await cartsCollection().findOne({ userId });

            res.status(200).json({ message: "Product added to cart successfully.", updatedCart });
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;