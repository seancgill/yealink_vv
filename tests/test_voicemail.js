const request = require('supertest');
const app = require('../server');

describe('GET /yealink_vv', () => {
    it('should return 400 if user_id or domain is missing', async () => {
        const res = await request(app).get('/yealink_vv');
        expect(res.status).toBe(400);
    });
});
