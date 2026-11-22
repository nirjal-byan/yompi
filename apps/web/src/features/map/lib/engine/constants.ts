export const COLORS = {
  sea: 0xf1ebdc,
  land: 0xd8e4bf,
  grid: 0xdcd3bd,
  ink: 0x3b2a26,
  paper: 0xfffdf8,
  accent: 0x2f5d3a,
  trail: 0xffb43e,
  peak: 0x8a6a5c,
  peakHigh: 0xffb43e,
  peakGiant: 0xb23a2e,
  peakEverest: 0xffd34e,
  snow: 0xffffff,
  lake: 0x4f9fc6,
};

export const HIGH_PEAK_ELEVATION_M = 6000;
export const EIGHT_THOUSANDER_ELEVATION_M = 8000;
export const EVEREST_NAME = "Mount Everest";
export const GIANT_PEAK_RADIUS = 12;
export const EVEREST_RADIUS = 16;
export const PRIORITY_PLACES = new Set(["Kathmandu", "Pokhara"]);

export const MAX_LABELS = 70;
export const LABEL_FONT_SIZE = 10.5;
export const LABEL_PADDING_X = 6;
export const LABEL_PADDING_Y = 3;
export const LABEL_MARKER_GAP = 6;

export const PASS_VISIBLE_FROM_ZOOM = 1.8;
export const GATEWAY_VISIBLE_FROM_ZOOM = 2.2;
export const LOW_PEAK_LABEL_FROM_ZOOM = 2.5;

export const MARKER_PICK_RADIUS_PX = 8;
export const TRAIL_PICK_REACH_PX = 9;
export const CLICK_SLOP_PX = 5;

export const MAX_PIXEL_RATIO = 1.5;
export const TERRAIN_MARGIN_WORLD_UNITS = 30;
export const TERRAIN_REFRESH_INTERVAL_MS = 90;

export const LINE_REDRAW_MIN_RATIO = 0.65;
export const LINE_REDRAW_MAX_RATIO = 1.55;
export const LINE_REDRAW_SETTLED_TOLERANCE = 0.06;

export const MIN_ZOOM_FACTOR = 0.7;
export const MAX_ZOOM_FACTOR = 90;
export const FIT_PADDING_PX = 96;
export const FOCUS_PADDING_PX = 160;
export const INTRO_CARD_CLEARANCE_PX = 36;
export const PLACE_FOCUS_ZOOM_FACTOR = 2.5;

export const NARROW_SCREEN_PX = 900;
export const CARD_INSET_PX = { trail: 410, place: 345, intro: 345 };

export const EASING_TIME_MS = 85;
export const EASING_PIXEL_TOLERANCE = 0.05;
export const EASING_ZOOM_TOLERANCE = 5e-4;
export const MOMENTUM_DECAY_MS = 260;
export const MOMENTUM_MIN_SPEED = 0.01;
export const VELOCITY_SMOOTHING = 0.6;
export const RELEASE_IDLE_MS = 80;

export const WHEEL_ZOOM_SPEED = 0.0016;
export const PINCH_WHEEL_ZOOM_SPEED = 0.01;
export const WHEEL_LINE_HEIGHT_PX = 33;
export const KEY_PAN_PX = 120;
export const KEY_ZOOM_FACTOR = 1.5;
export const BUTTON_ZOOM_FACTOR = 1.6;
