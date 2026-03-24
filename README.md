# 🏋️ FitMeet — AI Personal Fitness Coach Platform

> Yapay Zeka destekli kişisel fitness koçu. Claude AI ile kişiselleştirilmiş antrenman ve beslenme programları.

---

## 🚀 Hızlı Başlangıç (5 Dakikada Çalıştır)

### Gereksinimler
- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **Anthropic API Key** → [console.anthropic.com](https://console.anthropic.com)

### 1. Kurulum

```bash
# Dosyaları bir klasöre çıkart, sonra:
cd fitmeet
npm install
```

### 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
PORT=3000
JWT_SECRET=buraya_cok_uzun_ve_karmasik_bir_sifre_yaz_min32karakter
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxx
NODE_ENV=production
```

### 3. Başlat

```bash
npm start
```

Tarayıcıda aç: **http://localhost:3000**

---

## 📁 Proje Yapısı

```
fitmeet/
├── server.js                    # Ana Express sunucusu
├── package.json
├── .env.example                 # Ortam değişkenleri şablonu
├── fitmeet.db                   # SQLite veritabanı (otomatik oluşur)
│
├── backend/
│   ├── db/
│   │   └── schema.js            # Veritabanı şeması + başlangıç verileri
│   ├── middleware/
│   │   └── auth.js              # JWT kimlik doğrulama
│   └── routes/
│       ├── auth.js              # Giriş / Kayıt / Dil API
│       ├── profile.js           # Profil, kilo, istatistik API
│       ├── ai.js                # Claude AI program + sohbet API
│       ├── logs.js              # Antrenman / öğün loglama
│       └── friends.js           # Arkadaş sistemi
│
└── public/                      # Frontend (statik dosyalar)
    ├── index.html               # SPA ana shell
    ├── css/
    │   ├── main.css             # Tasarım sistemi + layout
    │   ├── components.css       # UI bileşenleri
    │   └── pages.css            # Sayfa stilleri
    ├── js/
    │   ├── api.js               # Backend API istemcisi
    │   ├── i18n.js              # TR/EN çeviri sistemi
    │   ├── auth.js              # Giriş/kayıt
    │   ├── onboarding.js        # 5 adımlı kurulum sihirbazı
    │   ├── app.js               # Router + global yardımcılar
    │   └── pages/
    │       ├── dashboard.js     # Ana sayfa
    │       ├── today.js         # Günlük antrenman + beslenme
    │       ├── program.js       # Haftalık program görünümü
    │       ├── nutrition.js     # Beslenme planı + makrolar
    │       ├── progress.js      # Kilo takibi + grafikler
    │       ├── achievements.js  # Rozet sistemi
    │       ├── friends.js       # Arkadaşlar + liderlik tablosu
    │       ├── coach.js         # AI sohbet koçu
    │       └── settings.js      # Kullanıcı ayarları
    └── images/
        └── favicon.svg
```

---

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🔐 **Üyelik Sistemi** | Email/şifre, JWT token, 30 günlük oturum |
| 🧙 **Onboarding Wizard** | 5 adımlı kişiselleştirme sihirbazı |
| 🤖 **AI Program** | Claude API ile kişisel antrenman + beslenme programı |
| 📅 **Günlük Takip** | Egzersiz + öğün işaretleme |
| ⚖️ **Kilo Takibi** | Haftalık kilo girişi + grafik |
| 🏆 **Rozet Sistemi** | 8 farklı başarı rozeti |
| 👥 **Sosyal** | Arkadaş ekleme + aylık liderlik tablosu |
| 💬 **AI Koç** | Gerçek zamanlı sohbet (Claude API) |
| 🌍 **Çoklu Dil** | Türkçe + İngilizce |
| 📱 **Responsive** | Mobil + Tablet + Desktop |

---

## 🌐 Hosting'e Yükleme

### VPS / Linux Sunucu (Önerilen)

```bash
# Node.js kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 ile arka planda çalıştır
npm install -g pm2
pm2 start server.js --name fitmeet
pm2 startup
pm2 save

# Nginx ile reverse proxy (opsiyonel)
# /etc/nginx/sites-available/fitmeet:
# server {
#   listen 80;
#   server_name fitmeet.com www.fitmeet.com;
#   location / { proxy_pass http://localhost:3000; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade'; proxy_set_header Host $host; }
# }
```

### Railway.app (Kolay)

1. [railway.app](https://railway.app)'a git
2. "New Project" → "Deploy from GitHub"
3. Environment Variables ekle: `JWT_SECRET`, `ANTHROPIC_API_KEY`
4. Deploy!

### Render.com (Ücretsiz Tier)

1. [render.com](https://render.com)'a git
2. New → Web Service → GitHub repo
3. Build: `npm install`, Start: `npm start`
4. Environment variables ekle

### Heroku

```bash
heroku create fitmeet-app
heroku config:set JWT_SECRET=xxx ANTHROPIC_API_KEY=sk-ant-xxx
git push heroku main
```

---

## 🔒 Güvenlik

- Şifreler `bcryptjs` ile hash'leniyor (12 round)
- JWT token 30 gün geçerli
- SQLite WAL mode aktif
- CORS etkin
- **Production'da:** `.env` dosyasını asla commit etme!

---

## 🎨 Tasarım Sistemi

| Renk | Değer | Kullanım |
|------|-------|---------|
| Accent | `#c8ff00` | Ana vurgu rengi |
| Background | `#0a0a0c` | Ana arka plan |
| Card | `#141419` | Kart arka planı |
| Text | `#f0f0f5` | Ana metin |

**Fontlar:**
- Display: `Bebas Neue`
- Body: `DM Sans`
- Mono: `JetBrains Mono`

---

## 🛠 API Endpoints

```
POST   /api/auth/register         Kayıt
POST   /api/auth/login            Giriş
GET    /api/auth/me               Mevcut kullanıcı

POST   /api/profile/onboarding    Onboarding kaydet
GET    /api/profile               Profil getir
PUT    /api/profile               Profil güncelle
POST   /api/profile/weight        Kilo kaydet
GET    /api/profile/weight        Kilo geçmişi
GET    /api/profile/stats         İstatistikler

POST   /api/ai/generate-program   AI program oluştur
GET    /api/ai/program            Aktif programı getir
POST   /api/ai/chat               AI sohbet

POST   /api/logs/workout          Antrenman kaydet
POST   /api/logs/meal             Öğün kaydet
GET    /api/logs/today            Bugünün logları
GET    /api/logs/week             Haftalık loglar
GET    /api/logs/achievements     Başarılar

GET    /api/friends               Arkadaş listesi
POST   /api/friends/add           Arkadaş ekle
PUT    /api/friends/respond       İsteği kabul/reddet
GET    /api/friends/leaderboard   Liderlik tablosu
```

---

## 📝 Lisans

MIT License — Özgürce kullanabilir ve değiştirebilirsin.

---

**FitMeet** — *Hedefine ulaş, limitlerini aş.* 🏋️
