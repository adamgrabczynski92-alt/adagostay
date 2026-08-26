# Pełna rezerwacja IdoBooking na stronie — aktualizacja 2026-08-26

## Co zostało dodane

- pełny Booking Engine IdoBooking osadzony na stronach głównych PL, EN, DE, CZ i UA,
- wybór dat, apartamentu i liczby osób bezpośrednio na stronie Adago Stay,
- podanie danych gości oraz przejście przez kolejne etapy rezerwacji w osadzonym module,
- osobny język modułu dla każdej wersji strony,
- przejście poza stronę dopiero wtedy, gdy wymaga tego operator płatności,
- awaryjny komunikat kontaktowy, gdy moduł IdoBooking nie zostanie załadowany,
- wymagane wyjątki Content Security Policy dla domen IdoBooking.

Moduł zastępuje górny formularz „Szybkie zapytanie”. Na polskiej stronie dotychczasowy formularz kontaktowy pozostaje niżej jako dodatkowy kanał kontaktu. Na wszystkich wersjach językowych pozostają telefon, e-mail i WhatsApp.

## Stan konfiguracji IdoBooking

1. Oaza, Antracyt i Gold są widoczne w Booking Engine.
2. Wszystkie trzy plany cenowe wymagają przedpłaty 100% i są ofertami bezzwrotnymi.
3. Czas na opłacenie oferty bezzwrotnej wynosi 30 minut.
4. BLIK i szybkie przelewy PayByLink są aktywne. Płatności kartą, Apple Pay i Google Pay pozostają niedostępne do czasu zakończenia weryfikacji IdoPay.
5. Pełny Booking Engine korzysta z polskiego, angielskiego, niemieckiego, czeskiego i ukraińskiego. Treści ofert i komunikacji w panelu zostały uzupełnione w tych językach.
6. Jeżeli Content-Security-Policy jest ustawione w Cloudflare, zaktualizuj je wartością z pliku `_headers`. Samo wgranie plików na GitHub Pages nie zmieni nagłówka ustawionego w Cloudflare.

## Kontrola po wdrożeniu

1. Wyczyść pamięć podręczną Cloudflare.
2. Otwórz stronę w oknie prywatnym.
3. Sprawdź wybór dat, apartamentu i liczby osób.
4. Sprawdź kolejno wersje `/`, `/en/`, `/de/`, `/cz/` i `/ua/` oraz poprawność języka modułu.
5. Upewnij się, że widoczne są Oaza, Antracyt i Gold.
6. Przejdź testowo do formularza danych gościa, bez opłacania rezerwacji.
7. Wykonaj test na telefonie.
