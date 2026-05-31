import type { PhaseType } from './types';

/**
 * Manuel proje oluştururken kullanılan hazır görev şablonları.
 * Faza göre gruplu; kullanıcı kutucukla seçer, ayrıca kendi görevini de ekleyebilir.
 */
export const TASK_TEMPLATES: Record<PhaseType, string[]> = {
  concept_design: [
    'Oyun konsepti ve hedef kitle',
    'Çekirdek oyun döngüsü tasarımı',
    'Mekanik tasarımı (GDD)',
    'Referans / moodboard araştırması',
    'Hikâye ve dünya taslağı',
  ],
  prototype: [
    'Çekirdek mekanik prototipi',
    'Kontrol şeması',
    'Greybox seviye prototipi',
    'Oynanış doğrulama testi',
    'Kamera ve hareket denemesi',
  ],
  art_visual: [
    'Sanat yönü / stil belirleme',
    'Karakter tasarımları',
    'Çevre ve arka plan görselleri',
    'UI / HUD tasarımı',
    'Animasyon çalışmaları',
  ],
  production: [
    'Seviye / içerik üretimi',
    'Ses ve müzik entegrasyonu',
    'Kayıt ve ilerleme sistemi',
    'Menü ve ayarlar ekranı',
    'Düşman / yapay zekâ davranışları',
  ],
  test_balance: [
    'Oynanış dengeleme',
    'Hata (bug) testleri',
    'Performans optimizasyonu',
    'Oyuncu geri bildirimi (playtest)',
  ],
  polish: [
    'Görsel efektler ve geçişler',
    'Ses cilası',
    'UX iyileştirmeleri',
    'Son hata düzeltmeleri',
  ],
  release: [
    'Mağaza sayfası ve görseller',
    'Sürüm derleme (build)',
    'Tanıtım ve pazarlama',
    'Yayın sonrası takip planı',
  ],
};

export const TEMPLATE_PHASE_ORDER: PhaseType[] = [
  'concept_design',
  'prototype',
  'art_visual',
  'production',
  'test_balance',
  'polish',
  'release',
];
