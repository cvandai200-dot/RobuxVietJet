// Roblox Avatar via Local Proxy (bypasses CORS)
let robloxAvatarTimeout = null;

async function fetchRobloxAvatar() {
    const input = document.getElementById('roblox-username');
    const preview = document.getElementById('roblox-avatar-preview');
    const img = document.getElementById('roblox-avatar-img');
    const status = document.getElementById('roblox-username-status');
    
    const username = input.value.trim();
    
    if (!username) {
        preview.classList.add('hidden');
        status.innerHTML = '';
        return;
    }
    
    // Hiển thị loading
    status.innerHTML = `<span class="text-zinc-400 text-xs flex items-center gap-x-1.5"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải avatar...</span>`;
    preview.classList.add('hidden');
    
    try {
        // Call local proxy instead of direct Roblox API
        const res = await fetch(`/api/roblox-avatar?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        
        if (data.success && data.avatarUrl) {
            img.src = data.avatarUrl;
            preview.classList.remove('hidden');
            status.innerHTML = `<span class="text-emerald-400 text-xs">✓ Tìm thấy (ID: ${data.userId})</span>`;
        } else {
            preview.classList.add('hidden');
            status.innerHTML = `<span class="text-red-400 text-xs">${data.error || 'Không tìm thấy tài khoản'}</span>`;
        }
    } catch (err) {
        preview.classList.add('hidden');
        status.innerHTML = `<span class="text-amber-400 text-xs">Không thể kết nối proxy. Hãy chạy server.js</span>`;
    }
}

function debounceFetchRobloxAvatar() {
    clearTimeout(robloxAvatarTimeout);
    robloxAvatarTimeout = setTimeout(() => {
        fetchRobloxAvatar();
    }, 600);
}