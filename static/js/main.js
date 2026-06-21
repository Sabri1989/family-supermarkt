// ============================================
// سلة التسوق والمتغيرات العامة
// ============================================
let cart = [];
let currentFilter = "all";
let currentSearch = "";
let currentMinPrice = 0;
let currentMaxPrice = 100;
let currentPage = 1;
const productsPerPage = 12;

function getCategoryIcon(cat) {
    const icons = { dairy: '🥛 ألبان', bakery: '🍞 مخبوزات', oils: '🫒 زيوت', sweets: '🍰 حلويات', beverages: '🧃 مشروبات', frozen: '❄️ مجمدات' };
    return icons[cat] || 'منتج';
}

// ========== دوال الترقيم ==========
function renderPagination(totalPages, currentPageNumber) {
    const paginationDiv = document.getElementById('pagination-container');
    if (!paginationDiv) return;
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    let html = '<nav><ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPageNumber ? 'active' : ''}">
                    <button class="page-link" data-page="${i}">${i}</button>
                 </li>`;
    }
    html += '</ul></nav>';
    paginationDiv.innerHTML = html;

    // ربط الأحداث
    document.querySelectorAll('#pagination-container .page-link').forEach(btn => {
        btn.removeEventListener('click', paginationClickHandler);
        btn.addEventListener('click', paginationClickHandler);
    });
}

function paginationClickHandler(e) {
    const newPage = parseInt(e.target.dataset.page);
    if (!isNaN(newPage) && newPage !== currentPage) {
        currentPage = newPage;
        displayProducts();
    }
}

// ========== فتح مودال المنتج ==========
async function openProductModal(productId) { 
    try {
        const response = await fetch('/api/products?page=1&per_page=100');
        const data = await response.json();
        const products = data.products || data;
        const product = products.find(p => p.id == productId);
        if (!product) return;

        // استخدام SweetAlert2 لعرض تفاصيل المنتج
        const result = await Swal.fire({
            title: product.name,
            html: `
                <div style="text-align: center;">
                    <img src="${product.image}" style="max-width: 100%; max-height: 200px; border-radius: 12px; margin-bottom: 15px;">
                    <p><strong>القسم:</strong> ${product.category}</p>
                    <p><strong>السعر:</strong> ${product.price} يورو</p>
                    <p>${product.description || 'منتج طازج وعالي الجودة من Family Supermarkt.'}</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '🛒 أضف إلى السلة',
            cancelButtonText: 'إغلاق',
            confirmButtonColor: '#25D366',
            cancelButtonColor: '#d33',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            addToCart(product.id);
            Swal.fire('تم الإضافة', 'تم إضافة المنتج إلى السلة', 'success');
        }
    } catch (err) {
        console.error('خطأ في فتح النافذة:', err);
        Swal.fire('خطأ', 'حدث خطأ، حاول مرة أخرى', 'error');
    }
}


// ========== عرض الصورة بحجم كبير عند النقر عليها ==========
function setupImageClick() {
    // استخدام تفويض الأحداث على المستوى الأعلى (document)
    document.removeEventListener('click', imageClickHandler);
    document.addEventListener('click', imageClickHandler);
}

function imageClickHandler(e) {
    const img = e.target.closest('.product-img, .ice-cream-img');
    if (!img) return;
    
    // منع فتح المودال إذا كانت الصورة ضمن زر أو رابط
    if (e.target.closest('.btn-add-cart') || e.target.closest('a')) return;
    
    const src = img.getAttribute('src');
    if (src && !src.includes('placeholder') && !src.includes('placehold')) {
        const modal = new bootstrap.Modal(document.getElementById('imageModal'));
        document.getElementById('modalFullImage').src = src;
        modal.show();
    }
}


// ========== التحكم بتكبير الصورة في المودال ==========
let currentZoom = 1;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

