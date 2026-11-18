const request = require('supertest');
const app = require('../server');
const spec = require('../docs/openapi');

// Every route registered in Express, as "METHOD /path/{param}".
// Reads Express 4's router stack, so it reflects what the app really serves.
const appRoutes = () => {
    const routes = new Set();
    const walk = (stack, prefix) => stack.forEach((layer) => {
        if (layer.route) {
            Object.keys(layer.route.methods).forEach((method) => {
                const full = `${prefix}${layer.route.path}`.replace(/\/+$/, '') || '/';
                routes.add(`${method.toUpperCase()} ${full.replace(/:(\w+)/g, '{$1}')}`);
            });
        } else if (layer.name === 'router' && layer.handle.stack) {
            const mount = layer.regexp.source
                .replace(/^\^/, '')
                .replace('\\/?(?=\\/|$)', '')
                .replace(/\\\//g, '/');
            walk(layer.handle.stack, prefix + mount);
        }
    });
    walk(app._router.stack, '');
    // The docs' own routes aren't part of the API being documented.
    return [...routes].filter((r) => !r.includes('/api/docs')).sort();
};

const documentedRoutes = () => Object.entries(spec.paths)
    .flatMap(([path, ops]) => Object.keys(ops).map((m) => `${m.toUpperCase()} ${path}`))
    .sort();

describe('API documentation (Phase 5)', () => {
    test('every route in the app is documented', () => {
        const documented = new Set(documentedRoutes());
        const missing = appRoutes().filter((r) => !documented.has(r));
        expect(missing).toEqual([]);
    });

    test('every documented route exists in the app', () => {
        const real = new Set(appRoutes());
        const stale = documentedRoutes().filter((r) => !real.has(r));
        expect(stale).toEqual([]);
    });

    test('documents all 32 API routes', () => {
        expect(appRoutes()).toHaveLength(32);
        expect(documentedRoutes()).toHaveLength(32);
    });

    test('every $ref points to a defined schema', () => {
        const refs = JSON.stringify(spec).match(/#\/components\/schemas\/\w+/g) || [];
        const undefinedRefs = [...new Set(refs)]
            .map((r) => r.split('/').pop())
            .filter((name) => !spec.components.schemas[name]);
        expect(undefinedRefs).toEqual([]);
    });

    test('every operation has a summary, a tag and responses', () => {
        Object.entries(spec.paths).forEach(([path, ops]) => {
            Object.entries(ops).forEach(([method, op]) => {
                const where = `${method.toUpperCase()} ${path}`;
                expect([where, !!op.summary]).toEqual([where, true]);
                expect([where, Array.isArray(op.tags) && op.tags.length > 0]).toEqual([where, true]);
                expect([where, Object.keys(op.responses || {}).length > 0]).toEqual([where, true]);
            });
        });
    });

    test('the spec is served as JSON', async () => {
        const res = await request(app).get('/api/docs/openapi.json');
        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe('3.0.3');
    });

    test('the Swagger UI page loads and works with the security headers', async () => {
        const page = await request(app).get('/api/docs/');
        expect(page.status).toBe(200);
        expect(page.text).toContain('swagger-ui');
        // helmet's Content-Security-Policy blocks inline <script> blocks, so
        // every script on the page must be loaded from a file.
        expect(page.headers['content-security-policy']).toMatch(/script-src 'self'/);
        const inlineScripts = page.text.match(/<script(?![^>]*\bsrc=)[^>]*>/g) || [];
        expect(inlineScripts).toEqual([]);

        const init = await request(app).get('/api/docs/swagger-ui-init.js');
        expect(init.status).toBe(200);
        expect(init.text).toContain('Vertical Eden Garden API');
    });
});
