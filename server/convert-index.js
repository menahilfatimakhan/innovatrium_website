/* ==========================================================================
   convert-index.js — one-off: populate the Strapi "index" page (the
   homepage) with its full block content (converted from the hand-coded
   HTML) and flip isGenerated to true so generate.js starts writing
   index.html. Uploads the cohort/partner/highlight images it references.
   Run once: node convert-index.js
   ========================================================================== */
'use strict';

const path = require('path');
const { upsertPage, uploadFile } = require('./lib/strapi-client');

const ROOT = path.join(__dirname, '..');
const img = (...p) => path.join(ROOT, 'assets', 'images', ...p);

async function main() {
  const [cohort1, cohort2, cohort3, highlightImg, bnuLogo, googleLogo, apacLogo, asiaLogo] = await Promise.all([
    uploadFile(img('cohort', 'cohort-1.jpeg')),
    uploadFile(img('cohort', 'cohort-2.jpeg')),
    uploadFile(img('cohort', 'cohort-3.jpeg')),
    uploadFile(img('logos', 'Centre for Innovation and Incubation .png')),
    uploadFile(img('logos', 'BNU logo.png')),
    uploadFile(img('logos', 'google-org-logo.png')),
    uploadFile(img('logos', 'apac-logo.png')),
    uploadFile(img('logos', 'asia-foundation-logo.png')),
  ]);

  const data = {
    navLabel: 'Home',
    slug: 'index',
    order: 0,
    isHomepage: true,
    isGenerated: true,
    theme: { primary: '#49B96B', primaryDark: '#2F9E5B' },
    hero: {
      badge: 'BNU Incubation Center',
      title: 'Igniting Innovation,\nEmpowering Growth',
      subtitle:
        'Welcome to Innovatrium at BNU, where startups transform bold ideas into the next big ventures. We provide world-class resources, mentorship, and opportunities designed to help you succeed.',
      accentText: 'where startups transform bold ideas into the next big ventures',
    },
    blocks: [
      {
        __component: 'block.stats',
        badge: 'Our Impact',
        intro: "Figures from Innovatrium's cohorts, clinics, and partner network so far.",
        linkLabel: 'Explore our programs',
        linkHref: '#programs',
        items: [
          { value: '10+', label: 'Startups Supported' },
          { value: '20K+', label: 'PKR Revenue' },
          { value: '1M+', label: 'PKR Investment' },
          { value: '30+', label: 'Industry Partners' },
        ],
      },
      {
        __component: 'block.gallery',
        badge: 'Life at Innovatrium',
        heading: 'Where Founders Come Together',
        intro: 'Snapshots from our cohorts, clinics, and community sessions on the BNU campus.',
        items: [
          { image: cohort1, caption: 'Cohort orientation, BNU campus' },
          { image: cohort2, caption: 'Mentor session in progress' },
          { image: cohort3, caption: 'Hands-on clinic workshop' },
        ],
      },
      {
        __component: 'block.highlight',
        badge: 'Global Reach',
        heading: 'Go Global at Innovatrium',
        text: "In partnership with international networks, our programs connect you to global markets, resources, and expert mentorship. Whether you're ready to expand or looking for guidance, we've got you covered.",
        items: [
          { text: 'Access to global acceleration programs' },
          { text: 'One-on-one mentorship from industry experts' },
          { text: 'State-of-the-art incubation facilities' },
          { text: 'Investor matchmaking and pitch prep' },
        ],
        buttonLabel: 'Join the Community',
        image: highlightImg,
      },
      {
        __component: 'block.logos',
        badge: 'Backed By',
        heading: 'Our Partners & Supporters',
        logos: [
          { src: bnuLogo, alt: 'Beaconhouse National University', mono: true },
          { src: googleLogo, alt: 'Google.org' },
          { src: apacLogo, alt: 'APAC Cybersecurity Fund' },
          { src: asiaLogo, alt: 'The Asia Foundation' },
        ],
      },
      {
        __component: 'block.cta',
        styleKey: 'dark',
        heading: 'Transform Your Idea into Reality',
        text: 'Applications for the next cohort are opening soon. Register your interest now.',
        buttonLabel: 'Get Started',
        buttonHref: 'incubation.html',
      },
    ],
  };

  await upsertPage('index', data);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
