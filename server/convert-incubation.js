/* ==========================================================================
   convert-incubation.js — one-off: populate the Strapi "incubation" page
   with its full block content (converted from the hand-coded HTML) and flip
   isGenerated to true so generate.js starts writing incubation.html.
   Run once: node convert-incubation.js
   ========================================================================== */
'use strict';

const { upsertPage } = require('./lib/strapi-client');

const data = {
  navLabel: 'Incubation',
  slug: 'incubation',
  order: 1,
  isHomepage: false,
  isGenerated: true,
  theme: { primary: '#A8D5BA', primaryDark: '#2F9E5B' },
  hero: {
    badge: 'Program',
    title: 'Incubation Program',
    subtitle:
      'Where bright ideas take flight. Transform your startup vision into a scalable venture with our comprehensive support ecosystem.',
  },
  application: {
    formUrl: 'https://forms.gle/Z33pWTSrQTUqCgvP8',
    deadline: '2025-10-15',
    status: 'closed',
  },
  blocks: [
    {
      __component: 'block.rich-text',
      align: 'left',
      heading: 'Program Overview',
      body:
        'The Innovatrium Incubation Program provides early-stage startups with the fundamental resources required to succeed. Over our comprehensive **6-month program**, we surround you with mentors, offer state-of-the-art office space, and introduce you to our extensive investor network.',
    },
    {
      __component: 'block.card-grid',
      styleKey: 'features',
      cards: [
        { icon: 'fas fa-chalkboard-teacher', title: 'Expert Mentorship', text: 'Get guided by industry veterans who have successfully navigated the entrepreneurial journey. Weekly 1-on-1 sessions.' },
        { icon: 'fas fa-building', title: 'Premium Workspace', text: 'Work from the vibrant BNU incubator space featuring 24/7 access, high-speed internet, and collaborative zones.' },
        { icon: 'fas fa-handshake', title: 'Networking and Funding', text: 'Connect with a thriving community of fellow founders, industry experts, investors, and potential co-founders.' },
      ],
    },
    {
      __component: 'block.card-grid',
      styleKey: 'startups',
      badge: 'Success Stories',
      heading: 'Our Startups',
      intro: 'Real ventures built inside Innovatrium that are now solving real problems and reaching real customers.',
      cards: [
        {
          icon: 'fas fa-shield-heart',
          title: 'Umeed-E-Zann',
          tag: "Women's Safety App",
          text: "Pakistan's first digital ecosystem built by women, for women. A mobile app that puts safety, support, and community within reach, designed around the real needs of the women it serves.",
          badgeIcon: 'fas fa-venus',
          badgeLabel: 'Built by Women, for Women',
        },
        {
          icon: 'fas fa-bullseye',
          title: 'ShopIQ',
          tag: 'Smart Retail Advertising',
          text: 'Personalized physical ads that adapt to each shopper by gender and age. A lightweight, browser-friendly solution that runs smoothly on the web, bringing data-driven targeting to in-store screens.',
          badgeIcon: 'fas fa-bolt',
          badgeLabel: 'Web-Native and Lightweight',
        },
      ],
    },
    {
      __component: 'block.steps',
      badge: 'Your Journey',
      heading: 'Program Timeline',
      steps: [
        { title: 'Month 1 to 2', text: 'Idea validation, market research, and mentor matching' },
        { title: 'Month 3 to 4', text: 'Product development, pilot testing, and iteration' },
        { title: 'Month 5 to 6', text: 'Pitch prep, investor introductions, and demo day' },
      ],
    },
    {
      __component: 'block.cta',
      heading: 'Ready to Launch?',
      text: 'Applications for the next cohort are open. Register your interest to secure a spot.',
      buttonLabel: 'Apply Now',
    },
  ],
};

upsertPage('incubation', data).catch((err) => {
  console.error(err);
  process.exit(1);
});
