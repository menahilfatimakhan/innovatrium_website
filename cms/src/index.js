'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const existing = await strapi.db
      .query('admin::api-token')
      .findMany({ where: { name: 'site-generator' } });
    if (existing.length === 0) {
      const token = await strapi.service('admin::api-token').create({
        name: 'site-generator',
        description: 'Used by server/generate.js to fetch content for static site regeneration',
        type: 'full-access',
        kind: 'content-api',
        lifespan: null,
      });
      strapi.log.warn(`[bootstrap] Created API token "site-generator" — accessKey: ${token.accessKey}`);
    }
  },
};
