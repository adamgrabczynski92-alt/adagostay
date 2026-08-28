# Wdrożenie przez GitHub Desktop + GitHub Pages

Paczka jest przygotowana do skopiowania do katalogu głównego repozytorium publikowanego przez GitHub Pages.

## 1. Wgranie strony

1. W GitHub Desktop wybierz repozytorium strony.
2. Zrób kopię repozytorium albo utwórz osobną gałąź bezpieczeństwa.
3. Skopiuj **zawartość tej paczki**, a nie nadrzędny katalog, do katalogu głównego repozytorium.
4. Zachowaj pliki CNAME, .nojekyll oraz pliki zaczynające się od kropki.
5. W GitHub Desktop sprawdź listę zmian, wykonaj commit, np. „Audyt i poprawki strony 2026-08-18”, a następnie Push origin.
6. Poczekaj na zakończenie publikacji w Settings → Pages.

GitHub Pages ignoruje pliki .htaccess, _headers, _redirects i nginx-redirects.conf. Pozostają one w paczce jako konfiguracje dla innych platform, ale nie naprawiają odpowiedzi HTTP na GitHub Pages.

## 2. Prawdziwe przekierowania 301 w Cloudflare

Do paczki dołączono plik **CLOUDFLARE_REDIRECTS.csv** bez wiersza nagłówkowego, zgodny z importem Cloudflare Bulk Redirects.

1. Zaloguj się do Cloudflare.
2. Otwórz Bulk Redirects / Redirect Lists.
3. Utwórz listę, np. adago_stay_redirects.
4. Zaimportuj CLOUDFLARE_REDIRECTS.csv.
5. Utwórz i włącz regułę Bulk Redirect używającą tej listy.
6. Pierwszy wpis przekierowuje www na domenę bez www razem z całą ścieżką.
7. Kolejne 65 wpisów obsługuje stare adresy SEO.

Po aktywacji stare strony HTML pozostają zabezpieczeniem awaryjnym, ale użytkownik i robot powinni dostać 301 jeszcze przed dotarciem do GitHub Pages.

## 3. Nagłówki bezpieczeństwa

GitHub Pages nie czyta pliku _headers. W Cloudflare trzeba jednorazowo ustawić:

- SSL/TLS → Edge Certificates → Always Use HTTPS;
- po potwierdzeniu działania HTTPS: HSTS, max-age 12 miesięcy;
- Rules → Transform Rules → Modify Response Header:
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
  - X-Frame-Options: DENY
  - Content-Security-Policy: wartość z pliku _headers.

Strony zawierają również zapasową politykę CSP w elemencie meta. Nagłówek Cloudflare jest silniejszy i pozwala wymusić frame-ancestors.

## 4. Cache

Pliki CSS i kluczowe skrypty mają nowy parametr wersji 20260818-1. Po wdrożeniu:

1. Cloudflare → Caching → Purge Cache → Purge Everything.
2. Otwórz stronę w oknie prywatnym.
3. Sprawdź wersje PL, EN, DE, CZ i UA.

## 5. Kontrola po wdrożeniu

Sprawdź minimum:

- https://adagostay.pl/
- https://www.adagostay.pl/ — ma zwrócić 301 do domeny bez www;
- https://adagostay.pl/pl/ — ma zwrócić 301 do strony głównej;
- /antracyt/, /gold/ i /oaza/ — mają zwrócić 301 do nowych stron apartamentów;
- wszystkie galerie apartamentów w pięciu językach;
- polski widget IdoBooking: daty, liczba osób, lokalizacja, przejście do Booking Engine;
- formularz kontaktowy na jednym prawdziwym urządzeniu;
- mapę na stronie kontaktowej — przed kliknięciem nie powinien istnieć iframe Google;
- sitemap.xml — zawiera 102 adresy;
- losowy nieistniejący adres — powinien zwrócić 404.

Ścieżka /room-service/ pozostaje prawdziwym 404 i nie jest już blokowana w robots.txt, dzięki czemu robot wyszukiwarki może odczytać status usunięcia.

## 6. Po wdrożeniu

1. W Google Search Console prześlij ponownie https://adagostay.pl/sitemap.xml.
2. Poproś o indeksację najważniejszych stron EN/DE/CZ/UA dopiero po sprawdzeniu treści na produkcji.
3. Po kilku dniach sprawdź raport indeksowania i listę nieznalezionych adresów.
