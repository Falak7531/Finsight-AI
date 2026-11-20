import jwt from 'jsonwebtoken';

export const validateJwtConfiguration = () => {
    if (!process.env.JWT_SECRET?.trim()) {
        throw new Error('JWT_SECRET must be configured before starting the API.');
    }
};

const getSecret = () => {
    validateJwtConfiguration();
    return process.env.JWT_SECRET;
};

export const generateToken = (userId, userEmail) => {
    return jwt.sign({ userId, userEmail }, getSecret(), {
        algorithm: 'HS256',
        expiresIn:'7d',
    });
};


export const verifyToken = (token) => {
    const secret = getSecret();
    try {
        return jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError || err instanceof jwt.NotBeforeError) {
            return null;
        }
        throw err;
    }
};
