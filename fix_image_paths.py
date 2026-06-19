import sqlite3
import os

DB_PATH = os.path.join('instance', 'supermarket.db')
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# تحديث مسارات الصور في products
cursor.execute("UPDATE products SET image = REPLACE(image, 'images/', '/static/images/') WHERE image LIKE 'images/%'")
cursor.execute("UPDATE products SET image = REPLACE(image, '/images/', '/static/images/') WHERE image LIKE '/images/%'")
cursor.execute("UPDATE products SET image = '/static/images/vanilla.jpg.jpg' WHERE image LIKE '%vanilla%' AND image NOT LIKE '/static/%'")
cursor.execute("UPDATE products SET image = '/static/images/chocolate.jpg.jpeg' WHERE image LIKE '%chocolate%' AND image NOT LIKE '/static/%'")
cursor.execute("UPDATE products SET image = '/static/images/strawberry.jpg.jpg' WHERE image LIKE '%strawberry%' AND image NOT LIKE '/static/%'")
cursor.execute("UPDATE products SET image = '/static/images/lotus.jpg.jpeg' WHERE image LIKE '%lotus%' AND image NOT LIKE '/static/%'")

# نفس الشيء للعروض
cursor.execute("UPDATE offers SET image = REPLACE(image, 'images/', '/static/images/') WHERE image LIKE 'images/%'")
cursor.execute("UPDATE offers SET image = REPLACE(image, '/images/', '/static/images/') WHERE image LIKE '/images/%'")

conn.commit()
conn.close()
print("✅ تم تحديث مسارات الصور في قاعدة البيانات.")