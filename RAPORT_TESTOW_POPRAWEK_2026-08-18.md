# Raport testów poprawek Adago Stay

Data kontroli: 18 sierpnia 2026 r.

## Zakres wdrożenia

- naprawa galerii, formularzy, dostępności, SEO technicznego, prywatności, bezpieczeństwa i wydajności;
- nowa komercyjna strona `/pl/dla-firm/` dla pobytów służbowych i pracowniczych;
- argumenty rezerwacji bezpośredniej i dowody z opinii przy CTA na 15 stronach apartamentów;
- CTA „Sprawdź cenę i dostępność” oraz odpowiedniki EN/DE/CZ/UA;
- niemiecki klaster: Bad Salzbrunn, Ferienwohnung Wałbrzych, Niederschlesien, Schloss Fürstenstein;
- czeski klaster: ubytování Wałbrzych, Szczawno-Zdrój, Dolní Slezsko, zámek Książ;
- opcjonalne odpłatne pranie i suszenie ubrań oraz dodatkowe ręczniki, z ceną i terminem potwierdzanymi przed realizacją;
- 71 przekierowań starych ścieżek oraz przekierowanie `www` przygotowane dla Cloudflare (w tym 6 historycznych adresów wykrytych w Google Search Console).

## Wynik testów statycznych

| Kontrola | Wynik |
|---|---:|
| Dokumenty HTML | 135 |
| Odwołania wewnętrzne | 3 806 |
| Brakujące pliki lub strony | 0 |
| Błędne kotwice | 0 |
| Błędy parsera HTML | 0 |
| Błędy hreflang | 0 |
| Duplikaty title | 0 |
| Duplikaty description | 0 |
| Brakujące elementy SEO | 0 |
| Błędy hierarchii nagłówków | 0 |
| Zduplikowane identyfikatory | 0 |
| Brakujące teksty alternatywne | 0 |
| Brakujące wymiary obrazów | 0 |
| Błędy formularzy w kontroli statycznej | 0 |
| Duże obrazy przekraczające próg audytu | 0 |
| Bloki JSON-LD | 104 |
| Błędy składni JSON-LD | 0 |
| Strony indeksowalne | 102 |
| Adresy w sitemap.xml | 102 |

Jedyny celowy wyjątek w raporcie canonical dotyczy strony `404.html`: ma `noindex` i nie ma adresu kanonicznego.

## HTML, JavaScript i komponenty

- Kluczowe, zmienione szablony sprawdzono usługą W3C Nu Validator: strona główna, nowa strona dla firm, strony DE/CZ, polskie i zagraniczne karty apartamentów, lokalny landing SEO oraz polityka prywatności. Wynik: 0 błędów HTML.
- Ostrzeżenia walidatora dotyczą polityki CSP podczas wysyłania pojedynczego pliku bez kontekstu domeny; zasoby względne z `self` działają w docelowej domenie.
- `site.js`, `adago-gallery.js` oraz `privacy-embeds.js` przeszły kontrolę składni `node --check`.
- Wszystkie 15 galerii korzysta z jednego komponentu; stary markup galerii nie występuje.
- Wszystkie 15 stron apartamentów zawiera blok rezerwacji bezpośredniej i opinii przy CTA.
- Wszystkie 15 stron apartamentów oraz pięć wersji FAQ i warunków rezerwacji zawiera transparentną informację o płatnych usługach dodatkowych.
- Pięć map Google ma tryb click-to-load; przed kliknięciem w HTML nie ma iframe Google.

## Przekierowania i konfiguracja platformy

- `_redirects`: 65 reguł ścieżek ze statusem 301, bez błędnych statusów.
- `CLOUDFLARE_REDIRECTS.csv`: 72 rekordy i po 7 wymaganych kolumn; pierwszy rekord obsługuje `www`, pozostałe stare adresy.
- Dodatkowa korekta kontrastu tekstów zgód formularza, linków polityki prywatności, etykiet opinii i ocen po teście PageSpeed (wynik przed korektą: dostępność 97/100).
- `_headers`: przygotowane CSP, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` i blokowanie osadzania.
- GitHub Pages nie aktywuje `_redirects`, `_headers` ani `.htaccess`; przekierowania i nagłówki trzeba włączyć w Cloudflare według `WDROZENIE_GITHUB_DESKTOP.md`.

## Wydajność

- Usunięto z poprawionej kopii 23 nieużywane pliki JPG; oryginalny ZIP pozostał bez zmian.
- Obrazy galerii używają WebP, a obrazy poza pierwszym ekranem mają lazy loading i asynchroniczne dekodowanie.
- Rozmiar nieskompresowanej strony po zmianach: około 5,4 MB.
- CSS i główne skrypty mają parametr wersji `20260818-1` do odświeżenia cache.

## Kontrole wymagane po publikacji

1. Wykonać jeden kontrolowany test formularza i sprawdzić dostarczenie wiadomości do `adagostay@gmail.com`.
2. Zweryfikować na żywo kody 301 po imporcie listy Cloudflare oraz prawdziwy status 404 dla `/room-service/`.
3. Sprawdzić nagłówki odpowiedzi po ustawieniu reguł Cloudflare.
4. Przejrzeć stronę na telefonie i komputerze oraz otworzyć galerie klawiaturą i dotykiem.
5. Zlecić native speakerowi końcową korektę DE/CZ/UA i prawnikowi akceptację treści prawnych.
6. Po wdrożeniu ponownie przesłać `https://adagostay.pl/sitemap.xml` w Google Search Console.

Formularz nie został wysłany podczas testów, aby nie generować prawdziwego zgłoszenia.
