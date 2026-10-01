const defaultMenus = [
    { id: 1, name: "Sweet Mini Donuts Pack (PO)", category: "sweet", desc: "3 Donat Mini lezat (Bisa pilih varian rasa sendiri!)", price: 10000, available: true },
    { id: 2, name: "Savory Mini Risol Pack (PO)", category: "savory", desc: "3 Risol Mini renyah isian mayo & ragout gurih melimpah", price: 10000, available: true },
    { id: 3, name: "Box Mix Combo 2-in-1 (PO)", category: "mix", desc: "Paket Kombo Hemat: 2 Donat Mini + 2 Risol Mini", price: 12000, available: true }
];

function getActiveMenus() {
    const saved = localStorage.getItem('onebite_menus');
    return saved ? JSON.parse(saved) : defaultMenus;
}

function saveMenus(menus) {
    localStorage.setItem('onebite_menus', JSON.stringify(menus));
}

let cart = [];

// ========================================================
// 📱 UBAH NOMOR WHATSAPP ADMIN DI BAWAH INI (Pakai 62):
// ========================================================
const adminPhoneNumber = "6285654209605"; 

// 🔑 PASSWORD PANEL ADMIN:
const ADMIN_PASSWORD = "admin123";

const googleScriptUrl = "https://script.google.com/macros/s/AKfycbyAwuXiWzV5zMCdoSQP03BaxDry61nEoitCAt_MFpXVb-2VJgfTkvw4y5a9k-8O5XxW1g/exec";

document.addEventListener("DOMContentLoaded", function() {
    // Proteksi Keamanan Halaman Admin
    if (window.location.pathname.includes('admin.html')) {
        const isAuth = sessionStorage.getItem('admin_authenticated');
        if (!isAuth) {
            alert("Akses Ditolak! Anda harus memasukkan password admin dari halaman utama.");
            window.location.href = 'index.html';
            return;
        }
    }

    const pickupDateInput = document.getElementById('pickupDate');
    if (pickupDateInput) {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        pickupDateInput.setAttribute('min', today.toISOString().split('T')[0]);
        pickupDateInput.value = today.toISOString().split('T')[0];
    }

    if (document.getElementById('menuList')) renderMenu('all');
    if (document.getElementById('adminMenuList')) renderAdminMenu();
});

// Fungsi Membuka Admin Dengan Password
function openAdminWithPassword() {
    const inputPass = prompt("Masukkan Password Admin:");
    if (inputPass === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_authenticated', 'true');
        window.location.href = 'admin.html';
    } else if (inputPass !== null) {
        alert("Password Salah! Akses ditolak.");
    }
}

function renderMenu(filter = 'all') {
    const menuContainer = document.getElementById('menuList');
    if (!menuContainer) return;
    
    menuContainer.innerHTML = '';
    const menus = getActiveMenus();
    const filteredMenus = filter === 'all' ? menus : menus.filter(m => m.category === filter);

    filteredMenus.forEach((item, index) => {
        const isAvailable = item.available !== false;
        const btnText = isAvailable ? "+ Pilih" : "Habis";
        const btnDisabled = isAvailable ? "" : "disabled style='background: #ccc; cursor: not-allowed;'";

        menuContainer.innerHTML += `
            <div class="menu-card slide-up" style="animation-delay: ${index * 0.1}s;">
                <div class="menu-info">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                    <span class="price">Rp${Number(item.price).toLocaleString('id-ID')}</span>
                    <span class="stock-tag">${isAvailable ? "Kuota PO" : "Tutup PO"}</span>
                </div>
                <button class="add-btn btn-pop" ${btnDisabled} onclick="addToCart(${item.id})">${btnText}</button>
            </div>
        `;
    });
}

function filterMenu(category, event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');
    renderMenu(category);
}

function addToCart(id) {
    const selectedItem = getActiveMenus().find(m => m.id === id);
    if (selectedItem) {
        cart.push(selectedItem);
        updateTotal();
        checkDonutInCart();
        alert(`✨ ${selectedItem.name} ditambahkan ke Pre-Order!`);
    }
}

// Cek apakah ada Donat / Combo di Keranjang untuk Menampilkan Box Rasa
function checkDonutInCart() {
    const flavorBox = document.getElementById('flavorBox');
    if (!flavorBox) return;

    const hasDonut = cart.some(item => 
        item.name.toLowerCase().includes('donat') || 
        item.name.toLowerCase().includes('donut') || 
        item.name.toLowerCase().includes('combo') || 
        item.category === 'sweet' || 
        item.category === 'mix'
    );

    if (hasDonut) {
        flavorBox.style.display = 'block';
    } else {
        flavorBox.style.display = 'none';
    }
}

