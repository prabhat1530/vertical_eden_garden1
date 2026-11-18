const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

const signupBody = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    password: 'secret1',
};

describe('Auth hardening (Phase 1)', () => {
    test('signup returns a short-lived access token and sets an httpOnly refresh cookie', async () => {
        const res = await request(app).post('/api/auth/signup').send(signupBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeTruthy();

        const cookies = res.headers['set-cookie'] || [];
        const refresh = cookies.find((c) => c.startsWith('veg_refresh='));
        expect(refresh).toBeTruthy();
        expect(/HttpOnly/i.test(refresh)).toBe(true);
    });

    test('refresh cookie is SameSite=None; Secure over HTTPS and Lax over plain HTTP', async () => {
        // Behind Render's proxy, HTTPS arrives as X-Forwarded-Proto: https.
        const viaHttps = await request(app)
            .post('/api/auth/signup')
            .set('X-Forwarded-Proto', 'https')
            .send({ ...signupBody, email: 'https@example.com' });
        const secureCookie = viaHttps.headers['set-cookie'].find((c) => c.startsWith('veg_refresh='));
        expect(secureCookie).toMatch(/SameSite=None/i);
        expect(secureCookie).toMatch(/;\s*Secure/i);

        const viaHttp = await request(app)
            .post('/api/auth/signup')
            .send({ ...signupBody, email: 'http@example.com' });
        const devCookie = viaHttp.headers['set-cookie'].find((c) => c.startsWith('veg_refresh='));
        expect(devCookie).toMatch(/SameSite=Lax/i);
        expect(devCookie).not.toMatch(/;\s*Secure/i);
    });

    test('refresh exchanges the cookie for a new access token', async () => {
        const agent = request.agent(app); // persists cookies across requests
        await agent.post('/api/auth/signup').send(signupBody);

        const res = await agent.post('/api/auth/refresh').send();
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user.email).toBe('test@example.com');
    });

    test('logout revokes the session so refresh no longer works', async () => {
        const agent = request.agent(app);
        await agent.post('/api/auth/signup').send(signupBody);

        await agent.post('/api/auth/logout').send();
        const res = await agent.post('/api/auth/refresh').send();
        expect(res.status).toBe(401);
    });

    test('OTP is stored bcrypt-hashed, never as the raw 6-digit code', async () => {
        await request(app).post('/api/auth/send-otp').send({ phone: '8888888888' });

        const user = await User.findOne({ phone: '8888888888' }).select('+otp');
        expect(user.otp).toBeTruthy();
        expect(user.otp).not.toMatch(/^\d{6}$/);     // not the plain code
        expect(user.otp.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    test('OTP locks out after 5 wrong attempts', async () => {
        await request(app).post('/api/auth/send-otp').send({ phone: '7777777777' });

        let last;
        for (let i = 0; i < 5; i++) {
            last = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '7777777777', otp: '000000' });
        }
        expect(last.status).toBe(429); // locked out
    });
});
