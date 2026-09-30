import { db } from "@/lib/db.server";
import { hashPassword } from "@/lib/auth.server";
import siteRaw from "@/config/site.json";

const BRAND = {
  name: "Biashara Point Consultancy",
  legalName: "Biashara Point Consultancy",
  shortName: "Biashara Point",
  tagline: "Business Consultancy",
  motto: "Business and investment consultancy, start to finish.",
  logo: "/logo.png",
  logoDark: "/logo.png",
  favicon: "/favicon.png",
  bannerImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
  foundedYear: 2020,
};

const SEO = {
  titleTemplate: "%s | Biashara Point Consultancy",
  defaultTitle: "Biashara Point Consultancy | Business Registration & Consultancy Tanzania",
  defaultDescription:
    "Company registration, business licences, work permits, trademarks and bankable business plans for local and foreign investors in Tanzania.",
  keywords: [
    "company registration Tanzania",
    "business licences",
    "work permits",
    "trademark registration",
    "business plans",
    "Bureau de Change",
    "Tanzania business consultancy",
  ],
  locale: "en_US",
  twitterHandle: "",
  organizationType: "ProfessionalService",
  themeColor: "#0f172a",
  socials: {
    twitter: "",
  },
  geo: {
    country: "TZ",
    region: "Dar es Salaam",
    locality: "Dar es Salaam",
    street: "Makumbusho Complex, Block B, 2nd Floor, Room B2ND-08",
    postalCode: "14110",
    latitude: -6.7924,
    longitude: 39.2083,
    openingHours: ["Mo-Fr 08:00-23:00", "Sa 08:00-14:00"],
    priceRange: "$$",
  },
};

const HERO = {
  mode: "slideshow",
  autoplayMs: 6000,
  animateText: true,
  overlay: 0.55,
  solidToken: "primary",
  slides: [
    {
      url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920",
      title: "Start your business with confidence",
      subtitle:
        "Company registration, licences, permits and advisory services for local and foreign investors in Tanzania.",
      ctaLabel: "Explore services",
      ctaHref: "/services",
    },
    {
      url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920",
      title: "Every permit, one desk",
      subtitle:
        "Business licences, work permits, trademarks and statutory filings handled by specialists.",
      ctaLabel: "Talk to us",
      ctaHref: "/contacts",
    },
    {
      url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920",
      title: "Plans that get funded",
      subtitle: "Bankable business plans and feasibility studies built on real market data.",
      ctaLabel: "See how we work",
      ctaHref: "/about-us",
    },
  ],
};

const CONTACTS = {
  companyName: "Biashara Point Consultancy",
  addressLines: [
    "Makumbusho Complex, Block B",
    "2nd Floor, Room B2ND-08",
    "Dar es Salaam, Tanzania",
  ],
  phones: ["+255 763 335 486"],
  emails: ["info@biasharapoint.co.tz"],
  hours: [
    { label: "Monday - Friday", value: "8:00am - 11:00pm" },
    { label: "Saturday", value: "8:00am - 2:00pm" },
    { label: "Sunday", value: "Closed" },
  ],
  map: {
    enabled: true,
    query: "Makumbusho Complex, Block B, 2nd Floor, Room B2ND-08, Dar es Salaam, Tanzania",
    zoom: 15,
  },
};

const ABOUT = {
  heading: "About Biashara Point Consultancy",
  paragraphs: [
    "Biashara Point Consultancy ni kampuni ya ushauri wa kibiashara nchini Tanzania inayosaidia wajasiriamali na makampuni katika kusajili biashara, kupata leseni, na kushughulikia taratibu za kisheria.",
    "Kampuni hii inajikita katika kurahisisha mazingira ya biashara kwa kutoa huduma zifuatazo: Usajili wa Makampuni na Majina ya Biashara kupitia BRELA, Leseni za Biashara na Utalii, Vibali vya Ukaazi na Kazi, Usajili wa Alama za Biashara (Trademark), Mifumo ya Kifedha na Bureau De Change, pamoja na Nyaraka za Kibiashara.",
    "Ofisi zao kuu ziko Makumbusho Complex, Block B, Ghorofa ya 2, Chumba Na. B2ND-08 jijini Dar es Salaam. Saa za kazi ni Jumatatu hadi Ijumaa (Saa 2:00 Asubuhi - Saa 11:00 Jioni) na Jumamosi (Saa 3:00 Asubuhi - Saa 8:00 Mchana).",
  ],
  highlight:
    "Tunasaidia wajasiriamali na makampuni kuanzia kusajili biashara, kupata leseni, hadi kufanikisha malengo yao ya kiuchumi Tanzania.",
  image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80&fit=crop",
  customersServed: 500,
};

