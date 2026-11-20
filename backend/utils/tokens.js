import jwt from 'jsonwebtoken';

 const secret = process.env.JWT_SECRET;

export const generateToken = (userId, userEmail) => {
    return jwt.sign({ userId, userEmail }, secret, {
        expiresIn:'7d',
    });
};


export const verifyToken = (token) => {
    try {
        return jwt.verify(token, secret);
    } catch {
        return null;
    }
};
