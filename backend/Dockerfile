FROM python:3.11-slim

# 安裝系統依賴（psycopg2 需要）
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
ENV PYTHONUNBUFFERED=1
# 環境變數用 .env 注入
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
