#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOCALES_DIR = join(__dirname, '../apps/brikette/src/locales');
const REMAINING_LOCALES = ['ar', 'da', 'de', 'es', 'pt', 'ru', 'sv', 'vi', 'zh'];

// Translation mappings
const translations = {
  title: {
    ar: 'الوصول من وإلى الشواطئ',
    da: 'Sådan kommer du til og fra strendene',
    de: 'An- und Abreise zu den Stränden',
    es: 'Cómo llegar y regresar de las playas',
    pt: 'Como chegar e voltar das praias',
    ru: 'Как добраться до пляжей и обратно',
    sv: 'Hur du tar dig till och från stränderna',
    vi: 'Cách đến và rời khỏi các bãi biển',
    zh: '前往和离开海滩的方式'
  },
  body1: {
    ar: 'لكل شاطئ خيارات وصول مختلفة، لذا تحقق من الدليل المحدد قبل الانطلاق. إليك روابط سريعة لأدلة الاتجاهات الأكثر فائدة:',
    da: 'Hver strand har forskellige adgangsmuligheder, så tjek den specifikke guide, før du tager afsted. Her er hurtige links til de mest nyttige vejvisninger:',
    de: 'Jeder Strand hat unterschiedliche Zugangsoptionen. Schau dir den entsprechenden Guide an, bevor du losgehst. Hier sind schnelle Links zu den nützlichsten Wegbeschreibungen:',
    es: 'Cada playa tiene diferentes opciones de acceso, así que consulta la guía específica antes de salir. Aquí tienes enlaces rápidos a las guías de direcciones más útiles:',
    pt: 'Cada praia tem opções de acesso diferentes, por isso consulta o guia específico antes de saíres. Aqui tens links rápidos para os guias de direções mais úteis:',
    ru: 'У каждого пляжа разные варианты доступа, поэтому проверьте конкретное руководство перед выходом. Вот быстрые ссылки на самые полезные маршруты:',
    sv: 'Varje strand har olika åtkomstalternativ, så kolla den specifika guiden innan du ger dig iväg. Här är snabblänkar till de mest användbara vägbeskrivningarna:',
    vi: 'Mỗi bãi biển có các lựa chọn tiếp cận khác nhau, vì vậy hãy kiểm tra hướng dẫn cụ thể trước khi bạn đi. Dưới đây là các liên kết nhanh đến các hướng dẫn chỉ đường hữu ích nhất:',
    zh: '每个海滩都有不同的交通选择，因此在出发前请查看具体指南。以下是最有用的方向指南的快速链接：'
  },
  body2: {
    ar: 'شواطئ بوزيتانو: %LINK:positanoMainBeachWalkDown|المشي إلى سبياجا غراندي% • %LINK:positanoMainBeachBusDown|الحافلة إلى سبياجا غراندي% • %LINK:hostelBriketteToFornilloBeach|المشي إلى فورنيللو% • %LINK:hostelBriketteToArienzoBus|الحافلة إلى أريينزو% • %LINK:lauritoBeachBusDown|الحافلة إلى لاوريتو%',
    da: 'Positano-strande: %LINK:positanoMainBeachWalkDown|Gå til Spiaggia Grande% • %LINK:positanoMainBeachBusDown|Bus til Spiaggia Grande% • %LINK:hostelBriketteToFornilloBeach|Gå til Fornillo% • %LINK:hostelBriketteToArienzoBus|Bus til Arienzo% • %LINK:lauritoBeachBusDown|Bus til Laurito%',
    de: 'Positano-Strände: %LINK:positanoMainBeachWalkDown|Zu Fuß nach Spiaggia Grande% • %LINK:positanoMainBeachBusDown|Bus nach Spiaggia Grande% • %LINK:hostelBriketteToFornilloBeach|Zu Fuß nach Fornillo% • %LINK:hostelBriketteToArienzoBus|Bus nach Arienzo% • %LINK:lauritoBeachBusDown|Bus nach Laurito%',
    es: 'Playas de Positano: %LINK:positanoMainBeachWalkDown|Caminar a Spiaggia Grande% • %LINK:positanoMainBeachBusDown|Bus a Spiaggia Grande% • %LINK:hostelBriketteToFornilloBeach|Caminar a Fornillo% • %LINK:hostelBriketteToArienzoBus|Bus a Arienzo% • %LINK:lauritoBeachBusDown|Bus a Laurito%',
    pt: 'Praias de Positano: %LINK:positanoMainBeachWalkDown|Caminhar para Spiaggia Grande% • %LINK:positanoMainBeachBusDown|Autocarro para Spiaggia Grande% • %LINK:hostelBriketteToFornilloBeach|Caminhar para Fornillo% • %LINK:hostelBriketteToArienzoBus|Autocarro para Arienzo% • %LINK:lauritoBeachBusDown|Autocarro para Laurito%',
    ru: 'Пляжи Позитано: %LINK:positanoMainBeachWalkDown|Пешком до Спьяджа-Гранде% • %LINK:positanoMainBeachBusDown|Автобус до Спьяджа-Гранде% • %LINK:hostelBriketteToFornilloBeach|Пешком до Форнилло% • %LINK:hostelBriketteToArienzoBus|Автобус до Ариенцо% • %LINK:lauritoBeachBusDown|Автобус до Лаурито%',
    sv: 'Positano-stränder: %LINK:positanoMainBeachWalkDown|Gå till Spiaggia Grande% • %LINK:positanoMainBeachBusDown|Buss till Spiaggia Grande% • %LINK:hostelBriketteToFornilloBeach|Gå till Fornillo% • %LINK:hostelBriketteToArienzoBus|Buss till Arienzo% • %LINK:lauritoBeachBusDown|Buss till Laurito%',
    vi: 'Các bãi biển Positano: %LINK:positanoMainBeachWalkDown|Đi bộ đến Spiaggia Grande% • %LINK:positanoMainBeachBusDown|Xe buýt đến Spiaggia Grande% • %LINK:hostelBriketteToFornilloBeach|Đi bộ đến Fornillo% • %LINK:hostelBriketteToArienzoBus|Xe buýt đến Arienzo% • %LINK:lauritoBeachBusDown|Xe buýt đến Laurito%',
    zh: '波西塔诺海滩：%LINK:positanoMainBeachWalkDown|步行至大海滩% • %LINK:positanoMainBeachBusDown|乘巴士至大海滩% • %LINK:hostelBriketteToFornilloBeach|步行至福尔尼洛% • %LINK:hostelBriketteToArienzoBus|乘巴士至阿里恩佐% • %LINK:lauritoBeachBusDown|乘巴士至劳里托%'
  },
  body3: {
    ar: 'طرق العودة: %LINK:positanoMainBeachWalkBack|المشي من سبياجا غراندي% • %LINK:positanoMainBeachBusBack|الحافلة من سبياجا غراندي% • %LINK:fornilloBeachToBrikette|المشي من فورنيللو% • %LINK:arienzoBeachBusBack|الحافلة من أريينزو% • %LINK:lauritoBeachBusBack|الحافلة من لاوريتو%',
    da: 'Returveje: %LINK:positanoMainBeachWalkBack|Gå tilbage fra Spiaggia Grande% • %LINK:positanoMainBeachBusBack|Bus tilbage fra Spiaggia Grande% • %LINK:fornilloBeachToBrikette|Gå tilbage fra Fornillo% • %LINK:arienzoBeachBusBack|Bus tilbage fra Arienzo% • %LINK:lauritoBeachBusBack|Bus tilbage fra Laurito%',
    de: 'Rückwege: %LINK:positanoMainBeachWalkBack|Zu Fuß zurück von Spiaggia Grande% • %LINK:positanoMainBeachBusBack|Bus zurück von Spiaggia Grande% • %LINK:fornilloBeachToBrikette|Zu Fuß zurück von Fornillo% • %LINK:arienzoBeachBusBack|Bus zurück von Arienzo% • %LINK:lauritoBeachBusBack|Bus zurück von Laurito%',
    es: 'Rutas de regreso: %LINK:positanoMainBeachWalkBack|Caminar de regreso desde Spiaggia Grande% • %LINK:positanoMainBeachBusBack|Bus de regreso desde Spiaggia Grande% • %LINK:fornilloBeachToBrikette|Caminar de regreso desde Fornillo% • %LINK:arienzoBeachBusBack|Bus de regreso desde Arienzo% • %LINK:lauritoBeachBusBack|Bus de regreso desde Laurito%',
    pt: 'Rotas de regresso: %LINK:positanoMainBeachWalkBack|Caminhar de volta de Spiaggia Grande% • %LINK:positanoMainBeachBusBack|Autocarro de volta de Spiaggia Grande% • %LINK:fornilloBeachToBrikette|Caminhar de volta de Fornillo% • %LINK:arienzoBeachBusBack|Autocarro de volta de Arienzo% • %LINK:lauritoBeachBusBack|Autocarro de volta de Laurito%',
    ru: 'Обратные маршруты: %LINK:positanoMainBeachWalkBack|Пешком от Спьяджа-Гранде% • %LINK:positanoMainBeachBusBack|Автобус от Спьяджа-Гранде% • %LINK:fornilloBeachToBrikette|Пешком от Форнилло% • %LINK:arienzoBeachBusBack|Автобус от Ариенцо% • %LINK:lauritoBeachBusBack|Автобус от Лаурито%',
    sv: 'Returvägar: %LINK:positanoMainBeachWalkBack|Gå tillbaka från Spiaggia Grande% • %LINK:positanoMainBeachBusBack|Buss tillbaka från Spiaggia Grande% • %LINK:fornilloBeachToBrikette|Gå tillbaka från Fornillo% • %LINK:arienzoBeachBusBack|Buss tillbaka från Arienzo% • %LINK:lauritoBeachBusBack|Buss tillbaka från Laurito%',
    vi: 'Các tuyến trở về: %LINK:positanoMainBeachWalkBack|Đi bộ trở về từ Spiaggia Grande% • %LINK:positanoMainBeachBusBack|Xe buýt trở về từ Spiaggia Grande% • %LINK:fornilloBeachToBrikette|Đi bộ trở về từ Fornillo% • %LINK:arienzoBeachBusBack|Xe buýt trở về từ Arienzo% • %LINK:lauritoBeachBusBack|Xe buýt trở về từ Laurito%',
    zh: '返回路线：%LINK:positanoMainBeachWalkBack|从大海滩步行返回% • %LINK:positanoMainBeachBusBack|从大海滩乘巴士返回% • %LINK:fornilloBeachToBrikette|从福尔尼洛步行返回% • %LINK:arienzoBeachBusBack|从阿里恩佐乘巴士返回% • %LINK:lauritoBeachBusBack|从劳里托乘巴士返回%'
  },
  body4: {
    ar: 'شواطئ الرحلات اليومية: %LINK:hostelBriketteToFiordoDiFuroreBus|فيوردو دي فوروري% • %LINK:gavitellaBeachGuide|غافيتيلا (برايانو)% • %LINK:marinaDiPraiaBeaches|مارينا دي برايا% • %LINK:reginaGiovannaBath|ريجينا جيوفانا (سورينتو)%',
    da: 'Dagsturstrande: %LINK:hostelBriketteToFiordoDiFuroreBus|Fiordo di Furore% • %LINK:gavitellaBeachGuide|Gavitella (Praiano)% • %LINK:marinaDiPraiaBeaches|Marina di Praia% • %LINK:reginaGiovannaBath|Regina Giovanna (Sorrento)%',
    de: 'Tagesausflug-Strände: %LINK:hostelBriketteToFiordoDiFuroreBus|Fiordo di Furore% • %LINK:gavitellaBeachGuide|Gavitella (Praiano)% • %LINK:marinaDiPraiaBeaches|Marina di Praia% • %LINK:reginaGiovannaBath|Regina Giovanna (Sorrento)%',
    es: 'Playas para excursiones de un día: %LINK:hostelBriketteToFiordoDiFuroreBus|Fiordo di Furore% • %LINK:gavitellaBeachGuide|Gavitella (Praiano)% • %LINK:marinaDiPraiaBeaches|Marina di Praia% • %LINK:reginaGiovannaBath|Regina Giovanna (Sorrento)%',
    pt: 'Praias para excursões de um dia: %LINK:hostelBriketteToFiordoDiFuroreBus|Fiordo di Furore% • %LINK:gavitellaBeachGuide|Gavitella (Praiano)% • %LINK:marinaDiPraiaBeaches|Marina di Praia% • %LINK:reginaGiovannaBath|Regina Giovanna (Sorrento)%',
    ru: 'Пляжи для однодневных поездок: %LINK:hostelBriketteToFiordoDiFuroreBus|Фьордо-ди-Фуроре% • %LINK:gavitellaBeachGuide|Гавителла (Прайано)% • %LINK:marinaDiPraiaBeaches|Марина-ди-Прайя% • %LINK:reginaGiovannaBath|Реджина-Джованна (Сорренто)%',
    sv: 'Dagsturstränder: %LINK:hostelBriketteToFiordoDiFuroreBus|Fiordo di Furore% • %LINK:gavitellaBeachGuide|Gavitella (Praiano)% • %LINK:marinaDiPraiaBeaches|Marina di Praia% • %LINK:reginaGiovannaBath|Regina Giovanna (Sorrento)%',
    vi: 'Các bãi biển trong chuyến đi trong ngày: %LINK:hostelBriketteToFiordoDiFuroreBus|Fiordo di Furore% • %LINK:gavitellaBeachGuide|Gavitella (Praiano)% • %LINK:marinaDiPraiaBeaches|Marina di Praia% • %LINK:reginaGiovannaBath|Regina Giovanna (Sorrento)%',
    zh: '一日游海滩：%LINK:hostelBriketteToFiordoDiFuroreBus|富罗雷峡湾% • %LINK:gavitellaBeachGuide|加维泰拉（普莱亚诺）% • %LINK:marinaDiPraiaBeaches|普拉亚海滨% • %LINK:reginaGiovannaBath|雷吉纳乔万娜（索伦托）%'
  },
  body5: {
    ar: 'نصائح عامة: في صيف 2026، خطط للحرارة عند الصعود - أعد ملء الماء قبل العودة، واستخدم الحافلة الداخلية إذا كنت متعبًا. بالنسبة للرحلات اليومية، تحقق من خيار العودة الأخير (عبارة أو حافلة) قبل الالتزام، واحضر وجبات خفيفة للرحلة. إذا كان البحر هائجًا أو تم إلغاء العبارات، خطط لوقت إضافي وابق مرنًا.',
    da: 'Generelle tips: I sommeren 2026 skal du planlægge for varme på stigningerne – genopfyld vand, før du går tilbage, og brug den interne bus, hvis du er træt. For dagsture skal du tjekke den sidste returmulighed (færge eller bus), før du forpligter dig, og pakke snacks til turen. Hvis havet er uroligt, eller færgerne er aflyst, skal du planlægge ekstra tid og holde din tidsplan fleksibel.',
    de: 'Allgemeine Tipps: Plane im Sommer 2026 für die Hitze bei den Aufstiegen – fülle Wasser nach, bevor du zurückgehst, und nutze den Interno-Bus, wenn du müde bist. Für Tagesausflüge überprüfe die letzte Rückkehroption (Fähre oder Bus), bevor du dich festlegst, und pack Snacks für die Fahrt ein. Wenn die See rau ist oder Fähren ausfallen, plane zusätzliche Zeit ein und bleibe flexibel.',
    es: 'Consejos generales: En verano de 2026, planifica para el calor en las subidas: rellena agua antes de regresar y usa el autobús interno si estás cansado. Para excursiones de un día, verifica la última opción de regreso (ferry o autobús) antes de comprometerte y lleva snacks para el viaje. Si el mar está agitado o los ferries están cancelados, planifica tiempo extra y mantén tu horario flexible.',
    pt: 'Dicas gerais: No verão de 2026, planeia para o calor nas subidas—enche a garrafa de água antes de voltares e usa o autocarro interno se estiveres cansado. Para excursões de um dia, verifica a última opção de regresso (ferry ou autocarro) antes de te comprometeres e leva snacks para a viagem. Se o mar estiver agitado ou os ferries forem cancelados, planeia tempo extra e mantém o teu horário flexível.',
    ru: 'Общие советы: Летом 2026 года планируйте жару на подъемах — пополняйте запасы воды перед возвращением и пользуйтесь внутренним автобусом, если устали. Для однодневных поездок проверьте последний вариант возвращения (паром или автобус), прежде чем планировать, и возьмите закуски на дорогу. Если море неспокойное или паромы отменены, запланируйте дополнительное время и оставайтесь гибкими.',
    sv: 'Allmänna tips: Under sommaren 2026, planera för värme vid stigningarna—fyll på vatten innan du går tillbaka och använd den interna bussen om du är trött. För dagsutflykter, kolla det sista returtillfället (färja eller buss) innan du bestämmer dig och ta med snacks för resan. Om havet är grovt eller färjor är inställda, planera extra tid och håll ditt schema flexibelt.',
    vi: 'Mẹo chung: Vào mùa hè 2026, hãy lập kế hoạch cho cái nóng khi leo dốc—đổ đầy nước trước khi quay lại và sử dụng xe buýt nội bộ nếu bạn mệt. Đối với các chuyến đi trong ngày, hãy kiểm tra lựa chọn quay về cuối cùng (phà hoặc xe buýt) trước khi cam kết và mang đồ ăn nhẹ cho chuyến đi. Nếu biển động hoặc phà bị hủy, hãy lên kế hoạch thêm thời gian và giữ lịch trình linh hoạt.',
    zh: '一般提示：在2026年夏季，为爬山的炎热做好准备——在返回前装满水，如果累了就使用内部巴士。对于一日游，在承诺之前检查最后返回选项（渡轮或巴士），并为旅程准备零食。如果海况恶劣或渡轮取消，请规划额外时间并保持日程灵活。'
  },
  lauritoCaption: {
    ar: 'تخطيط شاطئ لاوريتو: 1. المنطقة المجانية 2. نادي TreVilla Beach 3. Da Adolfo',
    da: 'Laurito-strandlayout: 1. Gratis område 2. TreVilla Beach Club 3. Da Adolfo',
    de: 'Laurito-Strandaufteilung: 1. Kostenloser Bereich 2. TreVilla Beach Club 3. Da Adolfo',
    es: 'Disposición de la playa de Laurito: 1. Área gratuita 2. TreVilla Beach Club 3. Da Adolfo',
    pt: 'Layout da praia de Laurito: 1. Área gratuita 2. TreVilla Beach Club 3. Da Adolfo',
    ru: 'Планировка пляжа Лаурито: 1. Бесплатная зона 2. TreVilla Beach Club 3. Da Adolfo',
    sv: 'Laurito-strandlayout: 1. Gratis område 2. TreVilla Beach Club 3. Da Adolfo',
    vi: 'Bố cục bãi biển Laurito: 1. Khu vực miễn phí 2. Câu lạc bộ bãi biển TreVilla 3. Da Adolfo',
    zh: '劳里托海滩布局：1. 免费区域 2. TreVilla海滩俱乐部 3. Da Adolfo'
  }
};