function setupImageZoom() {
    const img = document.getElementById('modalFullImage');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const zoomLevelSpan = document.getElementById('zoomLevel');
    
    if (!img || !zoomInBtn || !zoomOutBtn || !zoomResetBtn) return;

    // تحديث حجم الصورة وعرض النسبة
    function updateZoom() {
        img.style.transform = `scale(${currentZoom})`;
        zoomLevelSpan.textContent = Math.round(currentZoom * 100) + '%';
    }

    // تكبير
    zoomInBtn.addEventListener('click', () => {
        if (currentZoom < MAX_ZOOM) {
            currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
            updateZoom();
        }
    });

    // تصغير
    zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > MIN_ZOOM) {
            currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
            updateZoom();
        }
    });

    // إعادة ضبط
    zoomResetBtn.addEventListener('click', () => {
        currentZoom = 1;
        updateZoom();
    });

    // تكبير باستخدام عجلة الفأرة
    img.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            // تمرير لأعلى → تكبير
            currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
        } else {
            // تمرير لأسفل → تصغير
            currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
        }
        updateZoom();
    }, { passive: false });

    // إعادة الضبط عند فتح مودال جديد
    const modalElement = document.getElementById('imageModal');
    modalElement.addEventListener('show.bs.modal', () => {
        currentZoom = 1;
        updateZoom();
    });
}

