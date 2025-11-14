import e, { Router } from "express";
import dotenv from "dotenv";
import { getDb } from "../mongo";
import { User, JwtPayload } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const router = Router();

dotenv.config();

const SECRET = process.env.SECRET;


const usersCollection = () => getDb().collection<User>("users");

router.get("/", async (req, res) => {
    res.send("Se ha conectado a la ruta de auth correctamente.");
});

router.post("/register", async (req, res) => {
    try {
        const { username, email, passwordHash } = req.body as { username: string, email: string, passwordHash: string };
        if (!username || !email || !passwordHash) {
            return res.status(400).json({ message: "Missing fields: username, email, passwordHash." });
        }

        // Validar formato de email básico. Sacado de internet.
        const isValidEmail = /\S+@\S+\.\S+/;
        if (!isValidEmail.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const users = usersCollection();
        const existsEmail = await users.findOne({ email });
        if (existsEmail) {
            return res.status(409).json({ message: "User email already exists." });
        }

        const existsUsername = await users.findOne({ username });
        if (existsUsername) {
            return res.status(409).json({ message: "Username already exists." });
        }

        const passEncriptada = await bcrypt.hash(passwordHash, 10);
        await users.insertOne({
            username,
            email,
            passwordHash: passEncriptada,
            createdAt: new Date()
        });

        res.status(201).json({ message: "User created." });

    }catch (err){
        res.status(500).json({ message: "Internal server error." });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, passwordHash } = req.body as { email: string, passwordHash: string };
        if (!email || !passwordHash) {
            return res.status(400).json({ message: "Missing fields: email, passwordHash." });
        }

        const users = usersCollection();
        const user = await users.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email." });
        }

        const validPass = await bcrypt.compare(passwordHash, user.passwordHash);
        if (!validPass) {
            return res.status(400).json({ message: "Invalid password." });
        }

        const token = jwt.sign({ id: user._id.toString(), email: user.email } as JwtPayload, SECRET as string, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful.", token });
    } catch (err) {
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;