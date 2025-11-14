import { ObjectId } from "mongodb"

export type User = {
    _id?: ObjectId,
    username: string,
    email: string,
    passwordHash: string,
    createdAt: Date
};

export type Product = {
    _id?: ObjectId,
    name: string,
    description?: string,
    price: number,
    stock: number,
    createdAt: Date
};

export type Carts = {
    _id?: ObjectId,
    userId: ObjectId,
    items: Array<{ productId: ObjectId, quantity: number }>
};

export type JwtPayload = {
    id: string,
    email: string
}