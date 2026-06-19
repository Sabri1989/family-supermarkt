import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'supermarket.db')

def init_db():
    """إنشاء قاعدة البيانات والجداول إذا لم تكن موجودة"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # جدول المنتجات
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT
        )
    ''')
    
    # جدول العروض الخاصة
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            discount INTEGER NOT NULL,
            image TEXT
        )
    ''')
    
    # جدول رسائل الاتصال
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')


    # جدول المشرف (admin)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # إضافة مستخدم admin افتراضي إذا كان الجدول فارغاً
    cursor.execute("SELECT COUNT(*) FROM admin")
    if cursor.fetchone()[0] == 0:
        from werkzeug.security import generate_password_hash
        hashed_pw = generate_password_hash('admin123')
        cursor.execute("INSERT INTO admin (username, password) VALUES (?, ?)", ('admin', hashed_pw))
        print("✅ تم إنشاء مستخدم admin افتراضي (username: admin, password: admin123)")



    
    # إضافة بعض المنتجات التجريبية إذا كان الجدول فارغاً
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        sample_products = [
            ('جبنة حلوم', 'dairy', 28, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500'),
            ('بيض بلدي', 'dairy', 18, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500'),
            ('خبز طازج', 'bakery', 12, 'https://images.unsplash.com/photo-1509440159596-0249085222b9?w=500'),
            ('زيت زيتون بكر', 'oils', 45, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500'),
        ]
        cursor.executemany("INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)", sample_products)
    
    # إضافة عروض تجريبية
    cursor.execute("SELECT COUNT(*) FROM offers")
    if cursor.fetchone()[0] == 0:
        sample_offers = [
            ('جبنة حلوم', 28, 20, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400'),
            ('زيت زيتون بكر', 45, 25, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
        ]
        cursor.executemany("INSERT INTO offers (name, price, discount, image) VALUES (?, ?, ?, ?)", sample_offers)
    
    conn.commit()
    conn.close()
    print("✅ قاعدة البيانات تم إنشاؤها بنجاح!")

if __name__ == "__main__":
    init_db()