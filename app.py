from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3
import os
import time
from werkzeug.utils import secure_filename
#import zxcvbn 


app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'  # مطلوب لـ Flask-Login
CORS(app)

# مسار قاعدة البيانات
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'supermarket.db')

# إعدادات رفع الملفات
UPLOAD_FOLDER = os.path.join('static', 'images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



def is_password_strong(password):
    """
    تتحقق من قوة كلمة المرور:
    - 8 أحرف على الأقل
    - حرف كبير (A-Z)
    - حرف صغير (a-z)
    - رقم (0-9)
    - رمز خاص (!@#$%^&*...)
    """
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    if not any(c in '!@#$%^&*()_+-=[]{};:\'",.<>/?`~' for c in password):
        return False
    return True




def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ------------------- إعداد Flask-Login -------------------
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

class Admin(UserMixin):
    def __init__(self, id, username):
        self.id = id
        self.username = username

@login_manager.user_loader
def load_user(user_id):
    conn = get_db()
    admin = conn.execute('SELECT * FROM admin WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    if admin:
        return Admin(admin['id'], admin['username'])
    return None

# ------------------- مسارات الواجهة العامة -------------------
@app.route('/')
def index():
    social_links = {
        'facebook': 'https://www.facebook.com/YOUR_PAGE',
        'instagram': 'https://www.instagram.com/YOUR_PAGE',
        'tiktok': 'https://www.tiktok.com/@YOUR_PAGE',
        'whatsapp': 'https://wa.me/YOUR_NUMBER'
    }
    return render_template('index.html', social_links=social_links)
# API: جلب جميع المنتجات


# API: جلب العروض الخاصة


@app.route('/api/products')
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    offset = (page - 1) * per_page
    
    conn = get_db()
    total = conn.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    products = conn.execute('SELECT * FROM products LIMIT ? OFFSET ?', (per_page, offset)).fetchall()
    conn.close()
    
    return jsonify({
        'products': [dict(p) for p in products],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })

# اضافة مسار لعرض صفحة الكتالوج
@app.route('/catalog')
def catalog():
    conn = get_db()
    products = conn.execute('SELECT * FROM products ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('catalog.html', products=products)




@app.context_processor
def inject_now():
    return {'now': datetime.now}

@app.route('/catalog/print')
def catalog_print():
    conn = get_db()
    products = conn.execute('SELECT * FROM products ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('catalog_print.html', products=products)


@app.route('/api/offers')
def get_offers():
    conn = get_db()
    offers = conn.execute('SELECT * FROM offers').fetchall()
    conn.close()
    return jsonify([dict(o) for o in offers])



# API: إرسال رسالة من نموذج الاتصال
@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    
    if not name or not email or not message:
        return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
    
    conn = get_db()
    conn.execute('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
                 (name, email, message))
    conn.commit()
    conn.close()
    return jsonify({'success': 'تم إرسال رسالتك بنجاح'})










# ------------------- لوحة التحكم (Admin) -------------------
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db()
        admin = conn.execute('SELECT * FROM admin WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if admin and check_password_hash(admin['password'], password):
            admin_obj = Admin(admin['id'], admin['username'])
            login_user(admin_obj)
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin_login.html', error="اسم المستخدم أو كلمة المرور غير صحيحة")
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    conn = get_db()
    products = conn.execute('SELECT * FROM products').fetchall()
    offers = conn.execute('SELECT * FROM offers').fetchall()
    messages = conn.execute('SELECT * FROM messages ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('admin_dashboard.html', products=products, offers=offers, messages=messages)






@app.route('/admin/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_pw = request.form.get('current_password')
        new_pw = request.form.get('new_password')
        confirm_pw = request.form.get('confirm_password')
        
        conn = get_db()
        admin = conn.execute('SELECT password FROM admin WHERE id = ?', (current_user.id,)).fetchone()
        conn.close()
        
        if not check_password_hash(admin['password'], current_pw):
            flash('❌ كلمة المرور الحالية غير صحيحة', 'danger')
            return redirect(url_for('change_password'))
        
        if new_pw != confirm_pw:
            flash('❌ كلمة المرور الجديدة وتأكيدها غير متطابقين', 'danger')
            return redirect(url_for('change_password'))
        
        if not is_password_strong(new_pw):
            flash('⚠️ كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، وتتضمن أحرفاً كبيرة وصغيرة وأرقاماً ورموزاً.', 'danger')
            return redirect(url_for('change_password'))
        
        hashed = generate_password_hash(new_pw)
        conn = get_db()
        conn.execute('UPDATE admin SET password = ? WHERE id = ?', (hashed, current_user.id))
        conn.commit()
        conn.close()
        
        flash('✅ تم تغيير كلمة المرور بنجاح', 'success')
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin_change_password.html')





# ------------------- API حذف الرسائل -------------------
@app.route('/api/admin/messages/<int:id>', methods=['DELETE'])
@login_required
def delete_message(id):
    conn = get_db()
    conn.execute('DELETE FROM messages WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': 'تم حذف الرسالة'})












# ------------------- API إدارة المنتجات -------------------
@app.route('/api/admin/products', methods=['POST'])
@login_required
def add_product():
    # قراءة البيانات من النموذج (وليس من JSON)
    name = request.form.get('name')
    category = request.form.get('category')
    price = request.form.get('price')
    
    if not name or not category or not price:
        return jsonify({'error': 'الاسم والفئة والسعر مطلوبة'}), 400
    
    # معالجة الصورة المرفوعة
    image_file = request.files.get('image')
    image_path = None
    
    if image_file and allowed_file(image_file.filename):
        original_name = secure_filename(image_file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{original_name}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(filepath)
        image_path = f"/static/images/{filename}"
    else:
        # إذا لم يتم رفع صورة، استخدم صورة افتراضية
        image_path = '/static/images/default.jpg'
    
    conn = get_db()
    conn.execute('INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)',
                 (name, category, price, image_path))
    conn.commit()
    conn.close()
    
    return jsonify({'success': 'تمت إضافة المنتج'}), 201


# ------------------- API حذف المنتج -------------------
@app.route('/api/admin/products/<int:id>', methods=['DELETE'])
@login_required
def delete_product(id):
    conn = get_db()
    conn.execute('DELETE FROM products WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': 'تم حذف المنتج'})

# ------------------- API تعديل المنتج -------------------
@app.route('/api/admin/products/<int:id>', methods=['PUT'])
@login_required
def update_product(id):
    data = request.json
    name = data.get('name')
    category = data.get('category')
    price = data.get('price')
    image = data.get('image')
    
    if not name or not category or not price:
        return jsonify({'error': 'الاسم والفئة والسعر مطلوبة'}), 400
    
    conn = get_db()
    conn.execute('UPDATE products SET name=?, category=?, price=?, image=? WHERE id=?',
                 (name, category, price, image, id))
    conn.commit()
    conn.close()
    return jsonify({'success': 'تم تحديث المنتج'})