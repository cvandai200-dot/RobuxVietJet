// RobuxFast v3 - Main App Logic

let currentUser = null;
let packages = [
    { id: 1, robux: 400, bonus: 0, price: 50000, label: "Phổ thông" },
    { id: 2, robux: 800, bonus: 50, price: 100000, label: "Tiết kiệm" },
    { id: 3, robux: 1700, bonus: 120, price: 200000, label: "Hot nhất" },
    { id: 4, robux: 4500, bonus: 350, price: 300000, label: "Siêu tiết kiệm" },
    { id: 5, robux: 10000, bonus: 900, price: 500000, label: "VIP" }
];
let selectedPackageId = null;
let selectedPaymentMethod = 'momo';

function init() {
    const savedPackages = localStorage.getItem('robuxPackages');
    if (savedPackages) packages = JSON.parse(savedPackages);

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showSection('login');
    }
    seedDemoData();
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(section + '-section');
    if (target) target.classList.add('active');

    if (section === 'shop') renderPackages();
    if (section === 'profile') loadProfile();
    if (section === 'admin' && currentUser?.role === 'admin') loadAdminDashboard();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('hamburger-icon');
    if (!menu) return;

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        if (icon) icon.classList.replace('fa-bars', 'fa-times');
    } else {
        menu.classList.add('hidden');
        if (icon) icon.classList.replace('fa-times', 'fa-bars');
    }
}

