export interface PeakFacts {
  heightM: number;
  worldRank: number;
  borders: string;
  firstAscent: { date: string; climbers: string };
  firstWinterAscent?: { date: string; climbers: string };
}

export const EIGHT_THOUSANDER_SOURCE = {
  name: "Wikipedia: Eight-thousander",
  url: "https://en.wikipedia.org/wiki/Eight-thousander",
  checkedOn: "2026-11-22",
};

export const EIGHT_THOUSANDERS_TOTAL = 14;

export const PEAK_FACTS: Record<string, PeakFacts> = {
  "Mount Everest": {
    heightM: 8849,
    worldRank: 1,
    borders: "Nepal and China",
    firstAscent: { date: "29 May 1953", climbers: "Edmund Hillary and Tenzing Norgay" },
    firstWinterAscent: {
      date: "17 February 1980",
      climbers: "Krzysztof Wielicki and Leszek Cichy",
    },
  },
  Kangchenjunga: {
    heightM: 8586,
    worldRank: 3,
    borders: "Nepal and India",
    firstAscent: { date: "25 May 1955", climbers: "George Band and Joe Brown" },
  },
  Lhotse: {
    heightM: 8516,
    worldRank: 4,
    borders: "Nepal and China",
    firstAscent: { date: "18 May 1956", climbers: "Fritz Luchsinger and Ernst Reiss" },
  },
  Makalu: {
    heightM: 8485,
    worldRank: 5,
    borders: "Nepal and China",
    firstAscent: { date: "15 May 1955", climbers: "Jean Couzy and Lionel Terray" },
  },
  "Cho Oyu": {
    heightM: 8188,
    worldRank: 6,
    borders: "Nepal and China",
    firstAscent: {
      date: "19 October 1954",
      climbers: "Joseph Joechler, Pasang Dawa Lama and Herbert Tichy",
    },
  },
  Dhaulagiri: {
    heightM: 8167,
    worldRank: 7,
    borders: "Nepal",
    firstAscent: {
      date: "13 May 1960",
      climbers:
        "Kurt Diemberger, Peter Diener, Nawang Dorje, Nima Dorje, Ernst Forrer and Albin Schelbert",
    },
  },
  Manaslu: {
    heightM: 8163,
    worldRank: 8,
    borders: "Nepal",
    firstAscent: { date: "9 May 1956", climbers: "Toshio Imanishi and Gyalzen Norbu" },
  },
  "Annapurna I": {
    heightM: 8091,
    worldRank: 10,
    borders: "Nepal",
    firstAscent: { date: "3 June 1950", climbers: "Maurice Herzog and Louis Lachenal" },
  },
};