// ========== عرض المنتجات ==========
async function displayProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    const url = `/api/products?page=${currentPage}&per_page=${productsPerPage}`;
    const response = await fetch(url);
    const data = await response.json();
    const products = data.products || [];

    console.log(`total_pages: ${data.total_pages}, currentPage: ${data.page}`);

    // تطبيق الفلاتر
    let filtered = products.filter(p => {
        if (currentFilter !== "all" && p.category !== currentFilter) return false;
        if (currentSearch && !p.name.toLowerCase().includes(currentSearch.toLowerCase())) return false;
        if (p.price < currentMinPrice || p.price > currentMaxPrice) return false;
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-center py-5" style="width:100%;"><i class="fas fa-box-open fa-3x text-muted"></i><p>لا توجد منتجات</p></div>';
    } else {
        container.innerHTML = filtered.map(p => `
            <div class="product-slide">
                <div class="product-card">
                    <img src="${p.image}" class="product-img" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f5a623/white?text=Image+Not+Found'">
                    <div class="card-body">
                        <span class="product-category">${getCategoryIcon(p.category)}</span>
                        <h5 class="product-title">${p.name}</h5>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="product-price">${p.price} يورو</span>
                            <button class="btn-add-cart" data-id="${p.id}"><i class="fas fa-cart-plus"></i> أضف</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ربط أزرار الإضافة
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.removeEventListener('click', btn._listener);
        const listener = () => addToCart(parseInt(btn.dataset.id));
        btn.addEventListener('click', listener);
        btn._listener = listener;
    });

    // إخفاء الترقيم في العرض الأفقي
    const paginationDiv = document.getElementById('pagination-container');
    if (paginationDiv) paginationDiv.style.display = 'none';
}

// ========== عرض المثلجات ==========
async function displayIceCream() {
    const container = document.getElementById('iceCreamContainer');
    if (!container) return;

    try {
        const response = await fetch('/api/products?page=1&per_page=100');
        const data = await response.json();
        const allProducts = data.products || data;
        const iceCreams = allProducts.filter(p => p.category === 'icecream');

        if (iceCreams.length === 0) {
            container.innerHTML = '<div class="text-center py-3" style="width:100%;"><p>لا توجد مثلجات حالياً</p></div>';
            return;
        }

        container.innerHTML = iceCreams.map(p => `
            <div class="ice-slide">
                <div class="product-card ice-cream-card">
                    <div class="ice-cream-img-wrapper">
                        <img src="${p.image}" class="product-img" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/e84393/white?text=Ice+Cream'">
                        <div class="ice-cream-overlay"><span>🔥 خصم خاص</span></div>
                    </div>
                    <div class="card-body text-center">
                        <h5 class="product-title">${p.name}</h5>
                        <p class="small text-muted">طعم رائع ومنعش</p>
                        <div class="product-price">${p.price} يورو</div>
                        <button class="btn-add-cart" data-id="${p.id}"><i class="fas fa-cart-plus"></i> أضف</button>
                    </div>
                </div>
            </div>
        `).join('');

        // ربط أزرار الإضافة
        document.querySelectorAll('#iceCreamContainer .btn-add-cart').forEach(btn => {
            btn.removeEventListener('click', btn._listener);
            const listener = () => addToCart(parseInt(btn.dataset.id));
            btn.addEventListener('click', listener);
            btn._listener = listener;
        });
    } catch (error) {
        console.error('خطأ في تحميل المثلجات:', error);
        container.innerHTML = '<div class="text-center text-danger py-3" style="width:100%;"><p>حدث خطأ في تحميل المثلجات</p></div>';
    }
}
// ========== إضافة إلى السلة ==========
async function addToCart(id) {
    console.log("🛒 تم الضغط على إضافة للمنتج رقم:", id);
    try {
        const response = await fetch('/api/products?page=1&per_page=100');
        const data = await response.json();
        const products = data.products || data;
        const product = products.find(p => p.id == id);
        if (!product) {
            console.warn("⚠️ المنتج غير موجود");
            return;
        }
        const existing = cart.find(item => item.id == id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
        saveCart();
        showToast();
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
    }
}

// ========== دوال السلة العامة ==========
function showToast() {
    const toast = document.createElement('div');
    toast.innerHTML = '✅ تم إضافة المنتج إلى السلة';
    toast.style.cssText = 'position:fixed;bottom:100px;right:20px;background:#25D366;color:white;padding:10px 20px;border-radius:30px;z-index:9999;animation:fadeOut 2s ease';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function saveCart() {
    localStorage.setItem('foodCart', JSON.stringify(cart));
    updateCartUI();
    renderCartModal();
}

function updateCartUI() {
    const total = cart.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.innerText = total;
}

function renderCartModal() {
    const container = document.getElementById('cartItemsList');
    const totalElement = document.getElementById('cartTotalPrice');
    if (!container) return;
    if (!cart || cart.length === 0) {
        container.innerHTML = '<p class="text-center py-5">السلة فارغة</p>';
        if (totalElement) totalElement.innerText = '0';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const itemTotal = price * quantity;
        total += itemTotal;
        return `
            <div class="cart-item-modal">
                <div><strong>${item.name}</strong><br><small>${price.toFixed(2)} يورو</small></div>
                <div><button class="qty-btn" onclick="updateQuantity(${item.id}, ${quantity - 1})">-</button> ${quantity} <button class="qty-btn" onclick="updateQuantity(${item.id}, ${quantity + 1})">+</button></div>
                <div>${itemTotal.toFixed(2)} يورو</div>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');
    if (totalElement) totalElement.innerText = total.toFixed(2);
}

window.updateQuantity = function(id, newQty) {
    if (newQty <= 0) {
        removeFromCart(id);
        return;
    }
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = newQty;
        saveCart();
    }
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
};

function applyFilters() {
    displayProducts();
}

function switchPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) targetPage.classList.add('active-page');
    window.scrollTo(0, 0);
    const qf = document.getElementById('qualityFooter');
    if (qf) qf.style.display = (pageId === 'home' || pageId === 'products') ? 'block' : 'none';
    if (pageId === 'products') displayProducts();
}

