const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PACKAGES_FILE = path.join(DATA_DIR, 'packages.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize JSON files if they don't exist
function initDataFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
}

initDataFile(USERS_FILE, []);
initDataFile(ORDERS_FILE, []);

// Default packages
const defaultPackages = [
    { id: 1, robux: 400, bonus: 0, price: 120000, label: "Phổ thông" },
    { id: 2, robux: 800, bonus: 50, price: 235000, label: "Tiết kiệm" },
    { id: 3, robux: 1700, bonus: 120, price: 499000, label: "Hot nhất" },
    { id: 4, robux: 4500, bonus: 350, price: 1299000, label: "Siêu tiết kiệm" },
    { id: 5, robux: 10000, bonus: 900, price: 2850000, label: "VIP" }
];
initDataFile(PACKAGES_FILE, defaultPackages);

// Helper functions to read/write data
function readData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Middleware
app.use(express.json());

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// === Rate Limiting (simple) ===
const requestLog = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 120;

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestLog.has(ip)) requestLog.set(ip, []);
    let timestamps = requestLog.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
    
    if (timestamps.length >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Vui lòng thử lại sau.' });
    }
    
    timestamps.push(now);
    requestLog.set(ip, timestamps);
    next();
}

app.use(rateLimit);

// === API Routes ===

// Get all users (for admin)
app.get('/api/users', (req, res) => {
    const users = readData(USERS_FILE);
    // Don't send passwords to frontend
    const safeUsers = users.map(u => ({ ...u, password: undefined }));
    res.json(safeUsers);
});

// === Packages API ===
app.get('/api/packages', (req, res) => {
    const packages = readData(PACKAGES_FILE);
    res.json(packages);
});

app.put('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    
    let packages = readData(PACKAGES_FILE);
    const index = packages.findIndex(p => p.id == id);
    
    if (index === -1) return res.status(404).json({ error: 'Package not found' });
    
    packages[index].price = price;
    writeData(PACKAGES_FILE, packages);
    
    res.json({ success: true, package: packages[index] });
});

// Admin đổi mật khẩu cho user
app.put('/api/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
    }
    
    let users = readData(USERS_FILE);
    const index = users.findIndex(u => u.id == id);
    
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    users[index].password = hashedPassword;
    writeData(USERS_FILE, users);
    
    res.json({ success: true });
});

// Register new user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Thiếu thông tin' });
    }
    
    let users = readData(USERS_FILE);
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        password: hashedPassword,
        role: 'user',
        joined: new Date().toISOString()
    };
    
    users.push(newUser);
    writeData(USERS_FILE, users);
    
    res.json({ success: true, message: 'Đăng ký thành công' });
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readData(USERS_FILE);
    
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    
    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    
    // Return user without password
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
});

// Update password
app.post('/api/change-password', (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    let users = readData(USERS_FILE);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'Không tìm thấy user' });
    
    if (users[userIndex].password !== currentPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }
    
    users[userIndex].password = newPassword;
    writeData(USERS_FILE, users);
    
    res.json({ success: true });
});

// Get all orders
app.get('/api/orders', (req, res) => {
    const orders = readData(ORDERS_FILE);
    res.json(orders);
});

// Create new order
app.post('/api/orders', (req, res) => {
    const order = req.body;
    let orders = readData(ORDERS_FILE);
    
    order.id = 'RBX-' + Date.now().toString().slice(-8);
    order.createdAt = new Date().toISOString();
    
    orders.unshift(order);
    writeData(ORDERS_FILE, orders);
    
    res.json({ success: true, order });
});

// Update order status (admin)
app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    let orders = readData(ORDERS_FILE);
    const orderIndex = orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    
    orders[orderIndex].status = status;
    writeData(ORDERS_FILE, orders);
    
    res.json({ success: true });
});

// Roblox Avatar Proxy (keep existing logic)
app.get('/api/roblox-avatar', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username required' });

    try {
        // Step 1: Get User ID
        const postData = JSON.stringify({ usernames: [username], excludeBannedUsers: true });
        
        const userRes = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'users.roblox.com',
                path: '/v1/usernames/users',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
            };
            const req = https.request(options, resolve);
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        let userData = '';
        userRes.on('data', chunk => userData += chunk);
        userRes.on('end', async () => {
            try {
                const json1 = JSON.parse(userData);
                if (!json1.data || json1.data.length === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const userId = json1.data[0].id;

                // Step 2: Get Avatar
                const avatarOptions = {
                    hostname: 'thumbnails.roblox.com',
                    path: `/v1/users/avatar?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
                    method: 'GET'
                };

                const avatarRes = await new Promise((resolve, reject) => {
                    const req = https.request(avatarOptions, resolve);
                    req.on('error', reject);
                    req.end();
                });

                let avatarData = '';
                avatarRes.on('data', chunk => avatarData += chunk);
                avatarRes.on('end', () => {
                    try {
                        const json2 = JSON.parse(avatarData);
                        if (json2.data && json2.data[0] && json2.data[0].imageUrl) {
                            res.json({ success: true, userId, avatarUrl: json2.data[0].imageUrl });
                        } else {
                            res.status(404).json({ error: 'Avatar not found' });
                        }
                    } catch (e) {
                        res.status(500).json({ error: 'Failed to parse avatar' });
                    }
                });
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse user data' });
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to connect to Roblox' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ RbVietJet đang chạy tại: http://localhost:${PORT}`);
    console.log('   Dữ liệu được lưu trong thư mục /data\n');
});