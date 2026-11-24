/* ==========================================================================
   convert-skilltoearn.js — one-off: populate the Strapi "skilltoearn" page
   with its full block content (converted from the hand-coded HTML) and flip
   isGenerated to true so generate.js starts writing skilltoearn.html.
   Run once: node convert-skilltoearn.js
   ========================================================================== */
'use strict';

const { upsertPage } = require('./lib/strapi-client');

const data = {
  navLabel: 'Skill to Earn',
  slug: 'skilltoearn',
  order: 3,
  isHomepage: false,
  isGenerated: true,
  theme: { primary: '#2A9D8F', primaryDark: '#1F7A70' },
  hero: {
    badge: 'Program',
    title: 'Skill to Earn Program',
    subtitle:
      'Master high-demand technical skills and jumpstart your career through immediate freelancing and earning pathways.',
  },
  application: {
    formUrl: 'https://forms.gle/oFdWpoyjSpQq7Yb38',
    deadline: '2025-11-15',
    status: 'open',
  },
  blocks: [
    {
      __component: 'block.rich-text',
      align: 'center',
      heading: 'Fast-Track Your Tech Career',
      body:
        'The Skill to Earn program is intensive and outcome-driven. We provide accelerated learning in high-demand areas so you can quickly build a portfolio, start freelancing, or land a well-paying tech job. Our curriculum bridges the gap between academics and industry.',
    },
    {
      __component: 'block.card-grid',
      badge: 'What We Offer',
      heading: 'Available Tracks',
      cards: [
        { icon: 'fas fa-code', title: 'Full Stack Web Dev', text: 'Learn modern frameworks, design systems, and backend architectures.' },
        { icon: 'fas fa-mobile-screen-button', title: 'App Development', text: 'Build native and cross-platform mobile apps for iOS and Android.' },
        { icon: 'fas fa-pen-nib', title: 'UI/UX Design', text: 'Master user research, wireframing, and interactive prototyping.' },
        { icon: 'fas fa-brain', title: 'AI and Machine Learning', text: 'Dive into data science, generative AI, and automation workflows.' },
      ],
    },
    {
      __component: 'block.steps',
      heading: 'How It Works',
      steps: [
        { title: 'Pick a Track', text: 'Choose from our in-demand tracks based on your career goals' },
        { title: 'Learn and Build', text: 'Intensive bootcamp-style learning with real projects for your portfolio' },
        { title: 'Start Earning', text: 'Begin freelancing or land a job with our placement support network' },
      ],
    },
    {
      __component: 'block.cta',
      heading: 'Join the Next Bootcamp',
      text: 'Turn your new skills into income within weeks.',
      buttonLabel: 'Enroll Now',
    },
  ],
};

upsertPage('skilltoearn', data).catch((err) => {
  console.error(err);
  process.exit(1);
});
