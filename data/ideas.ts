import { FRESH_BRAINSTORM_IDEAS } from "@/data/fresh-ideas";

export const CATEGORIES = [
  "Layout & architecture",
  "Kitchen & dining",
  "Comfort",
  "Daily convenience",
  "Storage",
  "Laundry & utility",
  "Light & windows",
  "Bath & wellness",
  "Outdoors & landscaping",
  "Energy & resilience",
  "Materials & details",
  "Future-proofing",
] as const;

export type IdeaCategory = (typeof CATEGORIES)[number];
export type IdeaStatus = "saved" | "candidate" | "reviewed";
export type IdeaInterest = "consider" | "love" | "research";

export type SeedIdea = {
  id: string;
  title: string;
  detail: string;
  category: IdeaCategory;
  source: "user" | "brainstorm" | "fresh";
  status: IdeaStatus;
  interest: IdeaInterest;
};

const idea = (
  id: string,
  title: string,
  category: IdeaCategory,
  detail: string,
  source: SeedIdea["source"] = "brainstorm",
): SeedIdea => ({
  id,
  title,
  category,
  detail,
  source,
  status: source === "user" ? "saved" : source === "fresh" ? "candidate" : "reviewed",
  interest: "consider",
});

export const USER_IDEAS: SeedIdea[] = [
  idea("demo-window-seat", "Window seat", "Layout & architecture", "A synthetic example for comparing daylight and storage options.", "user"),
  idea("heated-floors", "Heated floors", "Comfort", "A synthetic example for tracking research before a design decision.", "user"),
  idea("demo-entry-storage", "Entry storage", "Storage", "A synthetic example for collecting everyday storage ideas.", "user"),
];

