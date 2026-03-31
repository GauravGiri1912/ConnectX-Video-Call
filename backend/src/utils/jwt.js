import crypto from "node:crypto";

const base64UrlEncode = (value) =>
    Buffer.from(value)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

const base64UrlDecode = (value) => {
    const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (normalizedValue.length % 4)) % 4;
    return Buffer.from(normalizedValue + "=".repeat(padding), "base64").toString("utf8");
};

const createSignature = (headerPayload, secret) =>
    crypto
        .createHmac("sha256", secret)
        .update(headerPayload)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

const parseExpiryToSeconds = (expiresIn) => {
    if (typeof expiresIn === "number") {
        return expiresIn;
    }

    const match = /^(\d+)([smhd])$/i.exec(expiresIn);
    if (!match) {
        return 60 * 60 * 24;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplierMap = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24
    };

    return value * multiplierMap[unit];
};

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    const isProduction = process.env.NODE_ENV === "production";
    const isMissing = !secret;
    const isPlaceholder = secret === "replace-with-a-strong-secret" || secret === "change-me-local-dev-secret";

    if ((isMissing || isPlaceholder) && isProduction) {
        throw new Error("JWT_SECRET must be configured with a strong value in production");
    }

    if (isMissing) {
        return "change-me-local-dev-secret";
    }

    return secret;
};

export const signJwt = (payload, options = {}) => {
    const secret = getJwtSecret();
    const header = { alg: "HS256", typ: "JWT" };
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresInSeconds = parseExpiryToSeconds(options.expiresIn || "1d");

    const tokenPayload = {
        ...payload,
        iat: issuedAt,
        exp: issuedAt + expiresInSeconds
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
    const headerPayload = `${encodedHeader}.${encodedPayload}`;
    const signature = createSignature(headerPayload, secret);

    return `${headerPayload}.${signature}`;
};

export const verifyJwt = (token) => {
    if (!token) {
        throw new Error("Token missing");
    }

    const [encodedHeader, encodedPayload, signature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error("Invalid token format");
    }

    const headerPayload = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createSignature(headerPayload, getJwtSecret());

    if (signature !== expectedSignature) {
        throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < currentTimestamp) {
        throw new Error("Token expired");
    }

    return payload;
};

export const extractBearerToken = (req) => {
    const authorizationHeader = req.headers.authorization || "";

    if (authorizationHeader.startsWith("Bearer ")) {
        return authorizationHeader.slice(7);
    }

    return req.body.token || req.query.token || "";
};
