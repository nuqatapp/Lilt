import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePeople } from "./PeopleContext";

/**
 * SubHabit: Represents a sub-category within a larger habit.
 * Example: "Shower" habit has sub-habits like "Quick rinse", "Full shower", etc.
 */
export interface SubHabit {
  id: string;
  label: string;
  icon: string;
  color: string;
}

/**
 * Habit: Core data structure representing a user activity to track.
 * Can be a default habit (from DEFAULT_HABITS) or custom (added by user).
 * Each habit has optional sub-habits for more granular tracking.
 */
export interface Habit {
  id: string;
  name: string;
  icon: string;
  iconSet: "MaterialCommunityIcons" | "Ionicons";
  color: string;
  group: "Body" | "Productivity" | "Home" | "Lifestyle";
  subHabits: SubHabit[];
  isCustom?: boolean; // true if user created it
}

/**
 * HabitsContextValue: The public API of the HabitsContext.
 * Provides habits list, favorites management, and custom habit management.
 */
interface HabitsContextValue {
  habits: Habit[]; // Combined DEFAULT_HABITS + customHabits
  favoriteIds: string[]; // IDs of habits marked as favorites by current person
  toggleFavorite: (id: string) => void; // Toggle a habit as favorite
  addCustomHabit: (name: string, icon: string, color: string) => void; // Add new custom habit
  removeHabit: (id: string) => void; // Remove a custom habit (not defaults)
  isLoading: boolean; // True while AsyncStorage data is being loaded
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

/**
 * AsyncStorage Keys for persistence.
 * Using versioning (_v1, _v2) allows for future migrations without data loss.
 */
const CUSTOM_KEY = "@trace_custom_habits_v1"; // Stores user-created habits
const FAVORITES_KEY = "@lilt_favorites_v2"; // Stores favorites per person

// ── Color Palette: Soft UI desaturated pastels ────────────────────────────────
// Used for visual organization and accessibility in habit categorization.
// Sage Green family:      #8aaf98  #78a085  #9abf8a  #7a9f88
// Pale Terracotta family: #c49070  #b48060  #d4a080  #c0886a
// Muted Periwinkle family:#8fa3c2  #7f93b2  #9fb3d2  #7090b0
// Soft Lavender family:   #a8a0c8  #9890b8  #b8b0d8  #8878b0
// Warm Taupe family:      #a8927a  #988272  #b8a28a  #987060
// Dusty Pink family:      #c8a0ae  #b8909e  #d8b0be  #c090a0
// Muted Amber family:     #c0a870  #b09860  #d0b880  #a08858
// Slate Blue family:      #8090a8  #7080a8  #90a0b8  #6878a0
// ────────────────────────────────────────────────────────────────────────────

/**
 * DEFAULT_HABITS: Pre-loaded habits covering common daily activities.
 * Organized into 4 categories: Body, Productivity, Home, Lifestyle.
 * Each habit has multiple sub-habits for granular tracking.
 *
 * NEVER MODIFY - these are shipped with the app and expected to remain stable.
 * To add habits, create custom habits via addCustomHabit() instead.
 */
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
      { id: "shower_quick",   label: "Quick rinse",     icon: "lightning-bolt-outline",     color: "#8fa3c2" },
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
      { id: "eat_breakfast",  label: "Breakfast",    icon: "coffee-outline",         color: "#c0a870" },
      { id: "eat_lunch",      label: "Lunch",        icon: "food-outline",           color: "#c49070" },
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
    icon: "water-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#7fa8d8",
    group: "Body",
    subHabits: [
      { id: "water_small",  label: "Small glass",        icon: "cup-water",           color: "#9fb3d2" },
      { id: "water_bottle", label: "Bottle finished",    icon: "bottle-soda-outline", color: "#7fa8d8" },
      { id: "water_elec",   label: "Electrolytes",       icon: "lightning-bolt-outline",color: "#8fa3c2" },
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
      { id: "ex_strength", label: "Strength",      icon: "weight-lifter-outline",color: "#8aaf98" },
      { id: "ex_hiit",     label: "HIIT",          icon: "lightning-bolt-outline",color: "#c0a870" },
      { id: "ex_home",     label: "Home workout",  icon: "home-outline",     color: "#9fb3d2" },
      { id: "ex_gym",      label: "Gym workout",   icon: "dumbbell",         color: "#8090a8" },
      { id: "ex_sports",   label: "Sports",        icon: "basketball-outline",color: "#c0a870" },
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
      { id: "med_refill", label: "Refill taken",  icon: "package-variant-outline",color: "#8090a8" },
    ],
  },
  // ── Productivity ───────────────────────────────────────────────────────
  {
    id: "work",
    name: "Work",
    icon: "briefcase-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#8090a8",
    group: "Productivity",
    subHabits: [
      { id: "work_focus",   label: "Focus time",      icon: "brain",             color: "#8fa3c2" },
      { id: "work_meeting", label: "Meeting",         icon: "account-group",     color: "#8090a8" },
      { id: "work_break",   label: "Break",           icon: "coffee-outline",    color: "#c0a870" },
      { id: "work_plan",    label: "Planning",        icon: "notebook",          color: "#9fb3d2" },
    ],
  },
  {
    id: "learning",
    name: "Learning",
    icon: "book-open-variant",
    iconSet: "MaterialCommunityIcons",
    color: "#9fb3d2",
    group: "Productivity",
    subHabits: [
      { id: "learn_read",     label: "Reading",       icon: "book-open-variant",     color: "#9fb3d2" },
      { id: "learn_course",   label: "Course",        icon: "school",                color: "#8090a8" },
      { id: "learn_podcast",  label: "Podcast",       icon: "podcast",               color: "#a8a0c8" },
      { id: "learn_practice", label: "Practice",      icon: "tennis",                color: "#c0a870" },
    ],
  },
  {
    id: "creative",
    name: "Creative",
    icon: "palette-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#c8a0ae",
    group: "Productivity",
    subHabits: [
      { id: "cre_write",  label: "Writing",    icon: "pencil-outline",  color: "#88a878" },
      { id: "cre_design", label: "Designing",  icon: "pencil",          color: "#c0a870" },
      { id: "cre_code",   label: "Coding",     icon: "code-braces",     color: "#8090a8" },
      { id: "cre_build",  label: "Building",   icon: "hammer",          color: "#c49070" },
    ],
  },
  // ── Home ───────────────────────────────────────────────────────────────
  {
    id: "cleaning",
    name: "Cleaning",
    icon: "broom",
    iconSet: "MaterialCommunityIcons",
    color: "#9abf8a",
    group: "Home",
    subHabits: [
      { id: "clean_room",    label: "Room",        icon: "room-service",            color: "#8aaf98" },
      { id: "clean_kitchen", label: "Kitchen",     icon: "silverware-fork-knife",   color: "#9fb3d2" },
      { id: "clean_bath",    label: "Bathroom",    icon: "toilet",                  color: "#8fa3c2" },
      { id: "clean_laundry", label: "Laundry",     icon: "washing-machine",         color: "#c0a870" },
      { id: "clean_dishes",  label: "Dishes",      icon: "plate-utensils",          color: "#c49070" },
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
      { id: "cook_breakfast", label: "Breakfast", icon: "coffee-outline",     color: "#c0a870" },
      { id: "cook_lunch",     label: "Lunch",     icon: "food-outline",       color: "#c49070" },
      { id: "cook_dinner",    label: "Dinner",    icon: "pot-steam-outline",  color: "#b48060" },
      { id: "cook_snack",     label: "Snack",     icon: "food-apple-outline", color: "#d4a080" },
    ],
  },
  {
    id: "family_time",
    name: "Family time",
    icon: "home-heart",
    iconSet: "MaterialCommunityIcons",
    color: "#c8a0ae",
    group: "Home",
    subHabits: [
      { id: "fam_talk",  label: "Talk",       icon: "chat-outline",      color: "#c8a0ae" },
      { id: "fam_play",  label: "Play",       icon: "toy-brick-outline", color: "#c0a870" },
      { id: "fam_meal",  label: "Meal",       icon: "silverware-fork-knife",color: "#c49070" },
      { id: "fam_help",  label: "Help",       icon: "hand-heart",        color: "#8aaf98" },
    ],
  },
  {
    id: "childcare",
    name: "Childcare",
    icon: "baby-face-outline",
    iconSet: "MaterialCommunityIcons",
    color: "#d4a080",
    group: "Home",
    subHabits: [
      { id: "child_feed",  label: "Feeding",      icon: "bottle-tonic-outline",color: "#d4a080" },
      { id: "child_bath",  label: "Bath",         icon: "shower-head",         color: "#8fa3c2" },
      { id: "child_dress", label: "Dressing",     icon: "tshirt-outline",      color: "#c0a870" },
      { id: "child_play",  label: "Playtime",     icon: "toy-brick-outline",   color: "#c0a870" },
      { id: "child_sleep", label: "Sleep routine",icon: "sleep",               color: "#a8a0c8" },
    ],
  },
  // ── Lifestyle ──────────────────────────────────────────────────────────
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
      { id: "rest_break", label: "Break",      icon: "coffee-outline",color: "#c0a870" },
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
      { id: "soc_friends", label: "Friends",      icon: "account-multiple-outline",color: "#d4a870" },
      { id: "soc_guests",  label: "Guests",       icon: "account-plus-outline", color: "#c0a870" },
      { id: "soc_call",    label: "Phone call",   icon: "phone-outline",        color: "#8aaf98" },
      { id: "soc_outing",  label: "Group outing", icon: "map-marker-outline",   color: "#c0a870" },
    ],
  },
  {
    id: "screen_time",
    name: "Screen time",
    icon: "monitor",
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
      { id: "hob_music",  label: "Music",        icon: "music-note-outline",     color: "#b8a8d0" },
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

/**
 * HabitsProvider: Context provider that manages habit state globally.
 * 
 * Features:
 * - Loads custom habits from AsyncStorage on mount
 * - Loads user favorites from AsyncStorage on mount
 * - Combines DEFAULT_HABITS with customHabits for display
 * - Manages multi-user favorites (per person)
 * - Provides loading state to prevent render-before-load issues
 * 
 * CRITICAL BUG FIX:
 * Added `isLoading` state to prevent dashboard from rendering
 * empty data while AsyncStorage is loading. This was causing
 * the "dashboard displays wrong data" issue.
 */
export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [customHabits, setCustomHabits] = useState<Habit[]>([]);
  const [allFavorites, setAllFavorites] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true); // ← KEY FIX: Track loading state
  const { currentPersonId } = usePeople();

  // Calculate which favorites apply to current person
  const personKey = currentPersonId ?? "__global__";
  const favoriteIds: string[] = allFavorites[personKey] ?? [];

  /**
   * Load persisted data from AsyncStorage on component mount.
   * 
   * This runs ONCE when the component first mounts.
   * Both custom habits and favorites are loaded asynchronously,
   * so we use a flag to prevent rendering until data is ready.
   * 
   * Error handling:
   * - If loading fails, app continues with empty data (graceful degradation)
   * - Errors are silently caught (user won't see console errors in production)
   */
  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounts

    async function loadData() {
      try {
        // Load custom habits
        const customData = await AsyncStorage.getItem(CUSTOM_KEY);
        if (mounted && customData) {
          setCustomHabits(JSON.parse(customData));
        }

        // Load favorites
        const favoritesData = await AsyncStorage.getItem(FAVORITES_KEY);
        if (mounted && favoritesData) {
          setAllFavorites(JSON.parse(favoritesData));
        }
      } catch (error) {
        // Silent fail - app continues with defaults
        console.warn("Failed to load habits from storage:", error);
      } finally {
        // Always mark loading as done, even if there was an error
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    // Cleanup: if component unmounts while loading, don't update state
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Save custom habits to AsyncStorage.
   * 
   * Called when:
   * - User adds a custom habit
   * - User removes a habit
   * 
   * This function updates local state AND persists to AsyncStorage.
   * If save fails, local state is still updated (user sees changes immediately),
   * but data may not survive app restart.
   */
  const save = useCallback(async (h: Habit[]) => {
    // Update local state immediately (optimistic update)
    setCustomHabits(h);

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(h));
    } catch (error) {
      // If save fails, warn but don't crash
      console.error("Failed to save custom habits:", error);
      // NOTE: User won't see this error - consider adding a toast notification
      // if you want to inform them that data may not persist on app restart
    }
  }, []);

  /**
   * Toggle whether a habit is marked as favorite.
   * 
   * Favorites are stored per person (from PeopleContext).
   * This allows different users on the same device to have different favorites.
   * 
   * IMPORTANT: This function does NOT await the AsyncStorage save.
   * If the app closes immediately, the favorite change may be lost.
   * Consider adding a toast notification if save fails.
   */
  const toggleFavorite = useCallback((id: string) => {
    setAllFavorites((prev) => {
      const current = prev[personKey] ?? [];
      // If already favorite, remove it; otherwise add it
      const next = current.includes(id) 
        ? current.filter((x) => x !== id) 
        : [...current, id];
      const updated = { ...prev, [personKey]: next };

      // Save to AsyncStorage (fire and forget - no error handling)
      // BUG FIX: Consider awaiting this in future
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated)).catch((error) => {
        console.error("Failed to save favorites:", error);
      });

      return updated;
    });
  }, [personKey]);

  /**
   * Add a new custom habit created by the user.
   * 
   * Creates a new habit object with:
   * - Unique ID (timestamp + random string)
   * - User-provided name, icon, color
   * - Empty subHabits array (user can't add sub-habits yet, only main habits)
   * - isCustom flag set to true
   * 
   * Then adds it to customHabits and saves to storage.
   */
  const addCustomHabit = useCallback(
    (name: string, icon: string, color: string) => {
      const newH: Habit = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        name,
        icon,
        iconSet: "MaterialCommunityIcons",
        color,
        group: "Lifestyle", // Custom habits default to Lifestyle
        subHabits: [], // User can only add main habits, not sub-habits
        isCustom: true,
      };
      save([...customHabits, newH]);
    },
    [customHabits, save]
  );

  /**
   * Remove a custom habit by ID.
   * 
   * Only removes custom habits (isCustom: true).
   * DEFAULT_HABITS cannot be removed.
   * 
   * This function filters out the habit and re-saves.
   */
  const removeHabit = useCallback(
    (id: string) => save(customHabits.filter((h) => h.id !== id)),
    [customHabits, save]
  );

  /**
   * Combine DEFAULT_HABITS with customHabits for display.
   * 
   * DEFAULT_HABITS always come first, then custom habits.
   * This ensures users see default habits first, with their custom ones below.
   */
  const habits = [...DEFAULT_HABITS, ...customHabits];

  return (
    <HabitsContext.Provider 
      value={{ 
        habits, 
        favoriteIds, 
        toggleFavorite, 
        addCustomHabit, 
        removeHabit,
        isLoading, // ← NEW: Provide loading state to consumers
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

/**
 * Hook to use the HabitsContext.
 * 
 * Usage:
 *   const { habits, addCustomHabit, isLoading } = useHabits();
 * 
 * Throws error if called outside HabitsProvider.
 */
export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be inside HabitsProvider");
  return ctx;
}
