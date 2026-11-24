import type { Schema, Struct } from '@strapi/strapi';

export interface BlockCardGrid extends Struct.ComponentSchema {
  collectionName: 'components_block_card_grids';
  info: {
    displayName: 'Card Grid';
    icon: 'grid';
  };
  attributes: {
    badge: Schema.Attribute.String;
    cards: Schema.Attribute.Component<'shared.card', true>;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    styleKey: Schema.Attribute.String;
  };
}

export interface BlockCta extends Struct.ComponentSchema {
  collectionName: 'components_block_ctas';
  info: {
    displayName: 'CTA';
    icon: 'cursor';
  };
  attributes: {
    buttonHref: Schema.Attribute.String;
    buttonLabel: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    styleKey: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface BlockCustomHtml extends Struct.ComponentSchema {
  collectionName: 'components_block_custom_htmls';
  info: {
    displayName: 'Custom HTML Fragment';
    icon: 'code';
  };
  attributes: {
    badge: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'shared.label-text', true>;
    note: Schema.Attribute.String;
  };
}

export interface BlockGallery extends Struct.ComponentSchema {
  collectionName: 'components_block_galleries';
  info: {
    displayName: 'Gallery';
    icon: 'picture';
  };
  attributes: {
    badge: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'shared.gallery-item', true>;
  };
}

export interface BlockHighlight extends Struct.ComponentSchema {
  collectionName: 'components_block_highlights';
  info: {
    displayName: 'Highlight';
    icon: 'star';
  };
  attributes: {
    badge: Schema.Attribute.String;
    buttonLabel: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    items: Schema.Attribute.Component<'shared.checklist-item', true>;
    text: Schema.Attribute.Text;
  };
}

export interface BlockLogos extends Struct.ComponentSchema {
  collectionName: 'components_block_logos';
  info: {
    displayName: 'Logos';
    icon: 'picture';
  };
  attributes: {
    badge: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    logos: Schema.Attribute.Component<'shared.logo-item', true>;
    logos2: Schema.Attribute.Component<'shared.logo-item', true>;
  };
}

export interface BlockRichText extends Struct.ComponentSchema {
  collectionName: 'components_block_rich_texts';
  info: {
    displayName: 'Rich Text';
    icon: 'align-left';
  };
  attributes: {
    align: Schema.Attribute.Enumeration<['left', 'center']> &
      Schema.Attribute.DefaultTo<'left'>;
    badge: Schema.Attribute.String;
    body: Schema.Attribute.RichText;
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.checklist-item', true>;
    reverse: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tileIcon: Schema.Attribute.String;
  };
}

export interface BlockStats extends Struct.ComponentSchema {
  collectionName: 'components_block_stats';
  info: {
    displayName: 'Stats';
    icon: 'chart-pie';
  };
  attributes: {
    badge: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'shared.stat-cell', true>;
    linkHref: Schema.Attribute.String;
    linkLabel: Schema.Attribute.String;
  };
}

export interface BlockSteps extends Struct.ComponentSchema {
  collectionName: 'components_block_steps';
  info: {
    displayName: 'Steps';
    icon: 'bulletList';
  };
  attributes: {
    badge: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    steps: Schema.Attribute.Component<'shared.step', true>;
    styleKey: Schema.Attribute.String;
  };
}

export interface BlockTestimonials extends Struct.ComponentSchema {
  collectionName: 'components_block_testimonials';
  info: {
    displayName: 'Testimonials';
    icon: 'quote';
  };
  attributes: {
    badge: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'shared.testimonial', true>;
  };
}

export interface SharedApplicationInfo extends Struct.ComponentSchema {
  collectionName: 'components_shared_application_infos';
  info: {
    displayName: 'Application Info';
    icon: 'calendar';
  };
  attributes: {
    deadline: Schema.Attribute.Date;
    formUrl: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<['open', 'closed']> &
      Schema.Attribute.DefaultTo<'open'>;
  };
}

export interface SharedCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_cards';
  info: {
    displayName: 'Card';
    icon: 'layer';
  };
  attributes: {
    badgeIcon: Schema.Attribute.String;
    badgeLabel: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    tag: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedChecklistItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_checklist_items';
  info: {
    displayName: 'Checklist Item';
    icon: 'check';
  };
  attributes: {
    text: Schema.Attribute.String;
  };
}

export interface SharedGalleryItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_gallery_items';
  info: {
    displayName: 'Gallery Item';
    icon: 'picture';
  };
  attributes: {
    caption: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedLabelText extends Struct.ComponentSchema {
  collectionName: 'components_shared_label_texts';
  info: {
    displayName: 'Label Text';
    icon: 'layer';
  };
  attributes: {
    label: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface SharedLogoItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_logo_items';
  info: {
    displayName: 'Logo Item';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String;
    mono: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    sizeClass: Schema.Attribute.String;
    src: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedPageHero extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_heroes';
  info: {
    displayName: 'Page Hero';
    icon: 'landscape';
  };
  attributes: {
    accentText: Schema.Attribute.String;
    badge: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedPageTheme extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_themes';
  info: {
    displayName: 'Page Theme';
    icon: 'palette';
  };
  attributes: {
    primary: Schema.Attribute.String;
    primaryDark: Schema.Attribute.String;
  };
}

export interface SharedSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'Social Links';
    icon: 'share-alt';
  };
  attributes: {
    facebook: Schema.Attribute.String;
    instagram: Schema.Attribute.String;
    linkedin: Schema.Attribute.String;
  };
}

export interface SharedStatCell extends Struct.ComponentSchema {
  collectionName: 'components_shared_stat_cells';
  info: {
    displayName: 'Stat Cell';
    icon: 'chart-pie';
  };
  attributes: {
    label: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SharedStep extends Struct.ComponentSchema {
  collectionName: 'components_shared_steps';
  info: {
    displayName: 'Step';
    icon: 'list';
  };
  attributes: {
    icon: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_shared_testimonials';
  info: {
    displayName: 'Testimonial';
    icon: 'quote';
  };
  attributes: {
    name: Schema.Attribute.String;
    quote: Schema.Attribute.Text;
    role: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'block.card-grid': BlockCardGrid;
      'block.cta': BlockCta;
      'block.custom-html': BlockCustomHtml;
      'block.gallery': BlockGallery;
      'block.highlight': BlockHighlight;
      'block.logos': BlockLogos;
      'block.rich-text': BlockRichText;
      'block.stats': BlockStats;
      'block.steps': BlockSteps;
      'block.testimonials': BlockTestimonials;
      'shared.application-info': SharedApplicationInfo;
      'shared.card': SharedCard;
      'shared.checklist-item': SharedChecklistItem;
      'shared.gallery-item': SharedGalleryItem;
      'shared.label-text': SharedLabelText;
      'shared.logo-item': SharedLogoItem;
      'shared.page-hero': SharedPageHero;
      'shared.page-theme': SharedPageTheme;
      'shared.social-links': SharedSocialLinks;
      'shared.stat-cell': SharedStatCell;
      'shared.step': SharedStep;
      'shared.testimonial': SharedTestimonial;
    }
  }
}
