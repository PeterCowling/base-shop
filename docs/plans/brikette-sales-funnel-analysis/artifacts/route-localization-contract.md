# Route Localization Contract

- Generated: `2026-03-07T07:33:44.322Z`
- Supported locales: `18`
- Public route families audited: `6`
- Unexpected English-slug matches outside allowlist: `0`

## Sources
- `apps/brikette/src/slug-map.ts`
- `apps/brikette/src/routing/sectionSegments.ts`
- `apps/brikette/src/routing/routeInventory.ts`
- `apps/brikette/src/middleware.ts`
- `packages/ui/src/config/roomSlugs.ts`
- `apps/brikette/src/guides/slugs/slugs.ts`
- `apps/brikette/src/data/guides.index.ts`

## Public Route Families
- `/{lang}`
- `/{lang}/{topLevelSlug}`
- `/{lang}/{privateBookingSlug}`
- `/{lang}/{roomsSlug}/{roomSlug}`
- `/{lang}/{guideNamespaceSlug}/{guideSlug}`
- `/{lang}/{experiencesSlug}/{guidesTagsSlug}/{tag}`

## Approved Shared-Spelling Allowlist
- `fr` `experiences` -> `experiences` (/fr/experiences)
- `fr` `guides` -> `guides` (/fr/guides)

