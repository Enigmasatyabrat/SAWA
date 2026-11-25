/**
 * Openly licensed photographs used on the site, with the credit each licence
 * requires. Files live in public/photos; credits.json there is the raw record.
 */
export type SitePhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  title: string;
  author?: string;
  licence: string;
  licenceUrl: string;
  source: string;
};

export const PHOTOS = {
  ploughedField: {
    src: "/photos/ploughed-field.jpg", width: 1600, height: 1062,
    alt: "Rows of freshly ploughed brown soil stretching to a misty tree line in India",
    caption: "A ploughed field in India, ready for sowing.",
    title: "Ploughed field in India", author: "Ninara",
    licence: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Ploughed_field_in_India.jpg",
  },
  ploughingBengal: {
    src: "/photos/ploughing-west-bengal.jpg", width: 1600, height: 1020,
    alt: "A farmer ploughing a field with two white oxen in West Bengal",
    caption: "Ploughing with cattle in West Bengal.",
    title: "Ploughing with cattle in West Bengal", author: "ILRI",
    licence: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "https://commons.wikimedia.org/w/index.php?curid=12881015",
  },
  soilCloseUp: {
    src: "/photos/soil-close-up.webp", width: 1024, height: 768,
    alt: "Close-up of dry, crumbly farm soil filling the whole frame",
    caption: "A good input: bare soil filling the frame, in even daylight.",
    title: "Farm land soil close up",
    licence: "CC0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    source: "https://www.rawpixel.com/image/6029523/photo-image-public-domain-nature-free",
  },
  soilProfilingIndia: {
    src: "/photos/soil-profiling-india.jpg", width: 1920, height: 1267,
    alt: "Three people recording a soil profile inside a dug pit with a measuring rod in India",
    caption: "Soil scientists profiling a pit in India. Lab and field work remain the reference SAWA is checked against.",
    title: "CSIRO ScienceImage 712 Soil Profiling India", author: "T. Grove, CSIRO",
    licence: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/",
    source: "https://commons.wikimedia.org/w/index.php?curid=35440476",
  },
  redFerrosol: {
    src: "/photos/red-ferrosol-profile.jpg", width: 1600, height: 1334,
    alt: "A deep red soil profile next to a measuring scale, beside the green landscape it comes from",
    caption: "A red ferrosol profile in Queensland, Australia: colour tracks iron and organic matter, which is why SAWA reads colour first.",
    title: "CSIRO ScienceImage 4284 Red Ferrosol soil profile, Atherton Tablelands", author: "Ray Isbell, CSIRO",
    licence: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/",
    source: "https://commons.wikimedia.org/w/index.php?curid=35481334",
  },
  terracedRice: {
    src: "/photos/terraced-rice-sikkim.jpg", width: 1600, height: 1071,
    alt: "Green terraced rice fields on a hillside in Sikkim under a cloudy sky",
    caption: "Terraced rice fields in Sikkim. The goal: matching crops to soil that is measured, not guessed.",
    title: "Terraced rice fields of Sikkim India", author: "Anja Disseldorp",
    licence: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/w/index.php?curid=33403925",
  },
} satisfies Record<string, SitePhoto>;
