# Adago Stay V21 — wdrożenie, rezerwacje i SEO

## 1. Wgranie strony

Wgraj całą zawartość paczki V21 do katalogu głównego hostingu, zastępując poprzednią wersję. Plik `index.html` ma znajdować się bezpośrednio w katalogu głównym. Po wdrożeniu wykonaj jednorazowe czyszczenie pamięci podręcznej Cloudflare.

Przed spakowaniem lub wdrożeniem można odtworzyć zminimalizowany arkusz i uruchomić kontrole:

```bash
node scripts/minify-css.mjs
node scripts/validate-site.mjs
node scripts/validate-v21.mjs
```

## 2. Jednorazowe ustawienie IdoBooking dla GA4

Kod strony przekazuje do IdoBooking identyfikator klienta i sesji GA4 oraz przygotowuje śledzenie między domenami. Aby opłacone rezerwacje pojawiały się w tej samej usłudze Google Analytics co adagostay.pl, w panelu IdoBooking ustaw identyfikator:

`G-CR12PM6B8M`

W panelu odszukaj integrację **Google Analytics 4** (sekcja raportów, analiz lub integracji marketingowych), wpisz powyższy identyfikator i zapisz. Nie uruchamiaj równocześnie drugiego śledzenia tych samych zdarzeń przez Google Tag Manager, ponieważ mogłoby to podwajać transakcje.

IdoBooking powinien raportować kolejne etapy lejka oraz finalizację zakupu dopiero po opłaceniu rezerwacji. Strona Adago Stay celowo nie wysyła zdarzenia zakupu po samym kliknięciu przycisku.

## 3. Kontrola po wdrożeniu

1. Otwórz stronę w prywatnym oknie i zaakceptuj analitykę.
2. Wejdź na stronę każdego apartamentu i kliknij „Sprawdź dostępność”.
3. Potwierdź, że na stronie głównej wybrany jest właściwy apartament.
4. Wykonaj jedną testową, opłaconą rezerwację.
5. W Google Analytics sprawdź zdarzenia rezerwacji i brak podwójnej transakcji.

## 4. Co zachowano z V20

- link do Facebooka w stopkach, kontaktach i danych strukturalnych,
- pomiar kliknięć Facebooka bez osadzania ciężkiego feedu,
- lokalizowane, gotowe wiadomości WhatsApp,
- informacje o IdoBooking w politykach prywatności i cookies,
- dostępne komunikaty formularzy i przycisk pauzy opinii,
- wybór apartamentu w szybkim formularzu,
- bezpośrednie przekazanie Oazy, Antracytu lub Gold do kalendarza,
- przygotowanie pomiaru między adagostay.pl a IdoBooking.
- zoptymalizowana instrukcja obsługi klamki używana w automatycznych wiadomościach przed przyjazdem.

## 5. Co poprawiono w V21

- stale widoczny link do pełnej rezerwacji IdoBooking z zachowaniem dat, liczby gości i wybranego apartamentu,
- nadal dostępny osadzony kalendarz oraz bezpieczna alternatywa przy blokadzie cookies zewnętrznych,
- mocniejsza lokalna fraza przy głównym nagłówku we wszystkich pięciu językach,
- krótsza polska strona główna bez powtórzonej sekcji opinii,
- osobne, poprawnie typowane pola e-mail i telefonu w czterech formularzach zapytań,
- usunięta niepotwierdzona deklaracja parkingu Gold z wersji EN, DE, CZ i UA,
- jeden model marki `Organization` i trzy stabilne identyfikatory apartamentów w danych strukturalnych,
- usunięta nieprawidłowa właściwość `provider` z encji `Apartment`,
- zminimalizowany CSS, spójny cache-buster V21 oraz poprawki safe-area i menu mobilnego,
- rozszerzona automatyczna walidacja wdrożenia.

Wartości ocen Google i Booking nie zostały zmienione.

Po wdrożeniu sprawdź, czy działa adres:

`https://adagostay.pl/assets/img/instrukcja-obslugi-klamki.jpg`

Grafika jest osadzana w wiadomości e-mail, dlatego ten adres musi być dostępny publicznie przed włączeniem automatycznej wysyłki w IdoBooking.