// === Custom Toast (thay thế alert() xấu của Chrome) ===
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message); // fallback

    const colors = {
        success: 'bg-emerald-600 border-emerald-500 text-white',
        error: 'bg-red-600 border-red-500 text-white',
        info: 'bg-zinc-700 border-zinc-600 text-zinc-100',
        warning: 'bg-amber-600 border-amber-500 text-white'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-x-3 px-5 py-3.5 rounded-2xl border shadow-xl ${colors[type] || colors.info} max-w-xs animate-[fadeIn_0.2s_ease]`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info} text-lg flex-shrink-0"></i>
        <div class="text-sm font-medium pr-2">${message}</div>
        <button onclick="this.parentElement.remove()" class="ml-auto text-white/70 hover:text-white">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
}

function showMainApp() {
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('login-section').classList.add('hidden');

    const adminBtn = document.getElementById('admin-nav-btn');
    adminBtn.classList.toggle('hidden', currentUser.role !== 'admin');

    const mobileAdminBtn = document.getElementById('mobile-admin-btn');
    if (mobileAdminBtn) mobileAdminBtn.classList.toggle('hidden', currentUser.role !== 'admin');

    document.getElementById('nav-username').innerText = currentUser.username;

    // Hiển thị nút Zalo Support nổi
    const zaloBtn = document.getElementById('zalo-support-btn');
    if (zaloBtn) zaloBtn.classList.remove('hidden');

    // Admin tự động vào Admin Panel, ẩn shop cho admin
    if (currentUser.role === 'admin') {
        showSection('admin');
        // Ẩn nút Shop trên nav cho admin (chỉ giữ Admin + Hồ sơ)
        const shopBtn = document.querySelector('#nav-menu button[data-section="shop"]');
        if (shopBtn) shopBtn.style.display = 'none';
    } else {
        showSection('shop');
    }
}

// Auth
function showRegisterForm() {
    document.getElementById('login-form-container').classList.add('hidden');
    document.getElementById('register-form-container').classList.remove('hidden');
}
function showLoginForm() {
    document.getElementById('register-form-container').classList.add('hidden');
    document.getElementById('login-form-container').classList.remove('hidden');
}

function register() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!username || !email || !password) return showToast('Vui lòng điền đầy đủ thông tin', 'warning');
    if (password.length < 4) return showToast('Mật khẩu phải ≥ 4 ký tự', 'warning');
    
    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
        return showToast('Email không hợp lệ', 'error');
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.username === username)) return showToast('Tên đăng nhập đã tồn tại', 'error');
    if (users.find(u => u.email === email)) return showToast('Email này đã được sử dụng', 'error');

    users.push({ 
        id: Date.now(), 
        username, 
        email, 
        password, 
        role: 'user', 
        joined: new Date().toISOString() 
    });
    localStorage.setItem('users', JSON.stringify(users));
    showToast('Đăng ký thành công! Hãy đăng nhập.', 'success');
    showLoginForm();
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return showToast('Sai tên đăng nhập hoặc mật khẩu', 'error');

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
}

function logout() {
    localStorage.removeItem('currentUser');
    // Ẩn nút Zalo Support khi logout
    const zaloBtn = document.getElementById('zalo-support-btn');
    if (zaloBtn) zaloBtn.classList.add('hidden');
    location.reload();
}

// Shop
function renderPackages() {
    const grid = document.getElementById('packages-grid');
    grid.innerHTML = '';
    packages.forEach(pkg => {
        const isSelected = selectedPackageId === pkg.id;
        const isPopular = pkg.id === 3;
        grid.innerHTML += `
            <div onclick="selectPackage(${pkg.id})" class="robux-card bg-zinc-900 border ${isSelected ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-zinc-700'} rounded-3xl p-4 md:p-5 cursor-pointer flex flex-col h-full">
                ${isPopular ? `<div class="popular-badge">HOT NHẤT</div>` : ''}
                <div class="flex-1 text-center">
                    <img src="https://i.ibb.co/HLc6TPBN/Robux-2019-Logo-gold-svg.png" alt="Robux" class="w-8 h-8 mx-auto mb-1.5 object-contain">
                    <div class="text-4xl md:text-5xl font-black tracking-tighter">${pkg.robux.toLocaleString('vi-VN')}</div>
                    <div class="text-sky-400 text-xs font-semibold -mt-1">ROBUX</div>
                    ${pkg.bonus > 0 ? `<div class="mt-1.5 inline-block text-xs bg-emerald-950 text-emerald-400 px-2.5 py-px rounded-2xl font-semibold">+${pkg.bonus} BONUS</div>` : ''}
                </div>
                <div class="mt-auto pt-4 border-t border-zinc-700">
                    <div class="flex justify-between items-end">
                        <div>
                            <div class="text-xs text-zinc-400">Giá</div>
                            <div class="font-mono text-2xl font-semibold tabular-nums">${(pkg.price/1000).toFixed(0)}k</div>
                        </div>
                    </div>
                    <button onclick="event.stopImmediatePropagation(); selectPackage(${pkg.id})" class="mt-3 w-full py-2 text-sm font-semibold rounded-2xl transition-all active:scale-[0.985] ${isSelected ? 'bg-sky-500 text-white' : 'bg-white text-zinc-900'}">
                        ${isSelected ? 'ĐÃ CHỌN' : 'Chọn gói'}
                    </button>
                </div>
            </div>`;
    });
}

function selectPackage(id) {
    selectedPackageId = id;
    renderPackages();
    updateOrderSummary();
}

function updateOrderSummary() {
    const container = document.getElementById('summary-content');
    if (!selectedPackageId) {
        container.innerHTML = `<div class="py-6 text-center text-zinc-400 text-sm">Chọn gói nạp ở trên</div>`;
        return;
    }
    const pkg = packages.find(p => p.id === selectedPackageId);
    container.innerHTML = `
        <div>
            <div class="flex justify-between mb-4">
                <div>
                    <div class="font-mono text-3xl font-black tracking-tighter">${pkg.robux}</div>
                    <div class="text-sky-300 text-xs -mt-1">ROBUX ${pkg.bonus ? `(+${pkg.bonus})` : ''}</div>
                </div>
                <div class="text-right">
                    <div class="font-mono text-2xl font-semibold tabular-nums">${pkg.price.toLocaleString('vi-VN')}</div>
                    <div class="text-xs text-zinc-400">VNĐ</div>
                </div>
            </div>
            <div class="pt-3 border-t border-zinc-700 flex justify-between text-sm">
                <span class="font-medium">Tổng thanh toán</span>
                <span class="font-bold tabular-nums">${pkg.price.toLocaleString('vi-VN')} VNĐ</span>
            </div>
        </div>`;
}

function selectPayment(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('border-sky-500', 'bg-zinc-800'));
    const el = document.getElementById('pay-' + method);
    if (el) el.classList.add('border-sky-500', 'bg-zinc-800');
}

async function confirmOrder() {
    if (!currentUser) return showToast('Vui lòng đăng nhập', 'warning');
    if (!selectedPackageId) return showToast('Vui lòng chọn gói nạp', 'warning');
    const robloxName = document.getElementById('roblox-username').value.trim();
    if (!robloxName) return showToast('Vui lòng nhập tên Roblox', 'warning');

    const pkg = packages.find(p => p.id === selectedPackageId);
    
    const orderData = {
        userId: currentUser.id,
        username: currentUser.username,
        robloxUsername: robloxName,
        robux: pkg.robux,
        bonus: pkg.bonus,
        total: pkg.price,
        paymentMethod: selectedPaymentMethod,
        status: 'Chờ thanh toán',
        note: document.getElementById('note').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (res.ok) {
            showZaloModal(data.order);
            selectedPackageId = null;
            renderPackages();
            updateOrderSummary();
            document.getElementById('roblox-username').value = '';
            document.getElementById('roblox-avatar-preview').classList.add('hidden');
            document.getElementById('note').value = '';
        } else {
            showToast('Tạo đơn thất bại', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối server khi tạo đơn', 'error');
    }
}

function showSuccessModal(order) {
    const modal = document.getElementById('success-modal');
    const details = document.getElementById('modal-order-details');
    let paymentText = order.paymentMethod === 'momo' ? 'Ví Momo' : order.paymentMethod === 'zalopay' ? 'ZaloPay' : order.paymentMethod === 'bank' ? 'Chuyển khoản NH' : 'Thẻ';
    details.innerHTML = `
        <div class="flex justify-between"><span class="text-zinc-400">Mã đơn</span> <span class="font-mono font-semibold">${order.id}</span></div>
        <div class="flex justify-between"><span class="text-zinc-400">Roblox</span> <span class="font-semibold">${order.robloxUsername}</span></div>
        <div class="flex justify-between"><span class="text-zinc-400">Gói</span> <span>${order.robux} Robux ${order.bonus ? `(+${order.bonus})` : ''}</span></div>
        <div class="flex justify-between pt-2 border-t border-zinc-700"><span class="text-zinc-400">Thanh toán</span> <span>${paymentText}</span></div>
        <div class="flex justify-between text-lg pt-1"><span class="font-semibold">Tổng</span> <span class="font-bold tabular-nums">${order.total.toLocaleString('vi-VN')} VNĐ</span></div>
    `;
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

function hideSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
    if (document.getElementById('profile-section').classList.contains('active')) loadProfile();
}

// Zalo Payment Modal handlers (for after order creation)
let currentOrderId = null;

function showZaloModal(order) {
    currentOrderId = order.id;
    const detailsContainer = document.getElementById('zalo-modal-details');
    
    const paymentText = order.paymentMethod === 'momo' ? 'Ví Momo' : 
                        order.paymentMethod === 'zalopay' ? 'ZaloPay' : 
                        order.paymentMethod === 'bank' ? 'Chuyển khoản NH' : 'Thẻ / Zalo';
    
    detailsContainer.innerHTML = `
        <div class="text-center mb-5">
            <div class="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-check-circle text-5xl"></i>
            </div>
            <h3 class="text-2xl font-bold tracking-tighter">Đặt hàng thành công!</h3>
            <p class="text-sm text-zinc-400 mt-1.5">Cảm ơn bạn. Vui lòng thanh toán qua Zalo để chúng tôi xử lý đơn hàng.</p>
        </div>
        
        <div class="bg-zinc-950 border border-zinc-700 rounded-2xl p-5 text-sm space-y-2.5">
            <div class="flex justify-between items-center">
                <span class="text-zinc-400">Mã đơn</span> 
                <span class="font-mono font-bold text-emerald-400 text-base">${order.id}</span>
            </div>
            <div class="flex justify-between"><span class="text-zinc-400">Tên Roblox</span> <span class="font-semibold">${order.robloxUsername}</span></div>
            <div class="flex justify-between"><span class="text-zinc-400">Gói Robux</span> <span class="font-semibold">${order.robux.toLocaleString('vi-VN')} ${order.bonus ? `(+${order.bonus} bonus)` : ''}</span></div>
            <div class="flex justify-between pt-3 border-t border-zinc-700">
                <span class="font-medium">Tổng thanh toán</span> 
                <span class="font-bold tabular-nums text-lg">${order.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
        </div>
        
        <div class="mt-4 text-center">
            <div class="text-xs text-zinc-500">Robux sẽ được cộng sau khi xác nhận thanh toán (thường 5-15 phút)</div>
        </div>
    `;

    const modal = document.getElementById('zalo-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

function closeZaloModal() {
    const modal = document.getElementById('zalo-modal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
    currentOrderId = null;
    
    // Refresh profile if open
    if (document.getElementById('profile-section').classList.contains('active')) {
        loadProfile();
    }
    // If admin section open, refresh stats + current visible tab (without forcing tab switch)
    if (document.getElementById('admin-section').classList.contains('active')) {
        const ordersEl = document.getElementById('admin-orders-tab');
        const isOrdersTab = ordersEl && !ordersEl.classList.contains('hidden');
        
        // Update stats without switching tab
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const revenue = orders.reduce((sum, o) => sum + o.total, 0);
        const pending = orders.filter(o => o.status === 'Chờ thanh toán' || o.status === 'Đang xử lý').length;
        
        const totalOrdersEl = document.getElementById('admin-total-orders');
        const revenueEl = document.getElementById('admin-total-revenue');
        const usersEl = document.getElementById('admin-total-users');
        const pendingEl = document.getElementById('admin-pending-orders');
        
        if (totalOrdersEl) totalOrdersEl.innerText = orders.length;
        if (revenueEl) revenueEl.innerText = (revenue / 1000000).toFixed(1) + 'tr';
        if (usersEl) usersEl.innerText = users.length;
        if (pendingEl) pendingEl.innerText = pending;
        
        if (isOrdersTab) {
            renderAdminOrders();
        }
    }
}

function copyOrderCode() {
    if (!currentOrderId) return;
    
    navigator.clipboard.writeText(currentOrderId).then(() => {
        // Find the copy button and give feedback
        const buttons = document.querySelectorAll('#zalo-modal button');
        buttons.forEach(btn => {
            if (btn.textContent.includes('Copy') || btn.innerHTML.includes('fa-copy')) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Đã sao chép!</span>`;
                btn.disabled = true;
                setTimeout(() => {
                    if (btn && btn.parentNode) {
                        btn.innerHTML = originalHTML;
                        btn.disabled = false;
                    }
                }, 2200);
            }
        });
    }).catch(() => {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = currentOrderId;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Đã copy mã đơn: ' + currentOrderId, 'success');
    });
}