## Top-Level Route Slug Matrix
- `en`: rooms: dorms, deals: deals, careers: careers, about: about, assistance: help, experiences: experiences, howToGetHere: how-to-get-here, apartment: private-rooms, privateBooking: book-private-accommodations, book: book-dorm-bed, guides: guides, terms: terms, houseRules: house-rules, privacyPolicy: privacy-policy, cookiePolicy: cookie-policy, breakfastMenu: breakfast-menu, barMenu: bar-menu
- `es`: rooms: habitaciones, deals: ofertas, careers: empleos, about: sobre-nosotros, assistance: ayuda, experiences: experiencias, howToGetHere: como-llegar, apartment: habitaciones-privadas, privateBooking: reservar-alojamientos-privados, book: reservar, guides: guias, terms: terminos-condiciones, houseRules: normas-de-la-casa, privacyPolicy: politica-de-privacidad, cookiePolicy: politica-de-cookies, breakfastMenu: menu-desayuno, barMenu: carta-bebidas
- `de`: rooms: zimmer, deals: angebote, careers: karriere, about: ueber-uns, assistance: hilfe, experiences: erlebnisse, howToGetHere: anfahrt, apartment: privatzimmer, privateBooking: privatunterkunft-buchen, book: buchen, guides: reisefuehrer, terms: bedingungen, houseRules: hausordnung, privacyPolicy: datenschutz, cookiePolicy: cookie-richtlinie, breakfastMenu: fruehstuecksmenue, barMenu: bar-speisekarte
- `fr`: rooms: chambres, deals: offres, careers: carrieres, about: a-propos, assistance: aide, experiences: experiences, howToGetHere: comment-venir, apartment: chambres-privees, privateBooking: reserver-hebergements-prives, book: reserver, guides: guides, terms: conditions-generales, houseRules: reglement-interieur, privacyPolicy: politique-confidentialite, cookiePolicy: politique-cookies, breakfastMenu: menu-petit-dejeuner, barMenu: carte-boissons
- `it`: rooms: camere, deals: offerte, careers: carriere, about: chi-siamo, assistance: assistenza, experiences: esperienze, howToGetHere: come-arrivare, apartment: camere-private, privateBooking: prenota-alloggi-privati, book: prenota, guides: guide, terms: termini-condizioni, houseRules: regole-della-casa, privacyPolicy: informativa-privacy, cookiePolicy: politica-cookie, breakfastMenu: menu-colazione, barMenu: menu-bevande
- `ja`: rooms: heya, deals: otoku, careers: kyaria, about: annai, assistance: sapoto, experiences: taiken, howToGetHere: akusesu, apartment: kojin-heya, privateBooking: kojin-heya-yoyaku, book: yoyaku, guides: gaido, terms: riyokiyaku, houseRules: riyou-ruuru, privacyPolicy: kojin-joho-hoshin, cookiePolicy: kukki-seisaku, breakfastMenu: choshoku-menu, barMenu: ba-menyu
- `ko`: rooms: bang, deals: teukga, careers: chaeyong, about: sogae, assistance: jiwon, experiences: cheheom, howToGetHere: osineun-gil, apartment: gaein-sil, privateBooking: gaein-sil-yeyak, book: yeyak, guides: gaideu, terms: yagwan, houseRules: iyong-gyuchik, privacyPolicy: gaein-jeongbo-bangchim, cookiePolicy: kuki-jeongchaek, breakfastMenu: achim-menu, barMenu: jujeom-menyu
- `pt`: rooms: quartos, deals: ofertas, careers: carreiras, about: sobre-nos, assistance: ajuda, experiences: experiencias, howToGetHere: como-chegar, apartment: quartos-privados, privateBooking: reservar-acomodacoes-privadas, book: reservar, guides: guias, terms: termos-condicoes, houseRules: regras-da-casa, privacyPolicy: politica-de-privacidade, cookiePolicy: politica-de-cookies, breakfastMenu: menu-cafe-da-manha, barMenu: cardapio-bar
- `ru`: rooms: komnaty, deals: skidki, careers: karera, about: o-nas, assistance: pomoshch, experiences: vpechatleniya, howToGetHere: kak-dobratsya, apartment: chastnye-nomera, privateBooking: bronirovat-chastnoe-prozhivanie, book: bronirovanie, guides: gidy, terms: pravila-usloviya, houseRules: pravila-prozhivaniya, privacyPolicy: politika-konfidentsialnosti, cookiePolicy: politika-cookie, breakfastMenu: menyu-zavtrak, barMenu: menu-bara
- `zh`: rooms: fangjian, deals: tejia, careers: zhaopin, about: guanyu, assistance: bangzhu, experiences: tiyan, howToGetHere: ruhe-daoda, apartment: siren-kefang, privateBooking: yuding-siren-zhusu, book: yuding, guides: zhinan, terms: tiaokuan, houseRules: jiagui, privacyPolicy: yinsi-zhengce, cookiePolicy: quqi-zhengce, breakfastMenu: zaocan-caidan, barMenu: jiuba-caidan
- `ar`: rooms: ghuraf, deals: urood, careers: wazayif, about: man-nahnu, assistance: musaada, experiences: tajarib, howToGetHere: kayfa-tasil, apartment: ghuraf-khassa, privateBooking: hajz-iqama-khassa, book: hajz, guides: dalail, terms: shorout, houseRules: qawaid-albayt, privacyPolicy: siasat-al-khususiya, cookiePolicy: siasat-al-cookie, breakfastMenu: qaimat-futur, barMenu: qaimat-bar
- `hi`: rooms: kamare, deals: prastav, careers: naukri, about: hamare-bare-mein, assistance: sahayata, experiences: anubhav, howToGetHere: kaise-pahunchen, apartment: niji-kamre, privateBooking: niji-aavaas-aarakshan, book: aarakshan, guides: margdarshika, terms: niyam-sharten, houseRules: ghar-ke-niyam, privacyPolicy: gopaniyata-niti, cookiePolicy: cookie-niti, breakfastMenu: nashta-menu, barMenu: peene-ka-menu
- `vi`: rooms: phong, deals: uu-dai, careers: tuyen-dung, about: ve-chung-toi, assistance: tro-giup, experiences: trai-nghiem, howToGetHere: cach-den-day, apartment: phong-rieng, privateBooking: dat-cho-o-rieng-tu, book: dat-phong, guides: huong-dan, terms: dieu-khoan, houseRules: noi-quy-nha, privacyPolicy: chinh-sach-bao-mat, cookiePolicy: chinh-sach-cookie, breakfastMenu: thuc-don-bua-sang, barMenu: thuc-don-quay-bar
- `pl`: rooms: pokoje, deals: promocje, careers: praca, about: o-nas, assistance: pomoc, experiences: doswiadczenia, howToGetHere: jak-dojechac, apartment: pokoje-prywatne, privateBooking: rezerwuj-prywatny-pobyt, book: rezerwuj, guides: przewodniki, terms: regulamin, houseRules: zasady-domu, privacyPolicy: polityka-prywatnosci, cookiePolicy: polityka-cookie, breakfastMenu: menu-sniadaniowe, barMenu: menu-barowe
- `sv`: rooms: rum, deals: erbjudanden, careers: karriar, about: om-oss, assistance: hjalp, experiences: upplevelser, howToGetHere: hitta-hit, apartment: privata-rum, privateBooking: boka-privat-boende, book: boka, guides: guider, terms: villkor, houseRules: husregler, privacyPolicy: integritetspolicy, cookiePolicy: cookiepolicy, breakfastMenu: frukostmeny, barMenu: barmeny
- `no`: rooms: rom, deals: tilbud, careers: karriere, about: om-oss, assistance: hjelp, experiences: opplevelser, howToGetHere: finn-veien, apartment: private-rom, privateBooking: bestill-privat-opphold, book: bestill, guides: guider, terms: vilkar, houseRules: husregler, privacyPolicy: personvern, cookiePolicy: cookiepolicy, breakfastMenu: frokostmeny, barMenu: barmeny
- `da`: rooms: vaerelser, deals: tilbud, careers: karriere, about: om-os, assistance: hjaelp, experiences: oplevelser, howToGetHere: find-vej, apartment: private-vaerelser, privateBooking: bestil-privat-ophold, book: bestil, guides: guider, terms: vilkar, houseRules: husregler, privacyPolicy: privatlivspolitik, cookiePolicy: cookiepolitik, breakfastMenu: morgenmadsmenu, barMenu: barmenu
- `hu`: rooms: szobak, deals: akciok, careers: karrier, about: rolunk, assistance: segitseg, experiences: elmenyek, howToGetHere: hogyan-jutsz-ide, apartment: privat-szobak, privateBooking: privat-szallas-foglalas, book: foglalas, guides: utmutatok, terms: feltetelek, houseRules: hazi-szabalyok, privacyPolicy: adatvedelmi-tajekoztato, cookiePolicy: cookie-szabalyzat, breakfastMenu: reggeli-etlap, barMenu: bar-etlap

## Unexpected Top-Level English Matches
- None

## Unexpected Nested Route-Segment English Matches
- None

## Unexpected Special-Route English Matches
- None

## Unexpected Room Slug English Matches
- None

## Unexpected Guide Slug English Matches
- None
