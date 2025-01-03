import jwt from 'jsonwebtoken';

export interface JwtPayload {
    companyId: string;
    userId: string;
}

export class JwtService {

    public static verifyToken(token: string, secret: string): JwtPayload {
        try {
            const payload = jwt.verify(token, secret) as JwtPayload;

            if (!payload.companyId || !payload.userId) {
                throw new Error('Invalid JWT payload');
            }

            return payload;
        } catch (error) {
            console.error('JWT verification error:', error);
            throw new Error('Invalid or expired JWT token');
        }
    }

}
