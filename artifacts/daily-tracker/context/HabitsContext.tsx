import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SubHabit {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  iconSet: "MaterialCommunityIcons" | "Ionicons";
  color: string;
  group: "Body" | "Productivity" | "Home" | "Lifestyle";
  subHabits: SubHabit[];
  isCustom?: boolean;
}

interface HabitsContextValue {
  habits: Habit[];
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  addCustomHabit: (name: string, icon: string, color: string) => void;
  removeHabit: (id: string) => void;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);
const CUSTOM_KEY = "@trace_custom_habits_v1";
const FAVORITES_KEY = "@trace_favorites_v1";

// ── Soft UI desaturated pastel palette ──────────────────────────────────────
// Sage Green family:      #8aaf98  #78a085  #9abf8a  #7a9f88
// Pale Terracotta family: #c49070  #b48060  #d4a080  #c0886a
// Muted Periwinkle family:#8fa3c2  #7f93b2  #9fb3d2  #7090b0
// Soft Lavender family:   #a8a0c8  #9890b8  #b8b0d8  #8878b0
// Warm Taupe family:      #a8927a  #988272  #b8a28a  #987060
// Dusty Pink family:      #c8a0ae  #b8909e  #d8b0be  #c090a0
// Muted Amber family:     #c0a870  #b09860  #d0b880  #a08858
// Slate Blue family:      #8090a8  #7080a8  #90a0b8  #6878a0
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_HABITS: Habit[] = [
  // ── Body ──────────────────────────────────────────────────────────────
  {
    id: "shower",
    name: "Shower",
    icon: "shower",
    iconSet: "MaterialCommunityIcons",
    color: "#8fa3c2",
    group: "Body",
    subHabits: [
      { id: "shower_quick",   label: "Quick rinse",     icon: "lightning-bolt",             color: "#8fa3c2" },
      { id: "shower_full",    label: "Full shower",     icon: "shower-head",                color: "#7f93b2" },
      { id: "shower_hair",    label: "Hair wash",       icon: "hair-dryer-outline",         color: "#9fb3d2" },
      { id: "shower_skin",    label: "Skincare",        icon: "face-woman-shimmer-outline", color: "#c8a0ae" },
      { id: "shower_am",      label: "Morning routine", icon: "weather-sunny",              color: "#c0a870" },
      { id: "shower_pm",      label: "Night routine",   icon: "weather-night",              color: "#a8a0c8" },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    icon: "toilet",
    iconSet: "MaterialCommunityIcons",
    color: "#8fa3c2",
    group: "Body",
    subHabits: [
      { id: "bath_toilet",    label: "Toilet",           icon: "toilet",               color: "#8fa3c2" },
      { id: "bath_teeth",     label: "Brush teeth",      icon: "toothbrush",           color: "#9fb3d2" },
      { id: "bath_face",      label: "Wash face",        icon: "face-wash",            color: "#7f93b2" },
      { id: "bath_groom",     label: "Grooming",         icon: "content-cut",          color: "#a8927a" },
      { id: "bath_menstrual", label: "Menstrual care",   icon: "flower-tulip-outline", color: "#c8a0ae" },
      { id: "bath_hygiene",   label: "Hygiene routine",  icon: "hand-wash",            color: "#8fa3c2" },
    ],
  },
  {
    id: "eating",
    name: "Eating",
    icon: "silverware-fork-knife",
    iconSet: "MaterialCommunityIcons",
    color: "#c49070",
    group: "Body",
    subHabits: [
      { id: "eat_breakfast",  label: "Breakfast",    icon: "coffee",                 color: "#c0a870" },
      { id: "eat_lunch",      label: "Lunch",        icon: "food",                   color: "#c49070" },
      { id: "eat_dinner",     label: "Dinner",       icon: "silverware-fork-knife",  color: "#b48060" },
      { id: "eat_snack",      label: "Snack",        icon: "food-apple-outline",     color: "#d4a080" },
      { id: "eat_dessert",    label: "Dessert",      icon: "cake-variant-outline",   color: "#c8a0ae" },
      { id: "eat_out",        label: "Eating out",   icon: "storefront-outline",     color: "#c0886a" },
      { id: "eat_prep",       label: "Meal prep",    icon: "pot-steam-outline",      color: "#b09870" },
      { id: "eat_healthy",    label: "Healthy meal", icon: "leaf",                   color: "#8aaf98" },
    ],
  },
  {
    id: "drinking_water",
    name: "Drinking water",
    icon: "water",
    iconSet: "MaterialCommunityIcons",
    color: "#7fa8d8",
    group: "Body",
    subHabits: [
      { id: "water_small",  label: "Small glass",        icon: "cup-water",           color: "#9fb3d2" },
      { id: "water_bottle", label: "Bottle finished",    icon: "bottle-soda-outline", color: "#7fa8d8" },
      { id: "water_elec",   label: "Electrolytes",       icon: "lightning-bolt",      color: "#8fa3c2" },
      { id: "water_remind", label: "Hydration reminder", icon: "bell-outline",        color: "#a8a0c8" },
    ],
  },
  {
    id: "sleeping",
    name: "Sleeping",
    icon: "sleep",
    iconSet: "MaterialCommunityIcons",
    color: "#a8a0c8",
    group: "Body",
    subHabits: [
      { id: "sleep_night",   label: "Night sleep",   icon: "weather-night",        color: "#9890b8" },
      { id: "sleep_nap",     label: "Nap",           icon: "pillow",               color: "#b8b0d8" },
      { id: "sleep_deep",    label: "Deep sleep",    icon: "power-sleep",          color: "#8878b0" },
      { id: "sleep_broken",  label: "Interrupted",   icon: "alert-circle-outline", color: "#c8a0ae" },
      { id: "sleep_early",   label: "Early sleep",   icon: "weather-sunset",       color: "#c0a870" },
      { id: "sleep_late",    label: "Late sleep",    icon: "clock-outline",        color: "#a8a0c8" },
    ],
  },
  {
    id: "stretching",
    name: "Stretching",
    icon: "human-handsup",
    iconSet: "MaterialCommunityIcons",
    color: "#a8927a",
    group: "Body",
    subHabits: [
      { id: "stretch_am",   label: "Morning stretch", icon: "weather-sunny",    color: "#c0a870" },
      { id: "stretch_post", label: "Post-workout",    icon: "run",              color: "#8aaf98" },
      { id: "stretch_neck", label: "Neck & back",     icon: "human",            color: "#a8927a" },
      { id: "stretch_full", label: "Full body",       icon: "human-handsup",    color: "#b8a28a" },
      { id: "stretch_yoga", label: "Yoga flow",       icon: "yoga",             color: "#b8b0d8" },
      { id: "stretch_mob",  label: "Mobility drill",  icon: "arm-flex-outline", color: "#8aaf98" },
    ],
  },
  {
    id: "exercise",
    name: "Exercise",
    icon: "run",
    iconSet: "MaterialCommunityIcons",
    color: "#8aaf98",
    group: "Body",
    subHabits: [
      { id: "ex_cardio",   label: "Cardio",        icon: "heart-pulse",      color: "#c8a0ae" },
      { id: "ex_strength", label: "Strength",      icon: "weight-lifter",    color: "#8aaf98" },
      { id: "ex_hiit",     label: "HIIT",          icon: "lightning-bolt",   color: "#c0a870" },
      { id: "ex_home",     label: "Home workout",  icon: "home-outline",     color: "#9fb3d2" },
      { id: "ex_gym",      label: "Gym workout",   icon: "dumbbell",         color: "#8090a8" },
      { id: "ex_sports",   label: "Sports",        icon: "basketball",       color: "#c0a870" },
      { id: "ex_mobility", label: "Mobility",      icon: "arm-flex-outline", color: "#78a085" },
      { id: "ex_recovery", label: "Recovery",      icon: "meditation",       color: "#a8a0c8" },
    ],
  },
  {
    id: "medication",
    name: "Medication",
    icon: "pill",
    iconSet: "MaterialCommunityIcons",
    color: "#b0a4c8",
    group: "Body",
    subHabits: [
      { id: "med_am",     label: "Morning meds",  icon: "weather-sunny",      color: "#c0a870" },
      { id: "med_pm",     label: "Night meds",    icon: "weather-night",      color: "#9890b8" },
      { id: "med_vit",    label: "Vitamins",      icon: "leaf",               color: "#8aaf98" },
      { id: "med_pain",   label: "Pain relief",   icon: "plus-circle-outline",color: "#c8a0ae" },
      { id: "med_refill", label: "Refill taken",  icon: "package-variant",    color: "#8090a8" },
    ],
  },
  {
    id: "personal_care",
    name: "Personal care",
    icon: "face-woman-shimmer-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#c8a0ae",
    group: "Body",
    subHabits: [
      { id: "pc_skincare", label: "Skincare",        icon: "face-woman-shimmer-outline", color: "#c8a0ae" },
      { id: "pc_haircare", label: "Haircare",        icon: "hair-dryer-outline",         color: "#d8b0be" },
      { id: "pc_makeup",   label: "Makeup",          icon: "lipstick",                   color: "#d4a8b8" },
      { id: "pc_groom",    label: "Grooming",        icon: "content-cut",                color: "#a8927a" },
      { id: "pc_nails",    label: "Nail care",       icon: "hand-front-right-outline",   color: "#c8a0ae" },
      { id: "pc_dressed",  label: "Getting dressed", icon: "tshirt-crew-outline",        color: "#b8b0d8" },
    ],
  },

  // ── Productivity ──────────────────────────────────────────────────────
  {
    id: "work",
    name: "Work",
    icon: "laptop",
    iconSet: "MaterialCommunityIcons",
    color: "#a8927a",
    group: "Productivity",
    subHabits: [
      { id: "work_deep",   label: "Deep work",    icon: "brain",                  color: "#8090a8" },
      { id: "work_meet",   label: "Meetings",     icon: "account-group-outline",  color: "#a8927a" },
      { id: "work_email",  label: "Emails",       icon: "email-outline",          color: "#9fb3d2" },
      { id: "work_admin",  label: "Admin",        icon: "clipboard-text-outline", color: "#b8a28a" },
      { id: "work_create", label: "Creative",     icon: "palette-outline",        color: "#c0a870" },
      { id: "work_client", label: "Client work",  icon: "briefcase-outline",      color: "#8090a8" },
      { id: "work_plan",   label: "Planning",     icon: "calendar-outline",       color: "#a8a0c8" },
      { id: "work_calls",  label: "Calls",        icon: "phone-outline",          color: "#8aaf98" },
    ],
  },
  {
    id: "studying",
    name: "Studying",
    icon: "school-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#88a878",
    group: "Productivity",
    subHabits: [
      { id: "study_hw",       label: "Homework",           icon: "pencil-outline",      color: "#88a878" },
      { id: "study_rev",      label: "Revision",           icon: "refresh",             color: "#9abf8a" },
      { id: "study_notes",    label: "Reading notes",      icon: "notebook-outline",    color: "#78a085" },
      { id: "study_practice", label: "Practice questions", icon: "help-circle-outline", color: "#8aaf98" },
      { id: "study_online",   label: "Online course",      icon: "monitor-outline",     color: "#8fa3c2" },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    icon: "book-open-variant",
    iconSet: "MaterialCommunityIcons",
    color: "#b09870",
    group: "Productivity",
    subHabits: [
      { id: "read_book",       label: "Book",           icon: "book-open-variant",        color: "#b09870" },
      { id: "read_quran",      label: "Quran",          icon: "star-crescent",            color: "#8aaf98" },
      { id: "read_study",      label: "Study material", icon: "school-outline",           color: "#8fa3c2" },
      { id: "read_articles",   label: "Articles",       icon: "newspaper-variant-outline",color: "#a8927a" },
      { id: "read_fiction",    label: "Fiction",        icon: "book-outline",             color: "#c0a870" },
      { id: "read_nonfiction", label: "Nonfiction",     icon: "book-check-outline",       color: "#a8927a" },
      { id: "read_audio",      label: "Audiobook",      icon: "headphones",               color: "#a8a0c8" },
      { id: "read_work",       label: "Work reading",   icon: "briefcase-outline",        color: "#8090a8" },
    ],
  },
  {
    id: "commuting",
    name: "Commuting",
    icon: "car-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#8090a8",
    group: "Productivity",
    subHabits: [
      { id: "commute_drive",  label: "Driving",              icon: "steering",          color: "#8090a8" },
      { id: "commute_ride",   label: "Ride share",           icon: "car-outline",       color: "#90a0b8" },
      { id: "commute_bus",    label: "Bus",                  icon: "bus",               color: "#7080a8" },
      { id: "commute_walk",   label: "Walking commute",      icon: "walk",              color: "#a8927a" },
      { id: "commute_travel", label: "Travel between places",icon: "map-marker-outline",color: "#c0a870" },
    ],
  },

  // ── Home ──────────────────────────────────────────────────────────────
  {
    id: "cleaning",
    name: "Cleaning",
    icon: "broom",
    iconSet: "MaterialCommunityIcons",
    color: "#8aaf98",
    group: "Home",
    subHabits: [
      { id: "clean_dishes",   label: "Dishes",     icon: "silverware-clean",   color: "#8aaf98" },
      { id: "clean_laundry",  label: "Laundry",    icon: "washing-machine",    color: "#8fa3c2" },
      { id: "clean_vacuum",   label: "Vacuuming",  icon: "robot-vacuum",       color: "#9abf8a" },
      { id: "clean_mop",      label: "Mopping",    icon: "broom",              color: "#78a085" },
      { id: "clean_org",      label: "Organizing", icon: "archive-outline",    color: "#c0a870" },
      { id: "clean_bathroom", label: "Bathroom",   icon: "toilet",             color: "#9fb3d2" },
      { id: "clean_kitchen",  label: "Kitchen",    icon: "countertop-outline", color: "#c49070" },
      { id: "clean_room",     label: "Room reset", icon: "home-outline",       color: "#8aaf98" },
    ],
  },
  {
    id: "cooking",
    name: "Cooking",
    icon: "pot-steam-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#c49070",
    group: "Home",
    subHabits: [
      { id: "cook_breakfast", label: "Breakfast prep", icon: "coffee",               color: "#c0a870" },
      { id: "cook_lunch",     label: "Lunch prep",     icon: "food",                 color: "#c49070" },
      { id: "cook_dinner",    label: "Dinner prep",    icon: "silverware-fork-knife",color: "#b48060" },
      { id: "cook_baking",    label: "Baking",         icon: "cake-variant-outline", color: "#c8a0ae" },
      { id: "cook_prep",      label: "Meal prep",      icon: "pot-steam-outline",    color: "#c0886a" },
      { id: "cook_cleanup",   label: "Cleanup after",  icon: "silverware-clean",     color: "#8aaf98" },
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "shopping-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#9abf8a",
    group: "Home",
    subHabits: [
      { id: "shop_grocery",  label: "Groceries",     icon: "cart-outline",         color: "#8aaf98" },
      { id: "shop_house",    label: "Household",     icon: "home-outline",         color: "#9abf8a" },
      { id: "shop_personal", label: "Personal items",icon: "bag-personal-outline", color: "#c8a0ae" },
      { id: "shop_online",   label: "Online",        icon: "laptop",               color: "#8090a8" },
      { id: "shop_pharmacy", label: "Pharmacy",      icon: "pharmacy",             color: "#b0a4c8" },
    ],
  },
  {
    id: "childcare",
    name: "Childcare",
    icon: "baby-face-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#d4a8b8",
    group: "Home",
    subHabits: [
      { id: "child_feed",  label: "Feeding",       icon: "baby-bottle-outline", color: "#d4a8b8" },
      { id: "child_bath",  label: "Bathing child", icon: "shower",              color: "#9fb3d2" },
      { id: "child_hw",    label: "Homework help", icon: "pencil-outline",      color: "#88a878" },
      { id: "child_play",  label: "Playtime",      icon: "toy-brick-outline",   color: "#c0a870" },
      { id: "child_sleep", label: "Sleep routine", icon: "sleep",               color: "#a8a0c8" },
    ],
  },

  // ── Lifestyle ─────────────────────────────────────────────────────────
  {
    id: "walking",
    name: "Walking",
    icon: "walk",
    iconSet: "MaterialCommunityIcons",
    color: "#a8927a",
    group: "Lifestyle",
    subHabits: [
      { id: "walk_indoor",  label: "Indoor",     icon: "home-outline",         color: "#b8a28a" },
      { id: "walk_outdoor", label: "Outdoor",    icon: "tree-outline",         color: "#8aaf98" },
      { id: "walk_leisure", label: "Leisure",    icon: "music-note-outline",   color: "#c0a870" },
      { id: "walk_fast",    label: "Fast walk",  icon: "run-fast",             color: "#c8a0ae" },
      { id: "walk_dog",     label: "Dog walk",   icon: "dog",                  color: "#c0a870" },
      { id: "walk_errand",  label: "Errand",     icon: "bag-outline",          color: "#a8927a" },
      { id: "walk_meal",    label: "Post-meal",  icon: "silverware-fork-knife",color: "#c49070" },
    ],
  },
  {
    id: "resting",
    name: "Resting",
    icon: "sofa-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#c0b0a0",
    group: "Lifestyle",
    subHabits: [
      { id: "rest_lying", label: "Lying down", icon: "bed-outline",   color: "#a8a0c8" },
      { id: "rest_relax", label: "Relaxing",   icon: "sofa-outline",  color: "#c0b0a0" },
      { id: "rest_break", label: "Break",      icon: "coffee",        color: "#c0a870" },
      { id: "rest_recov", label: "Recovery",   icon: "heart-outline", color: "#c8a0ae" },
      { id: "rest_quiet", label: "Quiet time", icon: "volume-off",    color: "#8090a8" },
    ],
  },
  {
    id: "socializing",
    name: "Socializing",
    icon: "account-group-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#d4a870",
    group: "Lifestyle",
    subHabits: [
      { id: "soc_family",  label: "Family",       icon: "home-heart",           color: "#c8a0ae" },
      { id: "soc_friends", label: "Friends",      icon: "account-multiple",     color: "#d4a870" },
      { id: "soc_guests",  label: "Guests",       icon: "account-plus-outline", color: "#c0a870" },
      { id: "soc_call",    label: "Phone call",   icon: "phone-outline",        color: "#8aaf98" },
      { id: "soc_outing",  label: "Group outing", icon: "map-marker-outline",   color: "#c0a870" },
    ],
  },
  {
    id: "screen_time",
    name: "Screen time",
    icon: "monitor-screenshot",
    iconSet: "MaterialCommunityIcons",
    color: "#8090a8",
    group: "Lifestyle",
    subHabits: [
      { id: "screen_social",  label: "Social media",  icon: "thumb-up-outline",       color: "#7080a8" },
      { id: "screen_tv",      label: "TV",            icon: "television-outline",     color: "#8090a8" },
      { id: "screen_yt",      label: "YouTube",       icon: "youtube",                color: "#c8a0ae" },
      { id: "screen_game",    label: "Gaming",        icon: "gamepad-variant-outline",color: "#8fa3c2" },
      { id: "screen_browse",  label: "Browsing",      icon: "web",                    color: "#90a0b8" },
      { id: "screen_work",    label: "Work screens",  icon: "laptop",                 color: "#a8927a" },
    ],
  },
  {
    id: "prayer_mindfulness",
    name: "Prayer",
    icon: "hands-pray",
    iconSet: "MaterialCommunityIcons",
    color: "#b8a8d0",
    group: "Lifestyle",
    subHabits: [
      { id: "pray_prayer",   label: "Prayer",     icon: "hands-pray",     color: "#b8a8d0" },
      { id: "pray_dhikr",    label: "Dhikr",      icon: "star-crescent",  color: "#a094b8" },
      { id: "pray_meditate", label: "Meditation", icon: "meditation",     color: "#a8a0c8" },
      { id: "pray_breath",   label: "Breathing",  icon: "weather-windy",  color: "#9fb3d2" },
      { id: "pray_reflect",  label: "Reflection", icon: "notebook-outline",color: "#c0b4d8" },
    ],
  },
  {
    id: "hobbies",
    name: "Hobbies",
    icon: "palette-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#c0a870",
    group: "Lifestyle",
    subHabits: [
      { id: "hob_draw",   label: "Drawing",      icon: "draw",                   color: "#c0a870" },
      { id: "hob_music",  label: "Music",        icon: "music-note",             color: "#b8a8d0" },
      { id: "hob_write",  label: "Writing",      icon: "pencil-outline",         color: "#88a878" },
      { id: "hob_photo",  label: "Photography",  icon: "camera-outline",         color: "#8090a8" },
      { id: "hob_game",   label: "Gaming",       icon: "gamepad-variant-outline",color: "#8fa3c2" },
      { id: "hob_crafts", label: "Crafts",       icon: "scissors-cutting",       color: "#c8a0ae" },
    ],
  },
  {
    id: "outdoor_time",
    name: "Outdoor time",
    icon: "tree-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#78b878",
    group: "Lifestyle",
    subHabits: [
      { id: "out_park",    label: "Park",            icon: "ferris-wheel",   color: "#8aaf98" },
      { id: "out_sun",     label: "Sunlight",        icon: "weather-sunny",  color: "#c0a870" },
      { id: "out_garden",  label: "Garden",          icon: "flower-outline", color: "#9abf8a" },
      { id: "out_sitting", label: "Sitting outside", icon: "chair-rolling",  color: "#c0b0a0" },
      { id: "out_nature",  label: "Nature walk",     icon: "walk",           color: "#78a085" },
    ],
  },
];

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [customHabits, setCustomHabits] = useState<Habit[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_KEY)
      .then((v) => { if (v) setCustomHabits(JSON.parse(v)); })
      .catch(() => {});
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((v) => { if (v) setFavoriteIds(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const save = useCallback(async (h: Habit[]) => {
    setCustomHabits(h);
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(h));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addCustomHabit = useCallback(
    (name: string, icon: string, color: string) => {
      const newH: Habit = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name,
        icon,
        iconSet: "MaterialCommunityIcons",
        color,
        group: "Lifestyle",
        subHabits: [],
        isCustom: true,
      };
      save([...customHabits, newH]);
    },
    [customHabits, save]
  );

  const removeHabit = useCallback(
    (id: string) => save(customHabits.filter((h) => h.id !== id)),
    [customHabits, save]
  );

  const habits = [...DEFAULT_HABITS, ...customHabits];

  return (
    <HabitsContext.Provider value={{ habits, favoriteIds, toggleFavorite, addCustomHabit, removeHabit }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be inside HabitsProvider");
  return ctx;
}
