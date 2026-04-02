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

const DEFAULT_HABITS: Habit[] = [
  // ── Body ──────────────────────────────────────────────────────────────
  {
    id: "shower",
    name: "Shower",
    icon: "shower",
    iconSet: "MaterialCommunityIcons",
    color: "#7ab8c4",
    group: "Body",
    subHabits: [
      { id: "shower_quick",   label: "Quick rinse",     icon: "lightning-bolt",      color: "#7ab8c4" },
      { id: "shower_full",    label: "Full shower",     icon: "shower-head",         color: "#5aa0b0" },
      { id: "shower_hair",    label: "Hair wash",       icon: "hair-dryer-outline",  color: "#8ac8d4" },
      { id: "shower_skin",    label: "Skincare",        icon: "face-woman-shimmer-outline", color: "#a0d0d8" },
      { id: "shower_am",      label: "Morning routine", icon: "weather-sunny",       color: "#f0c060" },
      { id: "shower_pm",      label: "Night routine",   icon: "weather-night",       color: "#8090c0" },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    icon: "toilet",
    iconSet: "MaterialCommunityIcons",
    color: "#a0b8c8",
    group: "Body",
    subHabits: [
      { id: "bath_toilet",    label: "Toilet",           icon: "toilet",              color: "#a0b8c8" },
      { id: "bath_teeth",     label: "Brush teeth",      icon: "toothbrush",          color: "#80c0e0" },
      { id: "bath_face",      label: "Wash face",        icon: "face-wash",           color: "#90d0e0" },
      { id: "bath_groom",     label: "Grooming",         icon: "content-cut",         color: "#b0c8d8" },
      { id: "bath_menstrual", label: "Menstrual care",   icon: "flower-tulip-outline",color: "#e090b0" },
      { id: "bath_hygiene",   label: "Hygiene routine",  icon: "hand-wash",           color: "#78c0d0" },
    ],
  },
  {
    id: "eating",
    name: "Eating",
    icon: "silverware-fork-knife",
    iconSet: "MaterialCommunityIcons",
    color: "#c8a060",
    group: "Body",
    subHabits: [
      { id: "eat_breakfast",  label: "Breakfast",    icon: "coffee",                 color: "#c8a060" },
      { id: "eat_lunch",      label: "Lunch",        icon: "food",                   color: "#c08050" },
      { id: "eat_dinner",     label: "Dinner",       icon: "silverware-fork-knife",  color: "#a06840" },
      { id: "eat_snack",      label: "Snack",        icon: "food-apple-outline",     color: "#d4b070" },
      { id: "eat_dessert",    label: "Dessert",      icon: "cake-variant-outline",   color: "#e0a8b0" },
      { id: "eat_out",        label: "Eating out",   icon: "storefront-outline",     color: "#c87050" },
      { id: "eat_prep",       label: "Meal prep",    icon: "pot-steam-outline",      color: "#b09050" },
      { id: "eat_healthy",    label: "Healthy meal", icon: "leaf",                   color: "#90b070" },
    ],
  },
  {
    id: "drinking_water",
    name: "Drinking water",
    icon: "water",
    iconSet: "MaterialCommunityIcons",
    color: "#7098c8",
    group: "Body",
    subHabits: [
      { id: "water_small",  label: "Small glass",       icon: "cup-water",           color: "#90b8e0" },
      { id: "water_bottle", label: "Bottle finished",   icon: "bottle-soda-outline", color: "#7098c8" },
      { id: "water_elec",   label: "Electrolytes",      icon: "lightning-bolt",      color: "#70c0d8" },
      { id: "water_remind", label: "Hydration reminder",icon: "bell-outline",        color: "#8090b8" },
    ],
  },
  {
    id: "sleeping",
    name: "Sleeping",
    icon: "sleep",
    iconSet: "MaterialCommunityIcons",
    color: "#9090c0",
    group: "Body",
    subHabits: [
      { id: "sleep_night",   label: "Night sleep",      icon: "weather-night",       color: "#7070b0" },
      { id: "sleep_nap",     label: "Nap",              icon: "pillow",              color: "#a0a0d0" },
      { id: "sleep_deep",    label: "Deep sleep",       icon: "power-sleep",         color: "#5060a0" },
      { id: "sleep_broken",  label: "Interrupted",      icon: "alert-circle-outline",color: "#c09090" },
      { id: "sleep_early",   label: "Early sleep",      icon: "weather-sunset",      color: "#c0a070" },
      { id: "sleep_late",    label: "Late sleep",       icon: "clock-outline",       color: "#8080b0" },
    ],
  },
  {
    id: "stretching",
    name: "Stretching",
    icon: "human-handsup",
    iconSet: "MaterialCommunityIcons",
    color: "#b09880",
    group: "Body",
    subHabits: [
      { id: "stretch_am",      label: "Morning stretch",      icon: "weather-sunny",     color: "#f0c060" },
      { id: "stretch_post",    label: "Post-workout",         icon: "run",               color: "#8aaa70" },
      { id: "stretch_neck",    label: "Neck & back",          icon: "human",             color: "#b09880" },
      { id: "stretch_full",    label: "Full body",            icon: "human-handsup",     color: "#c0a878" },
      { id: "stretch_yoga",    label: "Yoga flow",            icon: "yoga",              color: "#b07ab0" },
      { id: "stretch_mob",     label: "Mobility drill",       icon: "arm-flex-outline",  color: "#90b0a0" },
    ],
  },
  {
    id: "exercise",
    name: "Exercise",
    icon: "run",
    iconSet: "MaterialCommunityIcons",
    color: "#8aaa70",
    group: "Body",
    subHabits: [
      { id: "ex_cardio",   label: "Cardio",          icon: "heart-pulse",       color: "#c97070" },
      { id: "ex_strength", label: "Strength",        icon: "weight-lifter",     color: "#8aaa70" },
      { id: "ex_hiit",     label: "HIIT",            icon: "lightning-bolt",    color: "#e09040" },
      { id: "ex_home",     label: "Home workout",    icon: "home-outline",      color: "#7ab8c4" },
      { id: "ex_gym",      label: "Gym workout",     icon: "dumbbell",          color: "#7090a8" },
      { id: "ex_sports",   label: "Sports",          icon: "basketball",        color: "#c8a060" },
      { id: "ex_mobility", label: "Mobility",        icon: "arm-flex-outline",  color: "#90b8a0" },
      { id: "ex_recovery", label: "Recovery",        icon: "meditation",        color: "#9090c0" },
    ],
  },
  {
    id: "medication",
    name: "Medication",
    icon: "pill",
    iconSet: "MaterialCommunityIcons",
    color: "#c870a0",
    group: "Body",
    subHabits: [
      { id: "med_am",      label: "Morning meds",  icon: "weather-sunny",     color: "#e09040" },
      { id: "med_pm",      label: "Night meds",    icon: "weather-night",     color: "#8080c0" },
      { id: "med_vit",     label: "Vitamins",      icon: "leaf",              color: "#90b870" },
      { id: "med_pain",    label: "Pain relief",   icon: "plus-circle-outline",color: "#c87070" },
      { id: "med_refill",  label: "Refill taken",  icon: "package-variant",   color: "#a0a0c0" },
    ],
  },
  {
    id: "personal_care",
    name: "Personal care",
    icon: "face-woman-shimmer-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#d4a0b0",
    group: "Body",
    subHabits: [
      { id: "pc_skincare",  label: "Skincare",        icon: "face-woman-shimmer-outline", color: "#d4a0b0" },
      { id: "pc_haircare",  label: "Haircare",        icon: "hair-dryer-outline",         color: "#c890a0" },
      { id: "pc_makeup",    label: "Makeup",          icon: "lipstick",                   color: "#e0a0c0" },
      { id: "pc_groom",     label: "Grooming",        icon: "content-cut",                color: "#b09090" },
      { id: "pc_nails",     label: "Nail care",       icon: "hand-front-right-outline",   color: "#d0b0c0" },
      { id: "pc_dressed",   label: "Getting dressed", icon: "tshirt-crew-outline",        color: "#b0a0c0" },
    ],
  },

  // ── Productivity ──────────────────────────────────────────────────────
  {
    id: "work",
    name: "Work",
    icon: "laptop",
    iconSet: "MaterialCommunityIcons",
    color: "#7090a8",
    group: "Productivity",
    subHabits: [
      { id: "work_deep",    label: "Deep work",    icon: "brain",                  color: "#5070a0" },
      { id: "work_meet",    label: "Meetings",     icon: "account-group-outline",  color: "#7090a8" },
      { id: "work_email",   label: "Emails",       icon: "email-outline",          color: "#90a8c0" },
      { id: "work_admin",   label: "Admin",        icon: "clipboard-text-outline", color: "#a0b0c0" },
      { id: "work_create",  label: "Creative",     icon: "palette-outline",        color: "#c0a870" },
      { id: "work_client",  label: "Client work",  icon: "briefcase-outline",      color: "#8090b0" },
      { id: "work_plan",    label: "Planning",     icon: "calendar-outline",       color: "#9090c0" },
      { id: "work_calls",   label: "Calls",        icon: "phone-outline",          color: "#70b0a0" },
    ],
  },
  {
    id: "studying",
    name: "Studying",
    icon: "school-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#80a870",
    group: "Productivity",
    subHabits: [
      { id: "study_hw",       label: "Homework",          icon: "pencil-outline",       color: "#80a870" },
      { id: "study_rev",      label: "Revision",          icon: "refresh",              color: "#90b880" },
      { id: "study_notes",    label: "Reading notes",     icon: "notebook-outline",     color: "#70a060" },
      { id: "study_practice", label: "Practice questions",icon: "help-circle-outline",  color: "#a0b870" },
      { id: "study_online",   label: "Online course",     icon: "monitor-outline",      color: "#7090a8" },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    icon: "book-open-variant",
    iconSet: "MaterialCommunityIcons",
    color: "#c09060",
    group: "Productivity",
    subHabits: [
      { id: "read_book",      label: "Book",          icon: "book-open-variant",   color: "#c09060" },
      { id: "read_quran",     label: "Quran",         icon: "star-crescent",       color: "#70b0a0" },
      { id: "read_study",     label: "Study material",icon: "school-outline",      color: "#8090a8" },
      { id: "read_articles",  label: "Articles",      icon: "newspaper-variant-outline", color: "#a0a090" },
      { id: "read_fiction",   label: "Fiction",       icon: "book-outline",        color: "#c0a070" },
      { id: "read_nonfiction",label: "Nonfiction",    icon: "book-check-outline",  color: "#a08060" },
      { id: "read_audio",     label: "Audiobook",     icon: "headphones",          color: "#9090c0" },
      { id: "read_work",      label: "Work reading",  icon: "briefcase-outline",   color: "#7090a8" },
    ],
  },
  {
    id: "commuting",
    name: "Commuting",
    icon: "car-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#80a8b0",
    group: "Productivity",
    subHabits: [
      { id: "commute_drive",  label: "Driving",             icon: "steering",          color: "#80a8b0" },
      { id: "commute_ride",   label: "Ride share",          icon: "car-outline",       color: "#90b8c0" },
      { id: "commute_bus",    label: "Bus",                 icon: "bus",               color: "#70a0a8" },
      { id: "commute_walk",   label: "Walking commute",     icon: "walk",              color: "#a09070" },
      { id: "commute_travel", label: "Travel between places",icon: "map-marker-outline",color: "#c09060" },
    ],
  },

  // ── Home ──────────────────────────────────────────────────────────────
  {
    id: "cleaning",
    name: "Cleaning",
    icon: "broom",
    iconSet: "MaterialCommunityIcons",
    color: "#90b8a0",
    group: "Home",
    subHabits: [
      { id: "clean_dishes",   label: "Dishes",           icon: "silverware-clean",    color: "#90b8a0" },
      { id: "clean_laundry",  label: "Laundry",          icon: "washing-machine",     color: "#7098a0" },
      { id: "clean_vacuum",   label: "Vacuuming",        icon: "robot-vacuum",        color: "#a0c0b0" },
      { id: "clean_mop",      label: "Mopping",          icon: "broom",               color: "#80a890" },
      { id: "clean_org",      label: "Organizing",       icon: "archive-outline",     color: "#c0a870" },
      { id: "clean_bathroom", label: "Bathroom",         icon: "toilet",              color: "#a0b8c8" },
      { id: "clean_kitchen",  label: "Kitchen",          icon: "countertop-outline",  color: "#c8a060" },
      { id: "clean_room",     label: "Room reset",       icon: "home-outline",        color: "#b0c0a8" },
    ],
  },
  {
    id: "cooking",
    name: "Cooking",
    icon: "pot-steam-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#c8907a",
    group: "Home",
    subHabits: [
      { id: "cook_breakfast",label: "Breakfast prep",       icon: "coffee",              color: "#c8a060" },
      { id: "cook_lunch",    label: "Lunch prep",           icon: "food",                color: "#c08050" },
      { id: "cook_dinner",   label: "Dinner prep",          icon: "silverware-fork-knife",color: "#a06840" },
      { id: "cook_baking",   label: "Baking",               icon: "cake-variant-outline",color: "#e0a8b0" },
      { id: "cook_prep",     label: "Meal prep",            icon: "pot-steam-outline",   color: "#c8907a" },
      { id: "cook_cleanup",  label: "Cleanup after",        icon: "silverware-clean",    color: "#90b8a0" },
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "shopping-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#a0c090",
    group: "Home",
    subHabits: [
      { id: "shop_grocery",  label: "Groceries",     icon: "cart-outline",            color: "#90b870" },
      { id: "shop_house",    label: "Household",     icon: "home-outline",            color: "#a0c090" },
      { id: "shop_personal", label: "Personal items",icon: "bag-personal-outline",    color: "#d4a0b0" },
      { id: "shop_online",   label: "Online",        icon: "laptop",                  color: "#7090a8" },
      { id: "shop_pharmacy", label: "Pharmacy",      icon: "pharmacy",                color: "#c870a0" },
    ],
  },
  {
    id: "childcare",
    name: "Childcare",
    icon: "baby-face-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#f0b8c0",
    group: "Home",
    subHabits: [
      { id: "child_feed",   label: "Feeding",        icon: "baby-bottle-outline",  color: "#f0b8c0" },
      { id: "child_bath",   label: "Bathing child",  icon: "shower",               color: "#90d0e0" },
      { id: "child_hw",     label: "Homework help",  icon: "pencil-outline",       color: "#80a870" },
      { id: "child_play",   label: "Playtime",       icon: "toy-brick-outline",    color: "#f0c060" },
      { id: "child_sleep",  label: "Sleep routine",  icon: "sleep",                color: "#9090c0" },
    ],
  },

  // ── Lifestyle ─────────────────────────────────────────────────────────
  {
    id: "walking",
    name: "Walking",
    icon: "walk",
    iconSet: "MaterialCommunityIcons",
    color: "#a09070",
    group: "Lifestyle",
    subHabits: [
      { id: "walk_indoor",  label: "Indoor",         icon: "home-outline",          color: "#b0a880" },
      { id: "walk_outdoor", label: "Outdoor",        icon: "tree-outline",          color: "#70b870" },
      { id: "walk_leisure", label: "Leisure",        icon: "music-note-outline",    color: "#c0a870" },
      { id: "walk_fast",    label: "Fast walk",      icon: "run-fast",              color: "#c97070" },
      { id: "walk_dog",     label: "Dog walk",       icon: "dog",                   color: "#c8a060" },
      { id: "walk_errand",  label: "Errand",         icon: "bag-outline",           color: "#a09080" },
      { id: "walk_meal",    label: "Post-meal",      icon: "silverware-fork-knife", color: "#c8a060" },
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
      { id: "rest_lying",  label: "Lying down",  icon: "bed-outline",         color: "#9090c0" },
      { id: "rest_relax",  label: "Relaxing",    icon: "sofa-outline",        color: "#c0b0a0" },
      { id: "rest_break",  label: "Break",       icon: "coffee",              color: "#c8a060" },
      { id: "rest_recov",  label: "Recovery",    icon: "heart-outline",       color: "#c87070" },
      { id: "rest_quiet",  label: "Quiet time",  icon: "volume-off",          color: "#8090b0" },
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
      { id: "soc_family",  label: "Family",       icon: "home-heart",           color: "#e08070" },
      { id: "soc_friends", label: "Friends",      icon: "account-multiple",     color: "#d4a870" },
      { id: "soc_guests",  label: "Guests",       icon: "account-plus-outline", color: "#c0b070" },
      { id: "soc_call",    label: "Phone call",   icon: "phone-outline",        color: "#70b0a0" },
      { id: "soc_outing",  label: "Group outing", icon: "map-marker-outline",   color: "#c09060" },
    ],
  },
  {
    id: "screen_time",
    name: "Screen time",
    icon: "monitor-screenshot",
    iconSet: "MaterialCommunityIcons",
    color: "#8090b0",
    group: "Lifestyle",
    subHabits: [
      { id: "screen_social", label: "Social media", icon: "thumb-up-outline",    color: "#7090c0" },
      { id: "screen_tv",     label: "TV",           icon: "television-outline",  color: "#8090b0" },
      { id: "screen_yt",     label: "YouTube",      icon: "youtube",             color: "#e07070" },
      { id: "screen_game",   label: "Gaming",       icon: "gamepad-variant-outline",color: "#70a8b0" },
      { id: "screen_browse", label: "Browsing",     icon: "web",                 color: "#9090a8" },
      { id: "screen_work",   label: "Work screens", icon: "laptop",              color: "#7090a8" },
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
      { id: "pray_prayer",   label: "Prayer",            icon: "hands-pray",            color: "#b8a8d0" },
      { id: "pray_dhikr",    label: "Dhikr",             icon: "star-crescent",         color: "#a090c0" },
      { id: "pray_meditate", label: "Meditation",        icon: "meditation",            color: "#9090c0" },
      { id: "pray_breath",   label: "Breathing",         icon: "weather-windy",         color: "#70b8d0" },
      { id: "pray_reflect",  label: "Reflection",        icon: "notebook-outline",      color: "#c0b0d0" },
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
      { id: "hob_draw",   label: "Drawing",      icon: "draw",                  color: "#c0a870" },
      { id: "hob_music",  label: "Music",        icon: "music-note",            color: "#b07ab0" },
      { id: "hob_write",  label: "Writing",      icon: "pencil-outline",        color: "#80a870" },
      { id: "hob_photo",  label: "Photography",  icon: "camera-outline",        color: "#7090a8" },
      { id: "hob_game",   label: "Gaming",       icon: "gamepad-variant-outline",color: "#8090b0" },
      { id: "hob_crafts", label: "Crafts",       icon: "scissors-cutting",      color: "#d4a0b0" },
    ],
  },
  {
    id: "outdoor_time",
    name: "Outdoor time",
    icon: "tree-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#70b870",
    group: "Lifestyle",
    subHabits: [
      { id: "out_park",    label: "Park",           icon: "ferris-wheel",         color: "#70b870" },
      { id: "out_sun",     label: "Sunlight",       icon: "weather-sunny",        color: "#f0c060" },
      { id: "out_garden",  label: "Garden",         icon: "flower-outline",       color: "#90c080" },
      { id: "out_sitting", label: "Sitting outside",icon: "chair-rolling",        color: "#c0b880" },
      { id: "out_nature",  label: "Nature walk",    icon: "walk",                 color: "#a09070" },
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
