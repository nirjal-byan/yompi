export interface ImageCredit {
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string | null;
}

export const TREK_IMAGE_CREDITS: Record<string, ImageCredit> = {
  "annapurna-base-camp": {
    author: "Poonhillguide",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Annapurna_base_camp_trek.jpg",
  },
  "annapurna-circuit": {
    author: "AjayKumarShrestha",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Way_to_Thorong_La.JPG",
  },
  "manaslu-circuit": {
    author: "Lukas Kolisko",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Manaslu_circuit_trek.jpg",
  },
  "langtang-valley": {
    author: "Pustam.EGR",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Langtang_Mountains_and_Trail.jpg",
  },
  "mardi-himal": {
    author: "Nrik kiran",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mardi_Himal_basecamp_panorama.jpg",
  },
  "manang-trek": {
    author: "Solundir",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Manang_Annapurna3_Gangapurna.jpg",
  },
  "everest-base-camp": {
    author: "Nepal Trek Adventures",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:View_of_Mount_Everest_from_Syangboche_Village,_during_Everest_Base_Camp_Trek_in_2023.jpg",
  },
};