export const BRAINSTORM_IDEAS: SeedIdea[] = [
  idea("entry-garden-view", "Frame a garden view from the entry", "Layout & architecture", "Let the first sightline through the house land on greenery rather than a hallway or television."),
  idea("covered-breezeway", "Covered breezeway", "Layout & architecture", "A sheltered, airy connection between house, garage, garden, or guest space."),
  idea("interior-lightwell", "Interior light well", "Layout & architecture", "Bring daylight and a sliver of planting into the middle of a deep plan."),
  idea("reading-loft", "Small reading loft", "Layout & architecture", "A compact perch above circulation or beside a tall room, sized for books and a chair."),
  idea("pocket-glass-wall", "Pocketing glass wall", "Layout & architecture", "Let a wall disappear so the kitchen or living room can become one space with a courtyard."),
  idea("entry-vestibule", "Real entry vestibule", "Layout & architecture", "An air-lock-like arrival zone that controls drafts, shoes, noise, and the first view inside."),
  idea("lower-ceiling-zones", "Low ceilings beside tall spaces", "Layout & architecture", "Use intimate ceiling heights at dining, kitchen, or window seats to make a double-height room feel warmer."),
  idea("curved-thresholds", "Soft arches and curved thresholds", "Materials & details", "Use a few plaster curves to soften transitions without turning every opening into a motif."),
  idea("deep-window-seat", "Deep window seats", "Layout & architecture", "Thickened walls or deep reveals that become useful places to sit, read, or nap."),
  idea("walkthrough-pantry", "Walk-through pantry from garage", "Kitchen & dining", "Put grocery storage directly on the path from car to kitchen."),
  idea("drawer-base-cabinets", "Drawers instead of lower cabinet doors", "Kitchen & dining", "Make cookware and pantry items visible and reachable without crouching into deep cupboards."),
  idea("appliance-garage", "Concealed appliance garage", "Kitchen & dining", "Keep daily appliances plugged in and ready behind a lift-up or pocket door."),
  idea("prep-sink", "Small prep sink", "Kitchen & dining", "Create a second work point for washing produce, baking, or two cooks."),
  idea("plumbed-coffee", "Plumbed coffee station", "Kitchen & dining", "A compact breakfast station with water, power, cups, and beans together."),
  idea("dishwasher-drawers", "Dish storage beside the dishwasher", "Kitchen & dining", "Plan the unloading path so everyday dishes move only a step or two."),
  idea("compost-center", "Integrated trash, recycling, and compost", "Kitchen & dining", "Give each stream a ventilated, washable home near food prep and the route outdoors."),
  idea("toe-kick-drawers", "Toe-kick drawers", "Storage", "Use the shallow space below cabinets for trays, linens, or rarely used flat items."),
  idea("cabinet-outlets", "Outlets inside cabinets", "Daily convenience", "Charge small appliances, toothbrushes, and devices without countertop cord clutter."),
  idea("mudroom-lockers", "Mudroom lockers for each person", "Storage", "A landing place for coats, bags, shoes, keys, and sports gear with doors or curtains to hide the mess."),
  idea("package-closet", "Secure package vestibule", "Daily convenience", "A weather-protected, lockable delivery space accessible without opening the house."),
  idea("robot-vacuum-home", "Hidden robot-vacuum dock", "Daily convenience", "A powered niche where a robot can park and emerge without living in the hallway."),
  idea("charging-drawer", "Central charging drawer", "Daily convenience", "One ventilated drawer for phones, tablets, batteries, and their cables."),
  idea("floor-outlets", "Floor outlets where furniture floats", "Daily convenience", "Place power for lamps and devices without cords crossing circulation paths."),
  idea("built-in-step", "Built-in pull-out step stool", "Daily convenience", "A safe, easy-to-store boost for children and hard-to-reach kitchen storage."),
  idea("hot-cold-hose", "Hot and cold exterior hose taps", "Daily convenience", "Make pet washing, muddy cleanup, and outdoor chores more comfortable."),
  idea("acoustic-walls", "Acoustic insulation inside the house", "Comfort", "Quiet bedrooms, bathrooms, laundry, and media spaces—not just exterior walls."),
  idea("quiet-mechanical", "Keep mechanical equipment away from quiet rooms", "Comfort", "Plan ducts, pumps, condensers, and the mechanical room for low vibration and noise."),
  idea("ceiling-fans", "Ceiling fans planned from the start", "Comfort", "Wire and block for quiet, well-sized fans even in rooms where fixtures come later."),
  idea("zoned-comfort", "True heating and cooling zones", "Comfort", "Control bedroom, living, guest, and sun-exposed areas independently."),
  idea("fresh-air-system", "Balanced fresh-air system", "Energy & resilience", "An ERV or HRV can bring in filtered air while recovering energy from exhaust air."),
  idea("whole-house-dehumidification", "Whole-house humidity control", "Comfort", "Treat humidity as its own comfort target, especially in shoulder seasons or humid climates."),
  idea("screened-porch", "Screened outdoor room", "Outdoors & landscaping", "A breezy dining or lounging space that remains comfortable when insects are active."),
  idea("laundry-near-bedrooms", "Laundry near the bedrooms", "Laundry & utility", "Shorten the everyday route for clothing, towels, and linens."),
  idea("drying-cabinet", "Drying cabinet", "Laundry & utility", "Gently dry delicates, outdoor gear, gloves, and shoes without tumbling."),
  idea("laundry-hanging-rail", "Permanent laundry hanging rail", "Laundry & utility", "Reserve a full-length spot for air drying and just-ironed clothes."),
  idea("laundry-floor-drain", "Laundry floor drain and washer pan", "Laundry & utility", "Design for leaks with drainage, shutoff access, and a waterproofable floor."),
  idea("linen-near-laundry", "Linen storage beside laundry", "Laundry & utility", "Fold and put away household linens without carrying them through the house."),
  idea("curbless-showers", "Curbless showers", "Bath & wellness", "A clean visual line, easier cleaning, and step-free access when carefully sloped and waterproofed."),
  idea("bath-garden-view", "Bath with a private garden view", "Bath & wellness", "Use a courtyard, screened window, or planted wall to add daylight without sacrificing privacy."),
  idea("heated-towel-rail", "Heated towel rails", "Bath & wellness", "Warm towels while helping them dry faster between uses."),
  idea("steam-shower", "Steam shower", "Bath & wellness", "A compact wellness feature that needs early planning for enclosure, ventilation, and equipment."),
  idea("outdoor-powder-access", "Powder room accessible from outdoors", "Bath & wellness", "Let gardeners, swimmers, and guests reach a bathroom without crossing the whole house."),
  idea("clerestory-windows", "Clerestory windows", "Light & windows", "Bring in private, high daylight while preserving wall space below."),
  idea("interior-transoms", "Interior transom windows", "Light & windows", "Borrow light across halls, offices, or interior rooms while retaining separation."),
  idea("stair-skylight", "Skylight or roof light above the stair", "Light & windows", "Turn circulation into a daylight well for the center of the plan."),
  idea("warm-dim-lighting", "Warm-dim evening lighting", "Light & windows", "Choose fixtures that become warmer, not just darker, as they dim."),
  idea("night-path-lights", "Low nighttime path lights", "Light & windows", "Soft, low-level light at stairs, halls, and bathrooms without waking the whole house."),
  idea("hidden-shade-pockets", "Hidden window-shade pockets", "Light & windows", "Plan recessed space and power so blackout or solar shades disappear when open."),
  idea("dark-sky-exterior", "Dark-sky exterior lighting", "Light & windows", "Aim shielded, warm light downward for safer paths with less glare and sky glow."),
  idea("covered-outdoor-room", "Deep covered outdoor room", "Outdoors & landscaping", "Make outdoor living usable in rain and strong sun with enough depth for real furniture."),
  idea("native-rain-garden", "Native rain garden", "Outdoors & landscaping", "Turn roof runoff into a planted seasonal feature rather than sending it straight to a drain."),
  idea("small-orchard", "Small orchard or edible landscape", "Outdoors & landscaping", "Mix fruit, berries, herbs, and attractive perennial edibles into the larger landscape plan."),
  idea("potting-zone", "Potting and garden-work zone", "Outdoors & landscaping", "A durable counter, sink, tool storage, and soil space near the garden."),
  idea("discreet-clothesline", "Discreet sunny clothesline", "Outdoors & landscaping", "A convenient outdoor drying spot that can be screened from primary views."),
  idea("pet-wash", "Pet wash near an outside door", "Laundry & utility", "Contain wet paws and muddy gear in a tiled, easy-to-clean station."),
  idea("solar-ready-roof", "Solar-ready roof geometry", "Energy & resilience", "Reserve an unbroken, well-oriented roof plane and an electrical path even if panels come later."),
  idea("battery-generator-ready", "Battery or generator ready", "Energy & resilience", "Plan critical circuits, transfer equipment space, and conduit before walls close."),
  idea("heat-pump-water-heater", "Heat-pump water heater", "Energy & resilience", "Explore efficient water heating while planning for air volume, condensate, sound, and location."),
  idea("conditioned-attic", "Conditioned mechanical attic", "Energy & resilience", "Keep ducts and equipment inside the insulated envelope where climate and roof design support it."),
  idea("smart-water-shutoff", "Automatic leak detection and water shutoff", "Energy & resilience", "Use sensors and a main shutoff valve to limit damage from hidden leaks."),
  idea("drain-heat-recovery", "Drain-water heat recovery", "Energy & resilience", "Capture some heat from warm shower water to preheat incoming water."),
  idea("exterior-shading", "Exterior solar shading", "Energy & resilience", "Use overhangs, screens, trees, or exterior shades to stop summer heat before it reaches the glass."),
  idea("high-performance-windows", "High-performance windows with install details", "Energy & resilience", "Compare whole-window performance and insist on careful flashing, air sealing, and thermal continuity."),
  idea("blower-door-goal", "Set an airtightness goal", "Energy & resilience", "Include blower-door testing and commissioning as design requirements, not afterthoughts."),
  idea("utility-monitoring", "Whole-house energy and water monitoring", "Energy & resilience", "Make unusual use visible and learn which systems are actually consuming resources."),
  idea("wood-ceilings", "Warm wood ceilings in selected rooms", "Materials & details", "Use wood overhead to give a kitchen, porch, or low volume warmth and acoustic softness."),
  idea("inside-out-material", "Carry one material from inside to outside", "Materials & details", "A continuous wall, floor tone, or ceiling can make a threshold feel expansive."),
  idea("flush-thresholds", "Flush indoor-outdoor thresholds", "Materials & details", "Coordinate structure, drainage, doors, and waterproofing early for a genuinely level transition."),
  idea("no-step-entry", "At least one no-step entry", "Future-proofing", "Make everyday access easier for strollers, carts, injuries, aging, and visitors."),
  idea("wide-doors", "Comfortably wide doors and halls", "Future-proofing", "A little extra clearance improves moving furniture and long-term accessibility."),
  idea("future-lift", "Stack closets for a possible future lift", "Future-proofing", "Vertically align small storage rooms so a compact lift could be added later."),
  idea("grab-bar-blocking", "Blocking for future grab bars", "Future-proofing", "Put backing in bathroom walls now so support hardware can be added securely later."),
  idea("flex-room", "Ground-floor flex room", "Future-proofing", "A room that can shift among office, guest room, playroom, or bedroom as life changes."),
  idea("service-chase", "Accessible plumbing and wiring chase", "Future-proofing", "Concentrate services where repairs and future changes do not require opening finished rooms."),
  idea("spare-conduit", "Spare conduit to roof, yard, and garage", "Future-proofing", "Create inexpensive pathways for future solar, data, gates, outbuildings, or unknown technology."),
  idea("wired-network", "Wired network and ceiling access points", "Future-proofing", "Run Ethernet to work areas, televisions, cameras, and planned Wi-Fi access points."),
  idea("ev-ready", "EV-ready garage or parking", "Future-proofing", "Reserve electrical capacity and conduit even if charging equipment comes later."),
];

export const ALL_IDEAS = [...USER_IDEAS, ...BRAINSTORM_IDEAS, ...FRESH_BRAINSTORM_IDEAS];
