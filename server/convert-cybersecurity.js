/* ==========================================================================
   convert-cybersecurity.js — one-off: populate the Strapi "cybersecurity"
   page with its full block content (converted from the hand-coded HTML) and
   flip isGenerated to true so generate.js starts writing cybersecurity.html.
   Uploads the logos/cohort images it references (reusing already-uploaded
   ones by name where possible).
   Run once: node convert-cybersecurity.js
   ========================================================================== */
'use strict';

const path = require('path');
const { upsertPage, uploadFile } = require('./lib/strapi-client');

const ROOT = path.join(__dirname, '..');
const img = (...p) => path.join(ROOT, 'assets', 'images', ...p);

async function main() {
  const [cohort1, cohort2, cohort3, googleLogo, apacLogo, asiaLogo, consortiumLogo, allianceLogo] = await Promise.all([
    uploadFile(img('cohort', 'cohort-1.jpeg')),
    uploadFile(img('cohort', 'cohort-2.jpeg')),
    uploadFile(img('cohort', 'cohort-3.jpeg')),
    uploadFile(img('logos', 'google-org-logo.png')),
    uploadFile(img('logos', 'apac-logo.png')),
    uploadFile(img('logos', 'asia-foundation-logo.png')),
    uploadFile(img('logos', 'Cyber Consortium Logo.png')),
    uploadFile(img('logos', 'Cyber Alliance Logo.png')),
  ]);

  const data = {
    navLabel: 'Cybersecurity',
    slug: 'cybersecurity',
    order: 2,
    isHomepage: false,
    isGenerated: true,
    theme: { primary: '#7C3AAD', primaryDark: '#5B2C82' },
    hero: {
      badge: 'Program',
      title: 'Cybersecurity Clinic',
      subtitle: 'Hands-on defense training, real-world clinics, and modern tools to tackle evolving digital threats.',
    },
    application: {
      formUrl: 'https://forms.gle/7yGbXYEzs72Qhqax8',
      deadline: '2025-10-31',
      status: 'open',
    },
    blocks: [
      {
        __component: 'block.rich-text',
        tileIcon: 'fas fa-shield-halved',
        heading: 'Defend the Digital Frontier',
        body:
          "The Cybersecurity Clinic at Innovatrium is open to everyone, no matter your field of study. Whether you come from business, law, design, the arts, engineering, or the sciences, you'll gain practical, hands-on experience defending against real cyber threats. Rather than just theory, you'll be thrust into live defense scenarios, no prior computer science background required.",
      },
      {
        __component: 'block.rich-text',
        tileIcon: 'fas fa-network-wired',
        reverse: true,
        heading: 'What You Will Learn',
        items: [
          { text: 'Vulnerability Scanning and Penetration Testing' },
          { text: 'Network Defense and Intrusion Detection Systems' },
          { text: 'Incident Response Protocols' },
          { text: 'Secure Coding Practices' },
          { text: 'Compliance, Risk Management and Privacy' },
        ],
      },
      {
        __component: 'block.card-grid',
        styleKey: 'who',
        badge: 'Audience',
        heading: 'Built for Every Discipline',
        intro:
          "Open to students and professionals from **every discipline**, not just computer science. If you're curious about protecting people and organizations online, this clinic is for you.",
        cards: [
          { icon: 'fas fa-user-graduate', title: 'Students of Every Discipline', text: 'Business, law, design, engineering or sciences. All majors welcome, no coding background needed' },
          { icon: 'fas fa-laptop-code', title: 'IT Professionals', text: 'Upskill and pivot into the cybersecurity sector' },
          { icon: 'fas fa-building-shield', title: 'Startup Founders', text: 'Learn to protect your products and customer data' },
        ],
      },
      {
        __component: 'block.testimonials',
        badge: 'Voices',
        heading: 'What Our Cohort Says',
        intro: 'Real reflections from participants of the Innovatrium Cybersecurity Clinic at BNU.',
        items: [
          { quote: 'I came in from a business background with zero coding experience and left able to run a full vulnerability scan. The live scenarios made everything click.', name: 'Menahil Fatima', role: 'Clinic Participant' },
          { quote: 'The mentors treated us like a real security team. Responding to a simulated breach under pressure taught me more than a whole semester of theory.', name: 'Abdul Hadi Jalal', role: 'Clinic Participant' },
          { quote: 'What stayed with me was how welcoming it was to non-technical students. I study design, and I now understand how to build safer products from day one.', name: 'Hania Atta', role: 'Clinic Participant' },
          { quote: 'The clinic gave me the confidence to pursue cybersecurity seriously. The hands-on labs are genuinely industry relevant, not just textbook exercises.', name: 'Manahil Tanweer', role: 'Clinic Participant' },
          { quote: 'Intrusion detection finally made sense once I watched it happen live. The instructors break down complex ideas without dumbing them down.', name: 'Khadija Basit', role: 'Clinic Participant' },
          { quote: 'A perfect mix of theory and practice. By the end I had built a small incident response playbook I still use in my own projects.', name: 'Ahmed Fida', role: 'Clinic Participant' },
          { quote: 'The networking alone was worth it. I met peers and mentors who genuinely care about security, and we still collaborate after the program.', name: 'Maarij Hassan', role: 'Clinic Participant' },
          { quote: 'Secure coding practices changed how I write software. I catch vulnerabilities now before they ever reach production.', name: 'Raybaal Ishtiaq', role: 'Clinic Participant' },
          { quote: 'Backed by Google.org and The Asia Foundation, this clinic feels world class. I would recommend it to anyone curious about defending the digital world.', name: 'Saad Bhatti', role: 'Clinic Participant' },
        ],
      },
      {
        __component: 'block.gallery',
        badge: 'In Action',
        heading: 'Inside the Cybersecurity Clinic',
        intro: 'Highlights from the orientation of our latest cybersecurity cohort at BNU.',
        items: [
          { image: cohort1, caption: 'APAC Cybersecurity orientation, cohort group photo' },
          { image: cohort2, caption: "BNU Cybersecurity Clinic orientation, presenter addressing the 2nd cohort" },
          { image: cohort3, caption: 'BNU Cybersecurity Clinic orientation session, 2nd cohort' },
        ],
      },
      {
        __component: 'block.logos',
        badge: 'Supported By',
        heading: 'Backed by the APAC Cybersecurity Fund',
        intro:
          'This clinic is proudly funded by **Google.org** and **The Asia Foundation** under the **APAC Cybersecurity Fund**, delivered in collaboration with the **Consortium of Cyber Security** and the **Global Cyber Alliance**.',
        logos: [
          { src: googleLogo, alt: 'Google.org' },
          { src: apacLogo, alt: 'APAC Cybersecurity Fund' },
          { src: asiaLogo, alt: 'The Asia Foundation' },
        ],
        logos2: [
          { src: consortiumLogo, alt: 'Consortium of Cyber Security', sizeClass: 'logo-consortium' },
          { src: allianceLogo, alt: 'Global Cyber Alliance', sizeClass: 'logo-alliance' },
        ],
      },
      {
        __component: 'block.custom-html',
        badge: 'Where We Operate',
        heading: 'Our Cyber Clinic Network',
        intro: 'Live in Lahore today, expanding to Islamabad next.',
        items: [
          { label: 'Islamabad', text: 'APAC Cyber Clinic — in progress' },
          { label: 'Lahore', text: "Beaconhouse National University — Pakistan's first Cyber Clinic" },
        ],
      },
      {
        __component: 'block.cta',
        heading: 'Start Your Cyber Journey',
        text: 'Enroll in the next clinic session and level up your digital defense skills.',
        buttonLabel: 'Register Now',
      },
    ],
  };

  await upsertPage('cybersecurity', data);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
