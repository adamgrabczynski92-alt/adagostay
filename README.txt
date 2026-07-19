Adago Stay – static multilingual website

How to upload:
1. Unzip all files to your server root/public_html.
2. Make sure the domain points to this folder.
3. The contact form uses FormSubmit.co and sends enquiries to adagostay@gmail.com.
4. If your server has caching enabled, clear it after upload.

Included languages:
PL / EN / DE / CZ / UA

Pages:
- Home
- 3 apartment pages
- Blog index
- 4 blog posts
- Contact page

Nginx deployment:
- Include nginx-redirects.conf inside the main adagostay.pl server block.
- Use nginx-www-redirect.conf as a separate top-level HTTP server block.
- For HTTPS www redirection, add the documented return rule to the existing TLS-enabled www server block.

Important form rule:
- The Antracyt interface and JavaScript restrict enquiries to 1–2 guests.
- Final enforcement against manually forged HTTP requests requires server-side validation; FormSubmit.co does not expose custom server validation in this static package.