function updatePositanoBeaches(locale) {
  const filePath = join(LOCALES_DIR, locale, 'guides/content/positanoBeaches.json');
  try {
    const content = readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Find logistics section
    const logisticsSection = data.sections.find(s => s.id === 'logistics');
    if (logisticsSection) {
      logisticsSection.title = translations.title[locale];
      logisticsSection.body = [
        translations.body1[locale],
        translations.body2[locale],
        translations.body3[locale],
        translations.body4[locale],
        translations.body5[locale]
      ];
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${locale}/positanoBeaches.json`);
  } catch (error) {
    console.error(`✗ Failed to update ${locale}/positanoBeaches.json:`, error.message);
  }
}

function updateLauritoBeachGuide(locale) {
  const filePath = join(LOCALES_DIR, locale, 'guides/content/lauritoBeachGuide.json');
  try {
    const content = readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Find why-go section and update the image caption
    const whyGoSection = data.sections.find(s => s.id === 'why-go');
    if (whyGoSection && whyGoSection.images && whyGoSection.images[0]) {
      whyGoSection.images[0].caption = translations.lauritoCaption[locale];
    }

    // Also update in the images object if it exists
    if (data.images && data.images.whyGo) {
      data.images.whyGo.caption = translations.lauritoCaption[locale];
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${locale}/lauritoBeachGuide.json`);
  } catch (error) {
    console.error(`✗ Failed to update ${locale}/lauritoBeachGuide.json:`, error.message);
  }
}

// Process all remaining locales
console.log('Updating remaining locales...\n');
REMAINING_LOCALES.forEach(locale => {
  console.log(`Processing ${locale}:`);
  updatePositanoBeaches(locale);
  updateLauritoBeachGuide(locale);
  console.log('');
});

console.log('Done!');
