// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext.jsx";

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cartItem, setCartItem] = useState([]);
    const { isAuthenticated, user } = useAuth();

    // Load cart from localStorage when user changes
    useEffect(() => {
        if (isAuthenticated() && user) {
            const savedCart = localStorage.getItem(`cart_${user.id}`);
            if (savedCart) {
                try {
                    setCartItem(JSON.parse(savedCart));
                } catch (error) {
                    console.error("Error loading cart:", error);
                }
            }
        } else {
            const generalCart = localStorage.getItem("cartItem");
            if (generalCart) {
                try {
                    setCartItem(JSON.parse(generalCart));
                } catch (error) {
                    console.error("Error loading general cart:", error);
                }
            }
        }
    }, [isAuthenticated, user]);

    // Save cart to localStorage whenever cart changes
    useEffect(() => {
        if (isAuthenticated() && user) {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItem));
        } else {
            localStorage.setItem("cartItem", JSON.stringify(cartItem));
        }
    }, [cartItem, isAuthenticated, user]);

    const addToCart = (product) => {
        const itemInCart = cartItem.find((item) => item.id === product.id);
        if (itemInCart) {
            const updatedCart = cartItem.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            setCartItem(updatedCart);
            toast.success("Product quantity increased!");
        } else {
            setCartItem([...cartItem, { ...product, quantity: 1 }]);
            toast.success("Product is added to cart!");
        }
    };

    const updateQuantity = (productId, action) => {
        setCartItem((prevCartItem) =>
            prevCartItem
                .map((item) => {
                    if (item.id === productId) {
                        let newUnit = item.quantity;
                        if (action === "increase") {
                            newUnit++;
                            toast.success("Quantity is increased!");
                        } else if (action === "decrease") {
                            newUnit--;
                            toast.success("Quantity is decreased!");
                        }
                        return newUnit > 0 ? { ...item, quantity: newUnit } : null;
                    }
                    return item;
                })
                .filter((item) => item !== null)
        );
    };

    const deleteItem = (productId) => {
        setCartItem((prevCartItem) => prevCartItem.filter((item) => item.id !== productId));
        toast.success("Product is deleted from cart!");
    };

    const clearCart = () => {
        setCartItem([]);
        if (isAuthenticated() && user) {
            localStorage.removeItem(`cart_${user.id}`);
        } else {
            localStorage.removeItem("cartItem");
        }
        toast.success("Cart cleared!");
    };

    const getTotalItems = () => cartItem.reduce((total, item) => total + item.quantity, 0);

    const getTotalPrice = () => cartItem.reduce((total, item) => total + item.price * item.quantity, 0);

    // Transfer cart from general storage when user logs in
    useEffect(() => {
        if (isAuthenticated() && user) {
            const generalCart = localStorage.getItem("cartItem");
            if (generalCart && cartItem.length === 0) {
                try {
                    const parsedCart = JSON.parse(generalCart);
                    if (parsedCart.length > 0) {
                        setCartItem(parsedCart);
                        localStorage.removeItem("cartItem");
                        toast.success("Your cart items have been restored!");
                    }
                } catch (error) {
                    console.error("Error transferring cart:", error);
                }
            }
        }
    }, [isAuthenticated, user]);

    return (
        <CartContext.Provider
            value={{
                cartItem,
                setCartItem, // backward compatibility
                addToCart,
                updateQuantity,
                deleteItem,
                clearCart,
                getTotalItems,
                getTotalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
