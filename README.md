# GamePM — Mobil (Expo + React Native + TypeScript)

Oyun geliştirme stüdyoları için proje yönetim uygulamasının mobil arayüzü. Bir oyun fikrini
yapay zekâ ile 7 aşamalı yol haritasına dönüştürür; projeleri, görevleri, ekip üyelerini ve
hata/öneri raporlarını yönetir.

NestJS backend ile konuşur (bkz. `../backend`). Açık + koyu tema, yumuşak "baloncuk" tasarım.

## Teknolojiler

- **Expo SDK 56** (managed) + **expo-router** (dosya tabanlı navigasyon)
- **TanStack Query** (veri çekme/cache), **Zustand** (auth state), **axios** (refresh interceptor'lı)
- **AsyncStorage** (token saklama), **react-native-reanimated** (animasyonlar), **expo-haptics**
- **Outfit** fontu, **lucide-react-native** ikonlar

---

## 1. Gerekli kurulumlar

1. **Node.js LTS (18+)** ve **npm**. (Expo CLI'yi ayrıca kurmaya gerek yok — `npx expo` kullanılır.)
2. **Android Studio** + Android SDK + en az bir **emülatör (AVD)** oluşturulmuş olmalı
   (örn. Pixel 6, güncel bir Android sürümü).
3. Ortam değişkenleri ayarlı olsun:
   - `ANDROID_HOME` → Android SDK yolu
     (Windows: genelde `C:\Users\<kullanıcı>\AppData\Local\Android\Sdk`)
   - `platform-tools` PATH'te olsun (`adb` komutu çalışmalı: `adb --version`)

## 2. Projeyi kur

```bash
cd fronted
npm install
```

> Not: Proje `.npmrc` içinde `legacy-peer-deps=true` kullanır (Expo SDK 56 + npm peer
> dependency uyumu için). Ek bir şey yapmanıza gerek yok.

## 3. `.env` dosyasını oluştur

`.env.example`'ı `.env` olarak kopyalayıp `EXPO_PUBLIC_API_BASE_URL`'i ayarlayın:

```bash
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
```

**Backend adresi — en kritik nokta:**

| Senaryo | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| Android emülatörü + **lokal** backend | `http://10.0.2.2:3000` |
| Fiziksel cihaz (Expo Go) + lokal backend | `http://<bilgisayar-LAN-IP>:3000` (örn. `http://192.168.1.42:3000`) |
| Uzak (Render vb.) backend | `https://<adres>` (örn. `https://gamepm.onrender.com`) |

> ⚠️ Android emülatöründe `localhost`, **emülatörün kendisini** işaret eder — bilgisayarınızı
> değil. Lokal backend'e ulaşmak için **`10.0.2.2`** kullanın. `localhost` yazarsanız istekler
> başarısız olur (en sık yapılan hata).
>
> `EXPO_PUBLIC_` ile başlayan değişkenler istemciye gömülür ve herkese açıktır — içine
> **asla gizli anahtar koymayın** (Gemini anahtarı yalnızca backend'de durur).

## 4. Emülatörde çalıştır

1. Android Studio → **Device Manager** → emülatörü (AVD) başlat.
2. Backend'i ayağa kaldır (`../backend` → `npm run start:dev`).
3. Bu klasörde:

```bash
npx expo start
```

4. Açılan terminalde **`a`** tuşuna basın → uygulama Android emülatöründe açılır.
   (Expo, gerekirse Expo Go'yu emülatöre otomatik kurar.)

Alternatif (geliştirme derlemesi):

```bash
npx expo run:android
```

## 5. APK (gerçek cihaz / paylaşım)

[EAS Build](https://docs.expo.dev/build/introduction/) ile:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Tamamlanınca EAS, indirilebilir bir **.apk** bağlantısı verir.

---

## Proje yapısı

```
app/                      # expo-router route ağacı
  _layout.tsx             # Provider'lar + font + auth gate
  (auth)/                 # login, register
  (tabs)/                 # Projeler · Görevlerim · Raporlar · Profil
  games/new.tsx           # Yeni proje (oyun fikri girişi)
  games/roadmap.tsx       # AI yol haritası önizleme
  games/[id]/index.tsx    # Pano (aşamalar + görevler)
  games/[id]/members.tsx  # Üyeler
  tasks/[id].tsx          # Görev detayı (modal)
  about.tsx               # NYSA + nysa.tr
components/ui/            # Tasarım sistemi bileşenleri
constants/theme.ts        # Açık/koyu palet + useTheme
lib/                      # api, store, services, types, labels
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npx expo start` | Geliştirme sunucusu (sonra `a` → Android) |
| `npm run lint` | TypeScript tip kontrolü (`tsc --noEmit`) |
| `npx expo export -p android` | JS paketini derleyip doğrula |
