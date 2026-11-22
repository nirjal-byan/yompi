import type { MapLayers } from "./types";

export const ALL_LAYERS_ON: MapLayers = {
  terrain: true,
  peaks: true,
  lakes: true,
  passes: true,
  trails: true,
  places: true,
};

export type FeatureLayerKey = Exclude<keyof MapLayers, "terrain">;

export const FEATURE_LAYER_KEYS: FeatureLayerKey[] = [
  "peaks",
  "lakes",
  "passes",
  "trails",
  "places",
];

export function areAllFeaturesShown(layers: MapLayers): boolean {
  return FEATURE_LAYER_KEYS.every((key) => layers[key]);
}

export function showAllFeatures(layers: MapLayers): MapLayers {
  return { ...layers, ...ALL_LAYERS_ON, terrain: layers.terrain };
}

export function toggleLayer(layers: MapLayers, key: keyof MapLayers): MapLayers {
  if (key === "terrain") return { ...layers, terrain: !layers.terrain };

  const onlyThisFeature = FEATURE_LAYER_KEYS.reduce(
    (focused, featureKey) => ({ ...focused, [featureKey]: featureKey === key }),
    { ...layers },
  );
  if (areAllFeaturesShown(layers)) return onlyThisFeature;

  const toggled = { ...layers, [key]: !layers[key] };

  return FEATURE_LAYER_KEYS.some((featureKey) => toggled[featureKey])
    ? toggled
    : showAllFeatures(layers);
}
