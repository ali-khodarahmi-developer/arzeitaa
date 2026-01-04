from flask import Flask, render_template, jsonify
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
import pytz
import time

app = Flask(__name__)

TEHRAN_TZ = pytz.timezone('Asia/Tehran')
CACHE_DURATION = 30
last_fetch_time = 0
cached_data = None

def crawl_price(url, price_selector):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        price_elem = soup.select_one(price_selector)
        price = price_elem.text.strip() if price_elem else '0'
        
        price = re.sub(r'[^\d]', '', price)
        
        return int(price) if price else 0
    except Exception as e:
        print(f"خطا در کراول {url}: {e}")
        return 0

def convert_rial_to_toman(rial_price):
    return rial_price // 10

def get_all_prices():
    global last_fetch_time, cached_data
    
    current_time = time.time()
    if cached_data and (current_time - last_fetch_time) < CACHE_DURATION:
        return cached_data
    
    data = {
        'gold': {
            '24k': crawl_price('https://www.tgju.org/profile/geram24', '[data-col="info.last_trade.PDrCotVal"]'),
            '18k_750': crawl_price('https://www.tgju.org/profile/geram18', '[data-col="info.last_trade.PDrCotVal"]'),
            '18k_740': crawl_price('https://www.tgju.org/profile/gold_740k', '[data-col="info.last_trade.PDrCotVal"]'),
            'used_gold': crawl_price('https://www.tgju.org/profile/gold_mini_size', '[data-col="info.last_trade.PDrCotVal"]')
        },
        'coins': {
            'bahar_azadi': crawl_price('https://www.tgju.org/profile/sekeb', '[data-col="info.last_trade.PDrCotVal"]'),
            'emami': crawl_price('https://www.tgju.org/profile/sekee', '[data-col="info.last_trade.PDrCotVal"]'),
            'nim': crawl_price('https://www.tgju.org/profile/nim', '[data-col="info.last_trade.PDrCotVal"]'),
            'rob': crawl_price('https://www.tgju.org/profile/rob', '[data-col="info.last_trade.PDrCotVal"]'),
            'grami': crawl_price('https://www.tgju.org/profile/gerami', '[data-col="info.last_trade.PDrCotVal"]')
        },
        'currency': {
            'dollar': crawl_price('https://www.tgju.org/profile/price_dollar_rl', '[data-col="info.last_trade.PDrCotVal"]'),
            'gbp': crawl_price('https://www.tgju.org/profile/price_gbp', '[data-col="info.last_trade.PDrCotVal"]')
        },
        'last_update': datetime.now(TEHRAN_TZ).strftime('%H:%M:%S')
    }
    
    for category in data.values():
        if isinstance(category, dict):
            for key in category:
                if isinstance(category[key], int):
                    category[key] = convert_rial_to_toman(category[key])
    
    cached_data = data
    last_fetch_time = current_time
    
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/prices')
def api_prices():
    return jsonify(get_all_prices())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