// ========== العروض الخاصة ==========
async function displayOffers() {
    const container = document.getElementById('offersContainer');
    if (!container) return;
    
    const response = await fetch('/api/offers');
    const offersData = await response.json();

    function getOfferPrice(price, discount) {
        return price - (price * discount / 100);
    }

    if (offersData.length === 0) {
        container.innerHTML = '<div class="text-center py-3" style="width:100%;"><p>لا توجد عروض حالياً</p></div>';
    } else {
        container.innerHTML = offersData.map(offer => {
            const newPrice = getOfferPrice(offer.price, offer.discount);
            return `
                <div class="offer-slide">
                    <div class="product-card" style="position: relative; border: 2px solid #d32f2f;">
                        <div class="offer-badge"><i class="fas fa-tag"></i> خصم ${offer.discount}%</div>
                        <img src="${offer.image}" class="product-img" alt="${offer.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/d32f2f/white?text=Offer'">
                        <div class="card-body">
                            <h5 class="product-title">${offer.name}</h5>
                            <div class="product-price">
                                <span class="original-price">${offer.price} يورو</span>
                                <span class="discount-price">${newPrice.toFixed(2)} يورو</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <button class="btn-add-offer" data-offer-id="${offer.id}"><i class="fas fa-cart-plus"></i> أضف</button>
                                <button class="whatsapp-share" data-offer-id="${offer.id}"><i class="fab fa-whatsapp"></i> مشاركة</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ربط أزرار الإضافة
    document.querySelectorAll('.btn-add-offer').forEach(btn => {
        btn.removeEventListener('click', btn._offerListener);
        const listener = async () => {
            const id = parseInt(btn.dataset.offerId);
            const res = await fetch('/api/offers');
            const offers = await res.json();
            const offer = offers.find(o => o.id === id);
            if (offer) {
                const newPrice = offer.price - (offer.price * offer.discount / 100);
                const existing = cart.find(item => item.id === offer.id);
                if (existing) existing.quantity++;
                else cart.push({ id: offer.id, name: offer.name, price: newPrice, quantity: 1 });
                saveCart();
                showToast();
            }
        };
        btn.addEventListener('click', listener);
        btn._offerListener = listener;
    });

    // ربط أزرار المشاركة
    document.querySelectorAll('.whatsapp-share').forEach(btn => {
        btn.removeEventListener('click', btn._shareListener);
        const handler = () => {
            const offerId = parseInt(btn.dataset.offerId);
            shareOffer(offerId);
        };
        btn.addEventListener('click', handler);
        btn._shareListener = handler;
    });
}

// ========== مشاركة واتساب ==========
async function shareOffer(offerId) {
    try {
        const response = await fetch('/api/offers');
        const offers = await response.json();
        const offer = offers.find(o => o.id == offerId);
        if (offer) {
            const newPrice = (offer.price - (offer.price * offer.discount / 100)).toFixed(2);
            const text = `*${offer.name}*%0aالسعر الأصلي: ${offer.price} يورو%0aالخصم: ${offer.discount}%25%0aالسعر بعد الخصم: ${newPrice} يورو%0a%0aاطلب الآن من Family Supermarkt`;
            window.open(`https://wa.me/?text=${text}`, '_blank');
        } else {
            alert('العرض غير موجود');
        }
    } catch (error) {
        console.error('خطأ في المشاركة:', error);
        alert('حدث خطأ، حاول مرة أخرى');
    }
}

async function shareAllProducts() {
    try {
        const response = await fetch('/api/products?page=1&per_page=100');
        const data = await response.json();
        const products = data.products || data;
        if (!products.length) {
            alert('لا توجد منتجات للمشاركة');
            return;
        }
        let message = '*جميع منتجات Family Supermarkt*%0a%0a';
        products.forEach(p => {
            message += `• ${p.name}: ${p.price} يورو%0a`;
        });
        message += `%0aللطلب أو الاستفسار: ${window.location.href}`;
        window.open(`https://wa.me/?text=${message}`, '_blank');
    } catch (error) {
        console.error('خطأ في مشاركة المنتجات:', error);
        alert('حدث خطأ، حاول مرة أخرى');
    }
}

function shareAllOffers() {}
function addGlobalShareButton() {}

// ========== تحميل السلة المخزنة ==========
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('foodCart');
    if (savedCart) {
        try {
            const parsedCart = JSON.parse(savedCart);
            if (Array.isArray(parsedCart)) cart = parsedCart.filter(item => item && typeof item === 'object' && item.id && item.name);
        } catch(e) { cart = []; }
    } else { cart = []; }
    updateCartUI();
    renderCartModal();
}

