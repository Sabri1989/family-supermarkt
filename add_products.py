import sqlite3
import os

DB_PATH = os.path.join('instance', 'supermarket.db')

products_full = [
    ('جبنة حلوم', 'dairy', 28, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500'),
    ('بيض بلدي', 'dairy', 18, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500'),
    ('خبز طازج', 'bakery', 12, 'https://images.unsplash.com/photo-1509440159596-0249085222b9?w=500'),
    ('كرواسان بالزبدة', 'bakery', 9, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500'),
    ('زيت زيتون بكر', 'oils', 45, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500'),
    ('بهارات مشكلة', 'oils', 22, 'https://images.unsplash.com/photo-1532335692591-13b7fd3522ef?w=500'),
    ('كنافة نابلسية', 'sweets', 32, 'https://images.unsplash.com/photo-1571660716327-67b9a0b49342?w=500'),
    ('بقلاوة', 'sweets', 38, 'https://images.unsplash.com/photo-1571683059739-7eeeff3b5596?w=500'),
    ('عصير رمان', 'beverages', 15, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500'),
    ('تمر فاخر', 'beverages', 26, 'https://images.unsplash.com/photo-1607541107206-6ba9d6f97758?w=500'),
    ('دجاج مجمد', 'frozen', 24, 'https://images.unsplash.com/photo-1587593810167-a84920fde2a6?w=500'),
    ('خضروات مشكلة', 'frozen', 18, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500'),
    ('مثلجات فانيليا', 'icecream', 21, '/static/images/vanilla.jpg.jpg'),
    ('مثلجات شوكولاتة', 'icecream', 24.5, '/static/images/chocolate.jpg.jpeg'),
    ('مثلجات فراولة', 'icecream', 20, '/static/images/strawberry.jpg.jpg'),
    ('مثلجات لوتس', 'icecream', 20.8, '/static/images/lotus.jpg.jpeg'),
    ('مثلجات مانجو', 'icecream', 25.5, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400'),
    ('مثلجات بستاشيو', 'icecream', 30.4, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400')
]

offers_full = [
    ('جبنة حلوم', 28, 20, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400'),
    ('زيت زيتون بكر', 45, 25, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
    ('كنافة نابلسية', 32, 15, 'https://images.unsplash.com/photo-1571660716327-67b9a0b49342?w=400'),
    ('تمر فاخر', 26, 30, 'https://images.unsplash.com/photo-1607541107206-6ba9d6f97758?w=400')
]

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS products")
cursor.execute("DROP TABLE IF EXISTS offers")

cursor.execute('''
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT
    )
''')
cursor.execute('''
    CREATE TABLE offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        discount INTEGER NOT NULL,
        image TEXT
    )
''')

cursor.executemany("INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)", products_full)
cursor.executemany("INSERT INTO offers (name, price, discount, image) VALUES (?, ?, ?, ?)", offers_full)

conn.commit()
conn.close()
print("✅ تم إضافة جميع المنتجات والعروض بنجاح!")