function openZalo() {
    const phone = '0993402298';
    const zaloLink = `https://zalo.me/${phone}`;
    window.open(zaloLink, '_blank');
}

function showForgotPassword() {
    const modal = document.getElementById('forgot-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function hideForgotPassword() {
    const modal = document.getElementById('forgot-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

function openZaloSupport() {
    const phone = '0993402298';
    const zaloLink = `https://zalo.me/${phone}`;
    window.open(zaloLink, '_blank');
    setTimeout(hideForgotPassword, 800);
}

function showChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        // Clear previous inputs
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function hideChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

function changePassword() {
    if (!currentUser) return;

    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-new-password').value;

    if (!currentPass || !newPass || !confirmPass) {
        return showToast('Vui lòng điền đầy đủ thông tin', 'warning');
    }

    if (newPass.length < 4) {
        return showToast('Mật khẩu mới phải có ít nhất 4 ký tự', 'warning');
    }

    if (newPass !== confirmPass) {
        return showToast('Mật khẩu xác nhận không khớp', 'error');
    }

    // Verify current password
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1 || users[userIndex].password !== currentPass) {
        return showToast('Mật khẩu hiện tại không đúng', 'error');
    }

    // Update password
    users[userIndex].password = newPass;
    localStorage.setItem('users', JSON.stringify(users));

    // Update currentUser in memory and localStorage
    currentUser.password = newPass;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    hideChangePasswordModal();
    showToast('Đổi mật khẩu thành công!', 'success');
}

// Profile
function loadProfile() {
    if (!currentUser) return;
    document.getElementById('profile-username').innerText = currentUser.username;
    if (currentUser.email) {
        document.getElementById('profile-email').innerText = currentUser.email;
    }
    document.getElementById('profile-joined').innerText = new Date(currentUser.joined).toLocaleDateString('vi-VN');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const myOrders = orders.filter(o => o.userId === currentUser.id);
    const totalSpent = myOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('profile-total-orders').innerText = myOrders.length;
    document.getElementById('profile-total-spent').innerText = totalSpent.toLocaleString('vi-VN') + ' VNĐ';
    filterMyOrders();
}

async function filterMyOrders() {
    if (!currentUser) return;
    const filter = document.getElementById('order-filter').value;
    const container = document.getElementById('my-orders-list');

    try {
        let orders = await (await fetch('/api/orders')).json();
        let myOrders = orders.filter(o => o.userId === currentUser.id);
        if (filter) myOrders = myOrders.filter(o => o.status === filter);

        if (myOrders.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-zinc-400 text-sm">Chưa có đơn hàng nào</div>`;
            return;
        }

        container.innerHTML = '';
        myOrders.forEach(order => {
            const statusClass = order.status === 'Hoàn thành' ? 'status-completed' : order.status === 'Đã hủy' ? 'status-cancelled' : 'status-pending';
            container.innerHTML += `
                <div class="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-sm">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-mono text-emerald-400 text-xs">${order.id}</div>
                            <div class="font-semibold mt-0.5">${order.robux} Robux ${order.bonus ? `(+${order.bonus})` : ''}</div>
                            <div class="text-xs text-zinc-400">${order.robloxUsername}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold tabular-nums">${order.total.toLocaleString('vi-VN')}đ</div>
                            <div class="status-badge ${statusClass} mt-1">${order.status}</div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (err) {
        container.innerHTML = `<div class="text-center py-8 text-red-400 text-sm">Lỗi tải lịch sử đơn</div>`;
    }
}

// Admin
function loadAdminDashboard() {
    if (!currentUser || currentUser.role !== 'admin') return;
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('admin-total-orders').innerText = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('admin-total-revenue').innerText = (revenue / 1000000).toFixed(1) + 'tr';
    document.getElementById('admin-total-users').innerText = users.length;
    document.getElementById('admin-pending-orders').innerText = orders.filter(o => o.status === 'Chờ thanh toán' || o.status === 'Đang xử lý').length;
    switchAdminTab('orders');
}

function switchAdminTab(tab) {
    document.getElementById('admin-orders-tab').classList.add('hidden');
    document.getElementById('admin-packages-tab').classList.add('hidden');
    document.getElementById('admin-users-tab').classList.add('hidden');
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));

    if (tab === 'orders') {
        document.getElementById('admin-orders-tab').classList.remove('hidden');
        document.getElementById('tab-orders').classList.add('active');
        renderAdminOrders();
    } else if (tab === 'packages') {
        document.getElementById('admin-packages-tab').classList.remove('hidden');
        document.getElementById('tab-packages').classList.add('active');
        renderAdminPackages();
    } else if (tab === 'users') {
        document.getElementById('admin-users-tab').classList.remove('hidden');
        document.getElementById('tab-users').classList.add('active');
        renderAdminUsers();
    }
}

async function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-body');
    
    try {
        let orders = await (await fetch('/api/orders')).json();

        // Filter by search input if exists
        const searchInput = document.getElementById('admin-order-search');
        const searchTerm = searchInput && searchInput.value ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            orders = orders.filter(o => o.id.toLowerCase().includes(searchTerm));
        }

        tbody.innerHTML = '';
        if (orders.length === 0) {
            const msg = searchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng';
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-zinc-400">${msg}</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const statusClass = order.status === 'Hoàn thành' ? 'status-completed' : 
                              order.status === 'Đã hủy' ? 'status-cancelled' : 'status-pending';
            const isPending = order.status === 'Chờ thanh toán' || order.status === 'Đang xử lý';
            let actions = isPending 
                ? `<button onclick="updateOrderStatus('${order.id}', 'Hoàn thành')" class="text-emerald-400 hover:text-emerald-300 text-xs px-2">Duyệt</button>
                   <button onclick="updateOrderStatus('${order.id}', 'Đã hủy')" class="text-red-400 hover:text-red-300 text-xs px-2">Hủy</button>`
                : `<span class="text-xs text-zinc-500">Đã xử lý</span>`;
            tbody.innerHTML += `
                <tr class="hover:bg-zinc-800">
                    <td class="px-4 md:px-6 py-4 font-mono text-xs text-emerald-400">${order.id}</td>
                    <td class="px-4 md:px-6 py-4 text-sm">${order.username}<br><span class="text-xs text-zinc-400">${order.robloxUsername}</span></td>
                    <td class="px-4 md:px-6 py-4 hidden md:table-cell">${order.robux} Robux</td>
                    <td class="px-4 md:px-6 py-4 text-right font-mono tabular-nums">${order.total.toLocaleString('vi-VN')}đ</td>
                    <td class="px-4 md:px-6 py-4 text-center"><span class="status-badge ${statusClass}">${order.status}</span></td>
                    <td class="px-4 md:px-6 py-4 text-center">${actions}</td>
                </tr>`;
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Lỗi tải đơn hàng</td></tr>`;
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            renderAdminOrders();
            loadAdminDashboard();
        } else {
            showToast('Cập nhật trạng thái thất bại', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối khi cập nhật đơn', 'error');
    }
}

async function adminResetUserPassword(userId, username) {
    const newPass = prompt(`Nhập mật khẩu mới cho "${username}":`);
    if (!newPass) return;
    if (newPass.length < 4) return alert('Mật khẩu phải ≥ 4 ký tự');

    try {
        const res = await fetch(`/api/users/${userId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPass })
        });
        const data = await res.json();

        if (res.ok) {
            alert(`Đã đổi mật khẩu thành công cho ${username}`);
        } else {
            alert(data.error || 'Đổi mật khẩu thất bại');
        }
    } catch (err) {
        alert('Lỗi kết nối server');
    }
}

function renderAdminPackages() {
    const container = document.getElementById('admin-packages-list');
    container.innerHTML = '';
    packages.forEach(pkg => {
        container.innerHTML += `
            <div class="flex flex-col md:flex-row md:items-center justify-between bg-zinc-800 border border-zinc-700 rounded-2xl p-4 gap-y-3">
                <div class="flex items-center gap-x-4">
                    <div>
                        <div class="font-mono text-2xl font-bold">${pkg.robux}</div>
                        <div class="text-xs text-sky-300 -mt-1">ROBUX ${pkg.bonus ? `(+${pkg.bonus})` : ''}</div>
                    </div>
                    <div class="text-xs px-3 py-1 bg-zinc-700 rounded-2xl">${pkg.label}</div>
                </div>
                <div class="flex items-center gap-x-3">
                    <div class="text-right">
                        <div class="text-xs text-zinc-400">Giá</div>
                        <div class="font-mono font-semibold">${pkg.price.toLocaleString('vi-VN')}</div>
                    </div>
                    <input type="number" value="${pkg.price}" id="price-${pkg.id}" class="w-28 bg-zinc-900 border border-zinc-600 rounded-2xl px-3 py-2 text-sm text-right">
                    <button onclick="updatePackagePrice(${pkg.id})" class="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-sm font-medium rounded-2xl">Lưu</button>
                </div>
            </div>`;
    });
}

async function updatePackagePrice(packageId) {
    const input = document.getElementById('price-' + packageId);
    const newPrice = parseInt(input.value);
    if (!newPrice || newPrice < 10000) return showToast('Giá không hợp lệ', 'error');

    try {
        const res = await fetch(`/api/packages/${packageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: newPrice })
        });

        if (res.ok) {
            const index = packages.findIndex(p => p.id == packageId);
            if (index !== -1) packages[index].price = newPrice;

            showToast('Đã cập nhật giá thành công!', 'success');
            renderAdminPackages();
            if (document.getElementById('shop-section').classList.contains('active')) renderPackages();
        } else {
            showToast('Cập nhật giá thất bại', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối khi cập nhật giá', 'error');
    }
}

async function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-body');
    
    try {
        const [users, orders] = await Promise.all([
            (await fetch('/api/users')).json(),
            (await fetch('/api/orders')).json()
        ]);

        tbody.innerHTML = '';
        
        users.forEach(user => {
            const userOrders = orders.filter(o => o.userId === user.id);
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
            
            tbody.innerHTML += `
                <tr class="hover:bg-zinc-800">
                    <td class="px-4 md:px-6 py-4 font-semibold">
                        ${user.username} 
                        ${user.role === 'admin' ? '<span class="text-xs bg-red-900 text-red-300 px-2 rounded ml-1">Admin</span>' : ''}
                    </td>
                    <td class="px-4 md:px-6 py-4 text-xs text-zinc-400 hidden md:table-cell">
                        ${new Date(user.joined).toLocaleDateString('vi-VN')}
                    </td>
                    <td class="px-4 md:px-6 py-4 text-right">${userOrders.length}</td>
                    <td class="px-4 md:px-6 py-4 text-right font-mono tabular-nums">
                        ${totalSpent.toLocaleString('vi-VN')}đ
                    </td>
                    <td class="px-4 md:px-6 py-4 text-center">
                        <button onclick="adminResetUserPassword(${user.id}, '${user.username}')" 
                                class="px-3 py-1 text-xs bg-sky-600 hover:bg-sky-500 rounded-xl">
                            Đổi mật khẩu
                        </button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Lỗi tải danh sách người dùng</td></tr>`;
    }
}

function seedDemoData() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([
            { id: 1, username: 'Kjc88', email: 'admin@rbvietjet.com', password: '20298393)₫!\"?*', role: 'admin', joined: '2025-01-10T00:00:00Z' },
            { id: 2, username: 'test', email: 'test@example.com', password: '123', role: 'user', joined: '2025-06-15T00:00:00Z' },
            { id: 3, username: 'nghia1704', email: 'nghia1704@example.com', password: '123', role: 'user', joined: '2026-01-20T00:00:00Z' }
        ]));
    }
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([
            { id: 'RBX-881234', userId: 2, username: 'test', robloxUsername: 'ProGamer_VN', robux: 1700, bonus: 120, total: 499000, paymentMethod: 'momo', status: 'Hoàn thành', createdAt: '2026-07-10T09:30:00Z' },
            { id: 'RBX-881567', userId: 3, username: 'nghia1704', robloxUsername: 'HaoRoblox', robux: 800, bonus: 50, total: 235000, paymentMethod: 'zalopay', status: 'Chờ thanh toán', createdAt: '2026-07-12T14:20:00Z' }
        ]));
    }
}

// === Device Verification (chống truy cập trái phép) ===
function checkDeviceVerification() {
    if (localStorage.getItem('deviceVerified') === 'true') {
        return true;
    }
    // Hiện modal xác minh
    const modal = document.getElementById('device-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
    return false;
}

function verifyDevice() {
    localStorage.setItem('deviceVerified', 'true');
    const modal = document.getElementById('device-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
    // Tiếp tục init sau khi xác minh
    init();
}

window.onload = function() {
    // Kiểm tra device verification trước
    if (localStorage.getItem('deviceVerified') !== 'true') {
        const modal = document.getElementById('device-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        }
        return; // Chờ user xác minh
    }
    // Đã xác minh → chạy init bình thường
    init();
};