// ========== تهيئة الصفحة ==========
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();

    const searchBtn = document.getElementById('topSearchBtn');
    const searchInput = document.getElementById('topSearchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentSearch = searchInput.value;
            switchPage('products');
            applyFilters();
        });
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentSearch = searchInput.value;
                switchPage('products');
                applyFilters();
            }
        });
    }

    // الكاروسيل الرئيسي
    const mainCarousel = document.getElementById('mainCarousel');
    if (mainCarousel) {
        new bootstrap.Carousel(mainCarousel, {
            interval: 5000,
            ride: 'carousel',
            wrap: true
        });
    }

    // الفلاتر
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            currentFilter = badge.dataset.category;
            applyFilters();
        });
    });

    const priceBtn = document.getElementById('priceFilterBtn');
    if (priceBtn) {
        priceBtn.addEventListener('click', () => {
            currentMinPrice = parseInt(document.getElementById('minPrice').value) || 0;
            currentMaxPrice = parseInt(document.getElementById('maxPrice').value) || 100;
            applyFilters();
        });
    }

    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentFilter = "all";
            currentSearch = "";
            currentMinPrice = 0;
            currentMaxPrice = 100;
            if (searchInput) searchInput.value = "";
            document.getElementById('minPrice').value = 0;
            document.getElementById('maxPrice').value = 100;
            document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
            const allBadge = document.querySelector('.filter-badge[data-category="all"]');
            if (allBadge) allBadge.classList.add('active');
            applyFilters();
        });
    }

    document.querySelectorAll('.dropdown-menu-custom a[data-filter]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentFilter = link.dataset.filter;
            document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
            if (currentFilter === "all") {
                const allBadge = document.querySelector('.filter-badge[data-category="all"]');
                if (allBadge) allBadge.classList.add('active');
            } else {
                const targetBadge = document.querySelector(`.filter-badge[data-category="${currentFilter}"]`);
                if (targetBadge) targetBadge.classList.add('active');
            }
            switchPage('products');
            applyFilters();
        });
    });

    // التنقل بين الصفحات
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', () => switchPage(link.dataset.page));
    });
    document.querySelectorAll('.footer-links a[data-page]').forEach(link => {
        link.addEventListener('click', () => switchPage(link.dataset.page));
    });

    const shopBtn = document.getElementById('shopNowBtn');
    if (shopBtn) shopBtn.addEventListener('click', () => switchPage('products'));

    const scrollTopBtn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        if (scrollTopBtn) scrollTopBtn.classList.toggle('show', window.scrollY > 300);
    });
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo(0, 0));

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            renderCartModal();
            const modal = new bootstrap.Modal(document.getElementById('cartModal'));
            modal.show();
        });
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) { alert('السلة فارغة'); return; }
            const total = cart.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
            alert(`✅ شكراً لتسوقكم!\n💰 الإجمالي: ${total.toFixed(2)} يورو`);
            cart = [];
            saveCart();
            renderCartModal();
            const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (modal) modal.hide();
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = contactForm.querySelector('input[placeholder="الاسم الكامل"]').value;
            const email = contactForm.querySelector('input[placeholder="البريد الإلكتروني"]').value;
            const message = contactForm.querySelector('textarea').value;
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            const result = await response.json();
            if (result.success) {
                alert('📨 تم إرسال رسالتك بنجاح!');
                contactForm.reset();
            } else {
                alert('❌ حدث خطأ: ' + (result.error || 'يرجى المحاولة لاحقاً'));
            }
        });
    }

    setTimeout(() => {
        const popup = document.getElementById('welcomePopup');
        const overlay = document.getElementById('popupOverlay');
        if (popup && overlay && !localStorage.getItem('visited')) {
            popup.classList.add('show');
            overlay.classList.add('show');
            localStorage.setItem('visited', 'true');
        }
    }, 500);

    displayOffers();
    addGlobalShareButton();
    displayProducts();
    displayIceCream();
    updateCartUI();
     setupImageClick();
        setupImageZoom();
});

// تأثير الـ Toast
const style = document.createElement('style');
style.textContent = `@keyframes fadeOut{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(20px)}}`;
document.head.appendChild(style);