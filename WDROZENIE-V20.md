# Adago Stay V20 — wdrożenie i pomiar rezerwacji

## 1. Wgranie strony

Wgraj zawartość paczki V20 tak samo jak poprzednią wersję strony. Po wdrożeniu wyczyść pamięć podręczną Cloudflare, aby nowe pliki CSS i JavaScript były widoczne od razu.

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

## 4. Co zostało dodane w V20

- link do Facebooka w stopkach, kontaktach i danych strukturalnych,
- pomiar kliknięć Facebooka bez osadzania ciężkiego feedu,
- lokalizowane, gotowe wiadomości WhatsApp,
- informacje o IdoBooking w politykach prywatności i cookies,
- dostępne komunikaty formularzy i przycisk pauzy opinii,
- wybór apartamentu w szybkim formularzu,
- bezpośrednie przekazanie Oazy, Antracytu lub Gold do kalendarza,
- przygotowanie pomiaru między adagostay.pl a IdoBooking.
- zoptymalizowana instrukcja obsługi klamki używana w automatycznych wiadomościach przed przyjazdem.

Po wdrożeniu sprawdź, czy działa adres:

`https://adagostay.pl/assets/img/instrukcja-obslugi-klamki.jpg`

Grafika jest osadzana w wiadomości e-mail, dlatego ten adres musi być dostępny publicznie przed włączeniem automatycznej wysyłki w IdoBooking.