function updateTotal() {
    const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const totalPriceElem = document.getElementById('totalPrice');
    if (totalPriceElem) totalPriceElem.innerText = `Rp${total.toLocaleString('id-ID')}`;
}

async function processOrder() {
    const name = document.getElementById('userName').value.trim();
    const pickupDate = document.getElementById('pickupDate').value;
    const pickupTime = document.getElementById('pickupTime').value;
    const pickupLocation = document.getElementById('pickupLocation').value.trim();

    const flavorBox = document.getElementById('flavorBox');
    let flavorText = "Tidak Ada Donat";

    if (flavorBox && flavorBox.style.display !== 'none') {
        const selectedFlavors = Array.from(document.querySelectorAll('.flavor-option:checked')).map(cb => cb.value);
        flavorText = selectedFlavors.length > 0 ? selectedFlavors.join(', ') : "Bebas / Campur";
    }

    if (cart.length === 0 || !name || !pickupDate || !pickupTime || !pickupLocation) {
        alert("Mohon lengkapi semua data dan pilih minimal 1 menu!");
        return;
    }

    let orderList = cart.map(item => `${item.name}`).join(', ');
    let total = cart.reduce((sum, item) => sum + Number(item.price), 0);

    try {
        await fetch(googleScriptUrl, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, pickupTime: `Tgl ${pickupDate} - Jam ${pickupTime}`, pickupLocation: `${pickupLocation} (Rasa: ${flavorText})`, orderList, total: `Rp${total.toLocaleString('id-ID')}` })
        });
    } catch (e) {}

    let waMessage = `Halo Admin OneBite 🍩!\n\nPesanan Pre-Order Baru:\n${cart.map(i => `- ${i.name}`).join('\n')}\n\n🍩 *Rasa Donat:* ${flavorText}\n*Total:* Rp${total.toLocaleString('id-ID')}\n*Nama:* ${name}\n*Jadwal Ambil:* ${pickupDate} (${pickupTime} WITA)\n*Lokasi:* ${pickupLocation}`;
    window.open(`https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(waMessage)}`, '_blank');
}

function renderAdminMenu() {
    const adminContainer = document.getElementById('adminMenuList');
    if (!adminContainer) return;
    adminContainer.innerHTML = '';

    getActiveMenus().forEach(item => {
        const isAvailable = item.available !== false;
        adminContainer.innerHTML += `
            <div class="admin-menu-item slide-up">
                <div>
                    <h4 style="margin:0">${item.name}</h4>
                    <p style="margin:2px 0; font-size:12px; color:#666;">${item.desc}</p>
                    <span style="color:#FF3366; font-weight:bold;">Rp${Number(item.price).toLocaleString('id-ID')}</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="toggleAvailability(${item.id})" style="background:${isAvailable ? '#ffc107' : '#28a745'}; border:none; padding:6px; border-radius:6px; cursor:pointer;">${isAvailable ? 'Habis' : 'Tersedia'}</button>
                    <button onclick="deleteMenu(${item.id})" style="background:#dc3545; color:white; border:none; padding:6px; border-radius:6px; cursor:pointer;">Hapus</button>
                </div>
            </div>
        `;
    });
}

function addNewMenu(e) {
    e.preventDefault();
    const menus = getActiveMenus();
    menus.push({
        id: Date.now(),
        name: document.getElementById('newMenuName').value.trim() + " (PO)",
        category: document.getElementById('newMenuCategory').value,
        desc: document.getElementById('newMenuDesc').value.trim(),
        price: parseInt(document.getElementById('newMenuPrice').value),
        available: true
    });
    saveMenus(menus);
    document.getElementById('addMenuForm').reset();
    renderAdminMenu();
}

function toggleAvailability(id) {
    let menus = getActiveMenus().map(m => { if (m.id === id) m.available = !m.available; return m; });
    saveMenus(menus);
    renderAdminMenu();
}

function deleteMenu(id) {
    if (confirm("Hapus menu ini?")) {
        saveMenus(getActiveMenus().filter(m => m.id !== id));
        renderAdminMenu();
    }
}

function resetToDefaultMenus() {
    if (confirm("Reset menu awal?")) { saveMenus(defaultMenus); renderAdminMenu(); }
}