const SERVICES = [
  {
    slug: "company-registration",
    title: "Company Registration & Business Names",
    summary:
      "End-to-end incorporation of local and foreign-owned companies, from name search to certificate collection through BRELA.",
    body: "<p>We handle the full incorporation journey so you can focus on trading. Our team files your name search, prepares the memorandum and articles, submits to the registrar and collects your certificate of incorporation.</p><p>We also register your TIN, business licence and statutory files so the company is operational from day one.</p>",
    icon: "building-2",
    order_index: 1,
    highlights: [
      "Name search and reservation",
      "Memorandum and articles drafting",
      "Registrar filing and follow up",
      "TIN and statutory registration",
    ],
  },
  {
    slug: "business-licences",
    title: "Business Licences & Tourism Licences",
    summary:
      "Sector licences, permits and renewals handled by consultants who know every counter, including TALA tourism licences.",
    body: "<p>Every sector carries its own licensing regime. We map the licences your business actually needs, prepare the applications, and manage renewals before they lapse.</p>",
    icon: "badge-check",
    order_index: 2,
    highlights: [
      "Licence gap assessment",
      "Application preparation",
      "Municipal and sector permits",
      "Renewal calendar management",
    ],
  },
  {
    slug: "work-permits",
    title: "Work Permits & Residence Permits",
    summary:
      "Class A, B and C work permits, residence permits and immigration advisory for foreign investors and staff.",
    body: "<p>From registering a business name to securing class A, B and C permits for expatriate staff, we keep your people and your paperwork compliant.</p>",
    icon: "passport",
    order_index: 3,
    highlights: [
      "Work and residence permits",
      "Immigration advisory",
      "Labour compliance audits",
      "Expatriate quota applications",
    ],
  },
  {
    slug: "trademark-registration",
    title: "Trademark Registration",
    summary:
      "Protect your brand and business marks legally through trademark registration in Tanzania.",
    body: "<p>We help you register and protect your brand names, logos and trademarks to safeguard your business identity and intellectual property.</p>",
    icon: "shield-check",
    order_index: 4,
    highlights: [
      "Trademark search and clearance",
      "Application filing",
      "Brand protection advisory",
      "Renewal and monitoring",
    ],
  },
  {
    slug: "bureau-de-change",
    title: "Bureau de Change Setup",
    summary:
      "End-to-end setup of currency exchange businesses with BoT licences and operational compliance.",
    body: "<p>We manage the complete process of establishing a Bureau de Change, from obtaining licences from the Bank of Tanzania to operational compliance.</p>",
    icon: "banknote",
    order_index: 5,
    highlights: [
      "BoT licence application",
      "Location and security compliance",
      "Staff training and onboarding",
      "Ongoing regulatory compliance",
    ],
  },
  {
    slug: "business-plans",
    title: "Business Plans & Local Content Plans",
    summary:
      "Bankable business plans and local content plans for funding, permits and regulatory submissions.",
    body: "<p>We write investor-ready business plans backed by real market data and defensible financial models, suitable for banks, investors and regulatory submissions.</p>",
    icon: "file-text",
    order_index: 6,
    highlights: [
      "Market and competitor research",
      "Three to five year financial models",
      "Feasibility studies",
      "Investor pitch materials",
    ],
  },
];

const TEAM = [
  {
    name: "Biashara Point Team",
    role: "Consultancy Team",
    bio: "Professional consultants specialising in business registration, licensing, immigration and business planning in Tanzania.",
    photo_url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=600&fit=crop",
    order_index: 1,
  },
];

const SOCIALS = [
  {
    platform: "facebook",
    url: "https://facebook.com",
    enabled: true,
    order_index: 1,
    icon: "facebook",
  },
  { platform: "twitter", url: "https://x.com", enabled: true, order_index: 2, icon: "twitter" },
  {
    platform: "linkedin",
    url: "https://linkedin.com",
    enabled: true,
    order_index: 3,
    icon: "linkedin",
  },
  {
    platform: "whatsapp",
    url: "https://wa.me/255763335486",
    enabled: true,
    order_index: 4,
    icon: "message-circle",
  },
  { platform: "instagram", url: "", enabled: false, order_index: 5, icon: "instagram" },
  { platform: "youtube", url: "", enabled: false, order_index: 6, icon: "youtube" },
];

