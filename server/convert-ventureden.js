/* ==========================================================================
   convert-ventureden.js — one-off: populate the Strapi "ventureden" page
   with its full block content (converted from the hand-coded HTML) and flip
   isGenerated to true so generate.js starts writing ventureden.html.
   Run once: node convert-ventureden.js
   ========================================================================== */
'use strict';

const { upsertPage } = require('./lib/strapi-client');

const data = {
  navLabel: 'Venture Den',
  slug: 'ventureden',
  order: 4,
  isHomepage: false,
  isGenerated: true,
  theme: { primary: '#49B96B', primaryDark: '#2F9E5B' },
  hero: {
    badge: 'Marketplace',
    title: 'Venture Den',
    subtitle:
      'A dynamic marketplace where startups, students, and small businesses showcase and sell their products, and connect with real customers.',
  },
  application: {
    formUrl: 'https://forms.gle/REPLACE_WITH_VENTURE_DEN_FORM',
    deadline: '2025-11-30',
    status: 'open',
  },
  blocks: [
    {
      __component: 'block.rich-text',
      align: 'center',
      badge: 'About',
      heading: 'Where Ventures Meet Customers',
      body:
        'Venture Den is a dynamic marketplace and entrepreneurial platform that empowers startups, students, and small businesses to showcase and sell their products. We connect innovative ideas with real customers by providing a space where entrepreneurs can grow, validate their businesses, and build meaningful connections. At Venture Den, we believe every great venture deserves an opportunity to thrive.',
    },
    {
      __component: 'block.steps',
      heading: 'The Venture Den Journey',
      intro: 'Four steps from application to a thriving stall at Venture Den.',
      steps: [
        { icon: 'fas fa-file-signature', title: '1. Apply to Venture Den', text: "Submit your application with details about your business, products, and brand. Our team reviews each application to ensure it aligns with Venture Den's vision and quality standards." },
        { icon: 'fas fa-store', title: '2. Selection and Stall Allocation', text: 'Selected entrepreneurs are notified and assigned exhibition space based on product category, availability, and event requirements. Participants also receive event guidelines and setup instructions.' },
        { icon: 'fas fa-cash-register', title: '3. Showcase and Sell', text: 'Set up your stall at Venture Den and present your products to the BNU community. Engage with customers, build your brand, receive valuable feedback, and generate sales.' },
        { icon: 'fas fa-seedling', title: '4. Grow Your Venture', text: 'Leverage the exposure, customer insights, and networking opportunities gained through Venture Den to refine your business, expand your reach, and prepare for future entrepreneurial opportunities.' },
      ],
    },
    {
      __component: 'block.card-grid',
      styleKey: 'ventures',
      badge: 'Success Stories',
      heading: 'Our Successful Ventures',
      intro: 'Real businesses that found their customers at Venture Den.',
      cards: [
        { icon: 'fas fa-spray-can-sparkles', title: 'Mistify', tag: 'Perfume Vending Machine', text: 'Bringing signature scents to shoppers on demand through a smart, self-service perfume vending experience.' },
        { icon: 'fas fa-bottle-droplet', title: 'Loralai', tag: 'Natural Olive Oil Company', text: 'Cold-pressed, natural olive oil sourced with care, bringing pure and healthy flavour to every kitchen.' },
        { icon: 'fas fa-cake-candles', title: 'Piece of Cake', tag: 'Home-Made Bakery', text: 'Freshly baked, home-made treats and bakery items crafted to order for every celebration and craving.' },
      ],
    },
    {
      __component: 'block.card-grid',
      styleKey: 'benefits',
      badge: 'Benefits',
      heading: 'Why Sell at Venture Den',
      cards: [
        { icon: 'fas fa-cash-register', title: 'Real Sales', text: 'Sell directly to the BNU community and generate real revenue from day one' },
        { icon: 'fas fa-comments', title: 'Customer Feedback', text: 'Validate your product with honest, face-to-face feedback from real buyers' },
        { icon: 'fas fa-bullhorn', title: 'Brand Exposure', text: 'Put your brand in front of hundreds of students, staff, and visitors' },
        { icon: 'fas fa-people-arrows', title: 'Networking', text: 'Connect with fellow founders, mentors, and potential partners and customers' },
      ],
    },
    {
      __component: 'block.cta',
      heading: 'Your Venture. Our Marketplace.',
      text: 'Apply now to secure your stall and start selling to real customers at Venture Den.',
      buttonLabel: 'Apply to Venture Den',
    },
  ],
};

upsertPage('ventureden', data).catch((err) => {
  console.error(err);
  process.exit(1);
});
