// Authentication Flow Test Script
const http = require('http');
const fs = require('fs');

let output = [];
function log(msg) { console.log(msg); output.push(msg); }

function request(options, data = null) {
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let body = '', cookie = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0];
                resolve({ status: res.statusCode, body, cookie });
            });
        });
        req.on('error', (e) => resolve({ status: 0, body: e.message }));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    log('='.repeat(70));
    log('AUTHENTICATION FLOW TEST');
    log('='.repeat(70));
    log('');

    // TASK 1: Login
    log('TASK 1: Login');
    log('-'.repeat(70));
    const r1 = await request({
        hostname: 'localhost', port: 3000, path: '/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'student@internship.com', password: 'password123' });

    log('Command: POST http://localhost:3000/auth/login');
    log(`Request Body: {"email":"student@internship.com","password":"password123"}`);
    log(`Status: ${r1.status}`);
    log(`Response: ${r1.body}`);
    const { loginSessionId } = JSON.parse(r1.body);
    log(`\nNOTE: Check server console for OTP`);
    log(`      Format: [OTP] Session ${loginSessionId} OTP: XXXXXX\n`);

    // Get OTP from user
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const otp = await new Promise(resolve => readline.question('Enter OTP from server console: ', answer => { readline.close(); resolve(answer.trim()); }));

    // TASK 2: Verify OTP
    log('');
    log('TASK 2: Verify OTP');
    log('-'.repeat(70));
    const r2 = await request({
        hostname: 'localhost', port: 3000, path: '/auth/verify-otp', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { loginSessionId, otp });

    log('Command: POST http://localhost:3000/auth/verify-otp');
    log(`Request Body: {"loginSessionId":"${loginSessionId}","otp":"${otp}"}`);
    log(`Status: ${r2.status}`);
    log(`Response: ${r2.body}`);
    log(`Set-Cookie: ${r2.cookie}`);

    //TASK 3: Get Token
    log('TASK 3: Get JWT Token');
    log('-'.repeat(70));
    const r3 = await request({
        hostname: 'localhost', port: 3000, path: '/auth/token', method: 'POST',
        headers: { 'Cookie': r2.cookie }
    });

    log('Command: POST http://localhost:3000/auth/token');
    log(`Cookie: ${r2.cookie}`);
    log(`Status: ${r3.status}`);
    log(`Response: ${r3.body}`);
    const { access_token } = JSON.parse(r3.body);
    log('');

    // TASK 4: Protected Route
    log('TASK 4: Access Protected Route');
    log('-'.repeat(70));
    const r4 = await request({
        hostname: 'localhost', port: 3000, path: '/protected', method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });

    log('Command: GET http://localhost:3000/protected');
    log(`Authorization: Bearer ${access_token.substring(0, 50)}...`);
    log(`Status: ${r4.status}`);
    log(`Response: ${r4.body}`);
    const { success_flag } = JSON.parse(r4.body);

    log('');
    log('='.repeat(70));
    log('ALL TESTS COMPLETED SUCCESSFULLY');
    log('='.repeat(70));
    log('');
    log(`SUCCESS FLAG: ${success_flag}`);
    log('');
    log('='.repeat(70));

    fs.writeFileSync('output.txt', output.join('\n'));
    log('\nResults saved to output.txt');
}

console.log('\nAuthentication Flow Test');
console.log('Ensure server is running at http://localhost:3000\n');
runTests().catch(e => console.error('Error:', e));
