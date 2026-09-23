import { Product } from '../types.ts';
import { formatNPR } from '../utils/formatters.ts';

const DEFAULT_TITLE = 'Pandey Mobile Store - Butwal, Nepal';
const DEFAULT_DESC =
  'Pandey Mobile Store is a dedicated smartphone store located at Traffic Chowk, Butwal, Nepal. We specialize in providing a curated selection of both iPhone and Android smartphones with warranty.';
const DEFAULT_IMAGE = 'https://1000logos.net/wp-content/uploads/2017/02/Apple-Logo.png';
const CANONICAL_DOMAIN = 'https://pandeymobile.com.np';

function setMetaTag(nameOrProperty: string, value: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attr = isProperty ? 'property' : 'name';
  let element = document.querySelector(`meta[${attr}="${nameOrProperty}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, nameOrProperty);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

function removeMetaTag(nameOrProperty: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attr = isProperty ? 'property' : 'name';
  const element = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
  if (element) {
    element.remove();
  }
}

function setJsonLdScript(id: string, schemaObj: Record<string, any>) {
  if (typeof document === 'undefined') return;
  let scriptEl = document.getElementById(id) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = id;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(schemaObj, null, 2);
}

function removeJsonLdScript(id: string) {
  if (typeof document === 'undefined') return;
  const scriptEl = document.getElementById(id);
  if (scriptEl) {
    scriptEl.remove();
  }
}

export class SeoService {
  /**
   * Applies specific OpenGraph, Twitter, and Schema.org structured data (BreadcrumbList & Product)
   * for a smartphone product page/modal.
   */
  static setProductSeo(product: Product) {
    if (typeof document === 'undefined' || !product) return;

    const formattedPrice = formatNPR(product.price);
    const productTitle = `${product.name} | ${formattedPrice} - Pandey Mobile Store Butwal`;
    const cleanDesc =
      product.description?.replace(/\s+/g, ' ').trim() ||
      `${product.name} (${product.condition}, ${product.storage || ''}) available at Pandey Mobile Store, Traffic Chowk, Butwal, Nepal. 100% genuine with store warranty.`;
    const truncatedDesc = cleanDesc.length > 160 ? `${cleanDesc.substring(0, 157)}...` : cleanDesc;

    const currentUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/product/${product.id}`
        : `${CANONICAL_DOMAIN}/product/${product.id}`;

    const productImage = product.image || DEFAULT_IMAGE;

    // 1. Title
    document.title = productTitle;

    // 2. Standard Meta Description
    setMetaTag('description', truncatedDesc);

    // 3. OpenGraph Tags (Facebook, WhatsApp, LinkedIn, Viber, Telegram)
    setMetaTag('og:type', 'product', true);
    setMetaTag('og:site_name', 'Pandey Mobile Store', true);
    setMetaTag('og:title', `${product.name} | ${formattedPrice}`, true);
    setMetaTag('og:description', truncatedDesc, true);
    setMetaTag('og:image', productImage, true);
    setMetaTag('og:image:alt', product.name, true);
    setMetaTag('og:url', currentUrl, true);
    setMetaTag('product:price:amount', product.price.toString(), true);
    setMetaTag('product:price:currency', 'NPR', true);
    setMetaTag(
      'product:availability',
      product.availability === 'Out of Stock' ? 'out of stock' : 'in stock',
      true
    );
    setMetaTag('product:condition', product.condition.toLowerCase(), true);
    setMetaTag('product:brand', product.brand, true);
    setMetaTag('product:retailer_item_id', product.id, true);

    // 4. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', `${product.name} | ${formattedPrice}`);
    setMetaTag('twitter:description', truncatedDesc);
    setMetaTag('twitter:image', productImage);
    setMetaTag('twitter:image:alt', product.name);

    // 5. Schema.org BreadcrumbList Structured Data
    const categoryName = product.category || (product.brand === 'Apple' ? 'iPhone' : 'Smartphones');
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${CANONICAL_DOMAIN}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryName,
          item: `${CANONICAL_DOMAIN}/#products-section`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: `${CANONICAL_DOMAIN}/product/${product.id}`
        }
      ]
    };
    setJsonLdScript('product-breadcrumb-schema', breadcrumbSchema);

    // 6. Schema.org Product Structured Data
    const allImages: string[] = [productImage];
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !allImages.includes(img)) allImages.push(img);
      });
    }

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: allImages,
      description: cleanDesc,
      sku: product.id,
      mpn: product.id,
      brand: {
        '@type': 'Brand',
        name: product.brand
      },
      category: categoryName,
      offers: {
        '@type': 'Offer',
        url: currentUrl,
        priceCurrency: 'NPR',
        price: product.price,
        priceValidUntil: '2027-12-31',
        itemCondition:
          product.condition === 'New'
            ? 'https://schema.org/NewCondition'
            : 'https://schema.org/UsedCondition',
        availability:
          product.availability === 'Out of Stock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
        seller: {
          '@type': 'MobilePhoneStore',
          name: 'Pandey Mobile Store',
          telephone: '+977-9847460603',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Hospital Line / Traffic Chowk, Opposite Lumbini Provincial Hospital',
            addressLocality: 'Butwal',
            addressRegion: 'Lumbini Province',
            postalCode: '32907',
            addressCountry: 'NP'
          }
        }
      }
    };
    setJsonLdScript('product-structured-data-schema', productSchema);
  }

  /**
   * Restores default OpenGraph, Twitter, and Schema tags when exiting a product view.
   */
  static resetToDefaultSeo() {
    if (typeof document === 'undefined') return;

    document.title = DEFAULT_TITLE;
    setMetaTag('description', DEFAULT_DESC);

    // Reset OG Tags
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:title', DEFAULT_TITLE, true);
    setMetaTag('og:description', DEFAULT_DESC, true);
    setMetaTag('og:image', DEFAULT_IMAGE, true);
    setMetaTag('og:url', `${CANONICAL_DOMAIN}/`, true);
    removeMetaTag('product:price:amount', true);
    removeMetaTag('product:price:currency', true);
    removeMetaTag('product:availability', true);
    removeMetaTag('product:condition', true);
    removeMetaTag('product:brand', true);
    removeMetaTag('product:retailer_item_id', true);

    // Reset Twitter Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', DEFAULT_TITLE);
    setMetaTag('twitter:description', 'Certified smartphones, pre-owned iPhones, express repair lab, and trade-in exchange in Butwal, Nepal.');
    setMetaTag('twitter:image', DEFAULT_IMAGE);

    // Remove product schemas
    removeJsonLdScript('product-breadcrumb-schema');
    removeJsonLdScript('product-structured-data-schema');
  }
}
