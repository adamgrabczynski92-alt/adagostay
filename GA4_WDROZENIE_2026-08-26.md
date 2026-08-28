# Google Analytics 4 — wdrożenie 2026-08-26

## Konfiguracja

- Konto: Adago Stay
- Usługa: Adago Stay – adagostay.pl
- Strumień: Adago Stay – strona WWW
- Identyfikator pomiaru: `G-CR12PM6B8M`

## Co wdrożono

- Google Analytics uruchamia się dopiero po zgodzie użytkownika.
- Odmowa nie ładuje skryptu Google Analytics i nie ogranicza działania strony.
- Użytkownik może ponownie otworzyć wybór przez przycisk „Ustawienia cookies” w stopce.
- Polityka cookies i polityka prywatności zostały uzupełnione w wersjach PL, EN, DE, CZ i UA.
- Zaktualizowano Content Security Policy dla połączeń z Google Analytics.

## Zdarzenia

- `booking_start` — kliknięcie prowadzące do modułu IdoBooking lub zewnętrznego systemu rezerwacji,
- `form_submit` — poprawne wysłanie formularza,
- `click_whatsapp` — kliknięcie WhatsApp,
- `click_phone` — kliknięcie numeru telefonu,
- `click_email` — kliknięcie adresu e-mail,
- `view_apartment` — wyświetlenie podstrony apartamentu.

## Ograniczenie IdoBooking

Paczka mierzy rozpoczęcie ścieżki rezerwacji. Zakończona i opłacona rezerwacja wewnątrz zewnętrznego iframe IdoBooking wymaga integracji lub zdarzenia udostępnionego przez IdoBooking. Nie jest oznaczana jako konwersja bez wiarygodnego potwierdzenia.

## Po publikacji

1. Otworzyć stronę w nowym oknie prywatnym.
2. Odrzucić analitykę i sprawdzić, że strona oraz rezerwacja nadal działają.
3. Wyczyścić dane witryny albo otworzyć kolejne okno prywatne, zaakceptować analitykę i wykonać kliknięcia testowe.
4. W Google Analytics sprawdzić raport „Czas rzeczywisty”; pojawienie się danych może potrwać kilka minut.