async function scan() {
  console.log("Scanning current database state...\n");

  const settings = await db().from("settings").select("key,value,updated_at").order("key");

  const services = await db()
    .from("services")
    .select("slug,title,order_index,published")
    .order("order_index");

  const team = await db().from("team_members").select("name,role,order_index").order("order_index");

  const socials = await db()
    .from("socials")
    .select("platform,url,enabled,order_index")
    .order("order_index");

  const users = await db().from("site_users").select("name,email,role").limit(5);

  console.log(`settings rows: ${settings.data?.length ?? 0}`);
  console.log(`services rows: ${services.data?.length ?? 0}`);
  console.log(`team rows: ${team.data?.length ?? 0}`);
  console.log(`socials rows: ${socials.data?.length ?? 0}`);
  console.log(`users rows: ${users.data?.length ?? 0}`);

  return {
    settings: settings.data ?? [],
    services: services.data ?? [],
    team: team.data ?? [],
    socials: socials.data ?? [],
    users: users.data ?? [],
  };
}

async function updateSettings(key: string, value: any) {
  const client = db();
  const existing = await client.from("settings").select("key").eq("key", key).maybeSingle();
  if (existing.data) {
    await client
      .from("settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
  } else {
    await client.from("settings").insert({ key, value, updated_at: new Date().toISOString() });
  }
}

async function updateServices() {
  const client = db();
  const existing = await client.from("services").select("slug,id").order("order_index");
  const existingSlugs = new Set((existing.data ?? []).map((r: any) => r.slug));

  for (const svc of SERVICES) {
    if (existingSlugs.has(svc.slug)) {
      await client
        .from("services")
        .update({ ...svc, published: true, updated_at: new Date().toISOString() })
        .eq("slug", svc.slug);
    } else {
      await client.from("services").insert({
        ...svc,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const extras = (existing.data ?? []).filter((r: any) => !SERVICES.find((s) => s.slug === r.slug));
  for (const extra of extras) {
    await client.from("services").delete().eq("id", extra.id);
  }
}

async function updateTeam() {
  const client = db();
  const existing = await client
    .from("team_members")
    .select("id,name,order_index")
    .order("order_index");
  const existingNames = new Set((existing.data ?? []).map((r: any) => r.name));

  for (const member of TEAM) {
    if (existingNames.has(member.name)) {
      const row = (existing.data ?? []).find((r: any) => r.name === member.name);
      await client
        .from("team_members")
        .update({ ...member, bio: member.bio })
        .eq("id", row.id);
    } else {
      await client
        .from("team_members")
        .insert({ ...member, bio: member.bio, created_at: new Date().toISOString() });
    }
  }

  const extras = (existing.data ?? []).filter((r: any) => !TEAM.find((t) => t.name === r.name));
  for (const extra of extras) {
    await client.from("team_members").delete().eq("id", extra.id);
  }
}

async function updateSocials() {
  const client = db();
  const existing = await client
    .from("socials")
    .select("id,platform,order_index")
    .order("order_index");
  const existingPlatforms = new Set((existing.data ?? []).map((r: any) => r.platform));

  for (const s of SOCIALS) {
    if (existingPlatforms.has(s.platform)) {
      const row = (existing.data ?? []).find((r: any) => r.platform === s.platform);
      await client
        .from("socials")
        .update({ ...s, icon: s.icon })
        .eq("id", row.id);
    } else {
      await client.from("socials").insert({ ...s, icon: s.icon });
    }
  }

  const extras = (existing.data ?? []).filter(
    (r: any) => !SOCIALS.find((s) => s.platform === r.platform),
  );
  for (const extra of extras) {
    await client.from("socials").delete().eq("id", extra.id);
  }
}

async function updateAdmin() {
  const client = db();
  const existing = await client
    .from("site_users")
    .select("id,role")
    .eq("role", "super")
    .maybeSingle();
  if (existing.data) {
    await client
      .from("site_users")
      .update({
        name: "Biashara Point Admin",
        email: "info@biasharapoint.co.tz",
        password_hash: hashPassword("Password"),
      })
      .eq("id", existing.data.id);
  } else {
    await client.from("site_users").insert({
      name: "Biashara Point Admin",
      email: "info@biasharapoint.co.tz",
      role: "super",
      password_hash: hashPassword("Password"),
      active: true,
    });
  }
}

async function seed() {
  console.log("\nSeeding Biashara Point Consultancy data...\n");

  await updateSettings("hero", HERO);
  console.log("Updated hero settings");

  await updateSettings("contacts", CONTACTS);
  console.log("Updated contacts settings");

  await updateSettings("about", ABOUT);
  console.log("Updated about settings");

  await updateServices();
  console.log(`Updated services`);

  await updateTeam();
  console.log(`Updated team members`);

  await updateSocials();
  console.log(`Updated social links`);

  await updateAdmin();
  console.log("Updated super admin user");

  console.log("\nDatabase seeding complete.");
}

async function main() {
  try {
    await scan();
    await seed();
    process.exit(0);
  } catch (err) {
    console.error("Seeder failed:", err);
    process.exit(1);
  }
}

main();
