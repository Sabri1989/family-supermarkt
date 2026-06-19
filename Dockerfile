FROM python:3.10-slim

WORKDIR /app

# نسخ جميع الملفات
COPY . .

# تثبيت المكتبات الأساسية مباشرة (بدون requirements.txt)
RUN pip install --no-cache-dir Flask flask-cors flask-login werkzeug gunicorn pillow

# تعريض المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:5000", "app:app"]