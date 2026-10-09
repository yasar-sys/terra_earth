export type AmbientAnimationType = "wave" | "mist" | "sway" | "ripple" | "glow" | "tide" | "rain" | "drift";
export type CharacterAccessory = "scarf" | "cap-band" | "satchel" | "notebook" | "pin" | "cuff" | "collar" | "lens" | "ribbon" | "badge" | "hat-stitch" | "pocket";
export interface DistrictTheme {
  gradientColors: readonly [string, string, string];
  ambientAnimationType: AmbientAnimationType;
  ambientAnimationParams: { speed: number; opacity: number; density: number; angle: number };
  characterAccent: { color: string; accessory: CharacterAccessory; mark: number };
  themeRationale: string;
}

export type DistrictLandscape = "coast" | "wetland" | "hills" | "forest" | "fields" | "river" | "city" | "dryland";
export type DistrictChatStyle = "notebook" | "river-glass" | "canopy" | "observatory" | "field-note" | "harbor" | "rain-window" | "lantern";

export interface DistrictScene {
  landscape: DistrictLandscape;
  chatStyle: DistrictChatStyle;
  composition: number;
  horizon: number;
  sunPosition: number;
  foregroundScale: number;
}

export const DISTRICT_THEMES = {
  // Barguna: Low-lying coastal district facing the Bay of Bengal; visual cue: Bay of Bengal coastline.
  'barguna': { gradientColors: ['#162F36', '#1E2952', '#1D3C3F'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 8.2, opacity: 0.11, density: 3, angle: 0 }, characterAccent: { color: '#D3A75A', accessory: 'scarf', mark: 1 }, themeRationale: 'Low-lying coastal district facing the Bay of Bengal' },
  // Barishal: Dense delta of rivers and canals converging near the Kirtankhola; visual cue: Kirtankhola River.
  'barishal': { gradientColors: ['#1B2837', '#292352', '#22373F'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 8.9, opacity: 0.128, density: 4, angle: 23 }, characterAccent: { color: '#A56AD2', accessory: 'cap-band', mark: 2 }, themeRationale: 'Dense delta of rivers and canals converging near the Kirtankhola' },
  // Bhola: Bangladesh\'s largest riverine island shaped by tidal estuaries; visual cue: Meghna estuary island.
  'bhola': { gradientColors: ['#19313E', '#212459', '#1D3F3E'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 9.6, opacity: 0.146, density: 5, angle: 46 }, characterAccent: { color: '#79B8D2', accessory: 'satchel', mark: 3 }, themeRationale: 'Bangladesh\'s largest riverine island shaped by tidal estuaries' },
  // Jhalokati: Small district webbed by tidal distributary channels; visual cue: Sugandha River.
  'jhalokati': { gradientColors: ['#192333', '#352659', '#22393F'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 10.3, opacity: 0.164, density: 6, angle: 69 }, characterAccent: { color: '#66C7A0', accessory: 'notebook', mark: 4 }, themeRationale: 'Small district webbed by tidal distributary channels' },
  // Patuakhali: Coastal lowland with mangrove fringe near Kuakata beach; visual cue: Kuakata sea beach.
  'patuakhali': { gradientColors: ['#182B3A', '#241E52', '#1D3F3B'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 11.0, opacity: 0.182, density: 7, angle: 92 }, characterAccent: { color: '#D6CB66', accessory: 'pin', mark: 5 }, themeRationale: 'Coastal lowland with mangrove fringe near Kuakata beach' },
  // Pirojpur: Canal-crossed delta land near the Sundarbans edge; visual cue: Sundarbans buffer waterways.
  'pirojpur': { gradientColors: ['#1D243A', '#382352', '#223C3F'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 11.7, opacity: 0.2, density: 3, angle: 115 }, characterAccent: { color: '#D676B9', accessory: 'cuff', mark: 6 }, themeRationale: 'Canal-crossed delta land near the Sundarbans edge' },
  // Bandarban: Highest hill district with cloud-wrapped peaks and valleys; visual cue: Keokradong hill range.
  'bandarban': { gradientColors: ['#1D2F2F', '#2B3350', '#25372A'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 12.4, opacity: 0.11, density: 4, angle: 138 }, characterAccent: { color: '#627CCB', accessory: 'collar', mark: 7 }, themeRationale: 'Highest hill district with cloud-wrapped peaks and valleys' },
  // Brahmanbaria: Floodplain beside the Titas river\'s looping bends; visual cue: Titas River.
  'brahmanbaria': { gradientColors: ['#193233', '#253656', '#213B2F'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 13.1, opacity: 0.128, density: 5, angle: 161 }, characterAccent: { color: '#9BCB72', accessory: 'lens', mark: 8 }, themeRationale: 'Floodplain beside the Titas river\'s looping bends' },
  // Chandpur: Meeting point of the Padma, Meghna and Dakatia rivers; visual cue: Padma-Meghna confluence.
  'chandpur': { gradientColors: ['#1D2A3A', '#2A224F', '#213B39'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 13.8, opacity: 0.146, density: 6, angle: 184 }, characterAccent: { color: '#DA8A72', accessory: 'ribbon', mark: 9 }, themeRationale: 'Meeting point of the Padma, Meghna and Dakatia rivers' },
  // Chattogram: Hilly port city facing the Bay of Bengal coastline; visual cue: Patenga sea beach.
  'chattogram': { gradientColors: ['#162C36', '#212056', '#1F3F42'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 8.2, opacity: 0.164, density: 7, angle: 207 }, characterAccent: { color: '#755ECF', accessory: 'badge', mark: 10 }, themeRationale: 'Hilly port city facing the Bay of Bengal coastline' },
  // Cumilla: Undulating red-soil plain dotted with lychee groves; visual cue: Lalmai hills.
  'cumilla': { gradientColors: ['#1E2F1D', '#294C41', '#293423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 8.9, opacity: 0.182, density: 3, angle: 230 }, characterAccent: { color: '#6ECFC8', accessory: 'hat-stitch', mark: 11 }, themeRationale: 'Undulating red-soil plain dotted with lychee groves' },
  // Cox's Bazar: World\'s longest natural sea beach along open coast; visual cue: Cox\'s Bazar beach.
  'coxs-bazar': { gradientColors: ['#192E3E', '#2D225D', '#1F4242'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 9.6, opacity: 0.2, density: 4, angle: 253 }, characterAccent: { color: '#CF7D9B', accessory: 'pocket', mark: 12 }, themeRationale: 'World\'s longest natural sea beach along open coast' },
  // Feni: Low estuarine plain near the Feni river mouth; visual cue: Feni River.
  'feni': { gradientColors: ['#192033', '#39224F', '#21363B'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 10.3, opacity: 0.11, density: 5, angle: 276 }, characterAccent: { color: '#C7D35A', accessory: 'scarf', mark: 13 }, themeRationale: 'Low estuarine plain near the Feni river mouth' },
  // Khagrachhari: Forested hill valleys of the Chittagong Hill Tracts; visual cue: Alutila hill cave.
  'khagrachhari': { gradientColors: ['#1F3233', '#29414C', '#273A2E'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 11.0, opacity: 0.128, density: 6, angle: 299 }, characterAccent: { color: '#BA6AD2', accessory: 'cap-band', mark: 14 }, themeRationale: 'Forested hill valleys of the Chittagong Hill Tracts' },
  // Lakshmipur: Shifting char lands along the shifting Meghna bank; visual cue: Meghna River chars.
  'lakshmipur': { gradientColors: ['#322620', '#4B4B2A', '#332425'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 11.7, opacity: 0.146, density: 7, angle: 322 }, characterAccent: { color: '#79A6D2', accessory: 'satchel', mark: 15 }, themeRationale: 'Shifting char lands along the shifting Meghna bank' },
  // Noakhali: Emerging coastal chars reshaped by Bay of Bengal tides; visual cue: Noakhali coastal chars.
  'noakhali': { gradientColors: ['#162D36', '#22225D', '#1F423B'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 12.4, opacity: 0.164, density: 3, angle: 345 }, characterAccent: { color: '#66C77A', accessory: 'notebook', mark: 16 }, themeRationale: 'Emerging coastal chars reshaped by Bay of Bengal tides' },
  // Rangamati: Hilly lakeside district around a vast reservoir; visual cue: Kaptai Lake.
  'rangamati': { gradientColors: ['#1F332F', '#273649', '#253729'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 13.1, opacity: 0.182, density: 4, angle: 8 }, characterAccent: { color: '#D6AD66', accessory: 'pin', mark: 17 }, themeRationale: 'Hilly lakeside district around a vast reservoir' },
  // Dhaka: Dense capital skyline beside the busy Buriganga riverfront; visual cue: Buriganga River and city lights.
  'dhaka': { gradientColors: ['#1D273A', '#372352', '#223F3D'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 13.8, opacity: 0.2, density: 5, angle: 31 }, characterAccent: { color: '#AC76D6', accessory: 'cuff', mark: 18 }, themeRationale: 'Dense capital skyline beside the busy Buriganga riverfront' },
  // Faridpur: Padma riverside plain prone to shifting sandbars; visual cue: Padma River.
  'faridpur': { gradientColors: ['#2C241C', '#404B2A', '#332624'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 8.2, opacity: 0.11, density: 6, angle: 54 }, characterAccent: { color: '#62ABCB', accessory: 'collar', mark: 19 }, themeRationale: 'Padma riverside plain prone to shifting sandbars' },
  // Gazipur: Sal forest tracts swaying north of the capital; visual cue: Bhawal Sal forest.
  'gazipur': { gradientColors: ['#1D2F1E', '#2B503A', '#2C3725'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 8.9, opacity: 0.128, density: 7, angle: 77 }, characterAccent: { color: '#72CBA7', accessory: 'lens', mark: 20 }, themeRationale: 'Sal forest tracts swaying north of the capital' },
  // Gopalganj: Low-lying riverine plain shaped by the Madhumati floodplain; visual cue: Madhumati River.
  'gopalganj': { gradientColors: ['#1B2D37', '#202D4B', '#1F3832'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 9.6, opacity: 0.146, density: 3, angle: 100 }, characterAccent: { color: '#DACF72', accessory: 'ribbon', mark: 21 }, themeRationale: 'Low-lying riverine plain shaped by the Madhumati floodplain' },
  // Kishoreganj: Seasonal haor basin flooding into a vast wetland; visual cue: Nikli haor.
  'kishoreganj': { gradientColors: ['#182F30', '#222B4F', '#213B34'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 10.3, opacity: 0.164, density: 4, angle: 123 }, characterAccent: { color: '#CF5EAD', accessory: 'badge', mark: 22 }, themeRationale: 'Seasonal haor basin flooding into a vast wetland' },
  // Madaripur: Padma-adjacent lowland with migrating river chars; visual cue: Padma River chars.
  'madaripur': { gradientColors: ['#2F241E', '#464B2A', '#332424'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 11.0, opacity: 0.182, density: 5, angle: 146 }, characterAccent: { color: '#6E86CF', accessory: 'hat-stitch', mark: 23 }, themeRationale: 'Padma-adjacent lowland with migrating river chars' },
  // Manikganj: Char-studded floodplain where the Padma shifts course; visual cue: Padma River.
  'manikganj': { gradientColors: ['#322720', '#464E2C', '#362627'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 11.7, opacity: 0.2, density: 6, angle: 169 }, characterAccent: { color: '#A3CF7D', accessory: 'pocket', mark: 24 }, themeRationale: 'Char-studded floodplain where the Padma shifts course' },
  // Munshiganj: Riverine district at the Padma-Meghna-Dhaleshwari junction; visual cue: Padma-Meghna junction.
  'munshiganj': { gradientColors: ['#192333', '#37224F', '#213A3B'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 12.4, opacity: 0.11, density: 7, angle: 192 }, characterAccent: { color: '#D3765A', accessory: 'scarf', mark: 25 }, themeRationale: 'Riverine district at the Padma-Meghna-Dhaleshwari junction' },
  // Narayanganj: River port town on the tidal Shitalakshya; visual cue: Shitalakshya River.
  'narayanganj': { gradientColors: ['#1B2437', '#262352', '#223F3E'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 13.1, opacity: 0.128, density: 3, angle: 215 }, characterAccent: { color: '#7F6AD2', accessory: 'cap-band', mark: 26 }, themeRationale: 'River port town on the tidal Shitalakshya' },
  // Narsingdi: Fertile plain with breezy riverside cropfields; visual cue: Meghna River bank.
  'narsingdi': { gradientColors: ['#1F3320', '#294C39', '#2F3423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 13.8, opacity: 0.146, density: 4, angle: 238 }, characterAccent: { color: '#79D2CC', accessory: 'satchel', mark: 27 }, themeRationale: 'Fertile plain with breezy riverside cropfields' },
  // Rajbari: Padma riverbank district reshaped by seasonal erosion; visual cue: Padma River.
  'rajbari': { gradientColors: ['#2C261C', '#4D4E2C', '#362826'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 8.2, opacity: 0.164, density: 5, angle: 261 }, characterAccent: { color: '#C7668A', accessory: 'notebook', mark: 28 }, themeRationale: 'Padma riverbank district reshaped by seasonal erosion' },
  // Shariatpur: Low delta land facing the wide Padma-Meghna flow; visual cue: Padma River.
  'shariatpur': { gradientColors: ['#1B2937', '#2F224F', '#21343B'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 8.9, opacity: 0.182, density: 6, angle: 284 }, characterAccent: { color: '#CBD666', accessory: 'pin', mark: 29 }, themeRationale: 'Low delta land facing the wide Padma-Meghna flow' },
  // Tangail: Sal forest highland with swaying woodland canopy; visual cue: Madhupur Sal forest.
  'tangail': { gradientColors: ['#22331F', '#27493F', '#2D3725'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 9.6, opacity: 0.2, density: 7, angle: 307 }, characterAccent: { color: '#BF76D6', accessory: 'cuff', mark: 30 }, themeRationale: 'Sal forest highland with swaying woodland canopy' },
  // Bagerhat: Coastal district bordering the mangrove Sundarbans; visual cue: Sundarbans mangrove forest.
  'bagerhat': { gradientColors: ['#162C36', '#2D2159', '#1D3F3D'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 10.3, opacity: 0.11, density: 3, angle: 330 }, characterAccent: { color: '#6296CB', accessory: 'collar', mark: 31 }, themeRationale: 'Coastal district bordering the mangrove Sundarbans' },
  // Chuadanga: Dry western plain with warm open farmland horizons; visual cue: Mathabhanga River.
  'chuadanga': { gradientColors: ['#352A18', '#575822', '#3D221F'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 11.0, opacity: 0.128, density: 4, angle: 353 }, characterAccent: { color: '#72CB83', accessory: 'lens', mark: 32 }, themeRationale: 'Dry western plain with warm open farmland horizons' },
  // Jashore: Flat agricultural plain known for flower fields; visual cue: Jashore flower fields.
  'jashore': { gradientColors: ['#1F331F', '#254634', '#2D3423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 11.7, opacity: 0.146, density: 5, angle: 16 }, characterAccent: { color: '#DAB472', accessory: 'ribbon', mark: 33 }, themeRationale: 'Flat agricultural plain known for flower fields' },
  // Jhenaidah: Quiet plains along the meandering Nabaganga river; visual cue: Nabaganga River.
  'jhenaidah': { gradientColors: ['#1B2C1C', '#274939', '#303725'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 12.4, opacity: 0.164, density: 6, angle: 39 }, characterAccent: { color: '#9E5ECF', accessory: 'badge', mark: 34 }, themeRationale: 'Quiet plains along the meandering Nabaganga river' },
  // Khulna: Gateway to the Sundarbans mangrove delta and tidal creeks; visual cue: Sundarbans mangrove creeks.
  'khulna': { gradientColors: ['#18283A', '#232159', '#1D3F36'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 13.1, opacity: 0.182, density: 7, angle: 62 }, characterAccent: { color: '#6EB1CF', accessory: 'hat-stitch', mark: 35 }, themeRationale: 'Gateway to the Sundarbans mangrove delta and tidal creeks' },
  // Kushtia: Riverside district beside the historic Padma\'s Hardinge Bridge; visual cue: Hardinge Bridge, Padma.
  'kushtia': { gradientColors: ['#1D2C3A', '#392659', '#223F3D'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 13.8, opacity: 0.2, density: 3, angle: 85 }, characterAccent: { color: '#7DCFAE', accessory: 'pocket', mark: 36 }, themeRationale: 'Riverside district beside the historic Padma\'s Hardinge Bridge' },
  // Magura: Small quiet plain drained by the gentle Nabaganga; visual cue: Nabaganga River.
  'magura': { gradientColors: ['#1D2C1B', '#25463F', '#293423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 8.2, opacity: 0.11, density: 4, angle: 108 }, characterAccent: { color: '#D3C75A', accessory: 'scarf', mark: 37 }, themeRationale: 'Small quiet plain drained by the gentle Nabaganga' },
  // Meherpur: Border plain with dry western farmland light; visual cue: Bhairab River.
  'meherpur': { gradientColors: ['#352818', '#37511F', '#3D271F'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 8.9, opacity: 0.128, density: 5, angle: 131 }, characterAccent: { color: '#D26AB3', accessory: 'cap-band', mark: 38 }, themeRationale: 'Border plain with dry western farmland light' },
  // Narail: River-laced plain along the winding Chitra river; visual cue: Chitra River.
  'narail': { gradientColors: ['#1B3237', '#233452', '#1F3832'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 9.6, opacity: 0.146, density: 6, angle: 154 }, characterAccent: { color: '#798FD2', accessory: 'satchel', mark: 39 }, themeRationale: 'River-laced plain along the winding Chitra river' },
  // Satkhira: Southwestern coastal edge bordering Sundarbans tidal creeks; visual cue: Sundarbans mangrove edge.
  'satkhira': { gradientColors: ['#162836', '#22265D', '#1F4240'], ambientAnimationType: 'wave', ambientAnimationParams: { speed: 10.3, opacity: 0.164, density: 7, angle: 177 }, characterAccent: { color: '#93C766', accessory: 'notebook', mark: 40 }, themeRationale: 'Southwestern coastal edge bordering Sundarbans tidal creeks' },
  // Jamalpur: Jamuna riverside plain with shifting sandy chars; visual cue: Jamuna River chars.
  'jamalpur': { gradientColors: ['#2F271E', '#424527', '#332424'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 11.0, opacity: 0.182, density: 3, angle: 200 }, characterAccent: { color: '#D68066', accessory: 'pin', mark: 41 }, themeRationale: 'Jamuna riverside plain with shifting sandy chars' },
  // Mymensingh: Old Brahmaputra floodplain with looping oxbow channels; visual cue: Old Brahmaputra River.
  'mymensingh': { gradientColors: ['#1B2D37', '#22264F', '#213B31'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 11.7, opacity: 0.2, density: 4, angle: 223 }, characterAccent: { color: '#8976D6', accessory: 'cuff', mark: 42 }, themeRationale: 'Old Brahmaputra floodplain with looping oxbow channels' },
  // Netrokona: Haor wetlands flooding wide in the monsoon basin; visual cue: Netrokona haor basin.
  'netrokona': { gradientColors: ['#182F30', '#232452', '#1F382D'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 12.4, opacity: 0.11, density: 5, angle: 246 }, characterAccent: { color: '#62CBC4', accessory: 'collar', mark: 43 }, themeRationale: 'Haor wetlands flooding wide in the monsoon basin' },
  // Sherpur: Foothill district beneath the Garo Hills border ridge; visual cue: Garo Hills foothills.
  'sherpur': { gradientColors: ['#1F332E', '#2D3653', '#273A2B'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 13.1, opacity: 0.128, density: 6, angle: 269 }, characterAccent: { color: '#CB7292', accessory: 'lens', mark: 44 }, themeRationale: 'Foothill district beneath the Garo Hills border ridge' },
  // Bogura: Broad Karatoya river plain of open farmland; visual cue: Karatoya River.
  'bogura': { gradientColors: ['#21331F', '#254633', '#2F3423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 13.8, opacity: 0.146, density: 7, angle: 292 }, characterAccent: { color: '#CFDA72', accessory: 'ribbon', mark: 45 }, themeRationale: 'Broad Karatoya river plain of open farmland' },
  // Joypurhat: Small Barind tract plain with dry upland fields; visual cue: Barind Tract.
  'joypurhat': { gradientColors: ['#312716', '#49511F', '#3D281F'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 8.2, opacity: 0.164, density: 3, angle: 315 }, characterAccent: { color: '#B55ECF', accessory: 'badge', mark: 46 }, themeRationale: 'Small Barind tract plain with dry upland fields' },
  // Naogaon: Barind upland tract known for mango orchards; visual cue: Barind Tract.
  'naogaon': { gradientColors: ['#352B18', '#485421', '#3A251D'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 8.9, opacity: 0.182, density: 4, angle: 338 }, characterAccent: { color: '#6E9ECF', accessory: 'hat-stitch', mark: 47 }, themeRationale: 'Barind upland tract known for mango orchards' },
  // Natore: Barind-adjacent plain with historic garden estates; visual cue: Uttara Gono Bhaban gardens.
  'natore': { gradientColors: ['#383019', '#475822', '#3D251F'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 9.6, opacity: 0.2, density: 5, angle: 1 }, characterAccent: { color: '#7DCF8D', accessory: 'pocket', mark: 48 }, themeRationale: 'Barind-adjacent plain with historic garden estates' },
  // Chapai Nawabganj: Dry Barind border plain famed for mango groves; visual cue: Mango orchards, Padma bank.
  'chapai-nawabganj': { gradientColors: ['#312B16', '#3A4D1E', '#3A221D'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 10.3, opacity: 0.11, density: 6, angle: 24 }, characterAccent: { color: '#D3A75A', accessory: 'scarf', mark: 49 }, themeRationale: 'Dry Barind border plain famed for mango groves' },
  // Pabna: Padma riverside plain with active char formation; visual cue: Padma River.
  'pabna': { gradientColors: ['#1B2937', '#3B2352', '#223B3F'], ambientAnimationType: 'tide', ambientAnimationParams: { speed: 11.0, opacity: 0.128, density: 7, angle: 47 }, characterAccent: { color: '#A56AD2', accessory: 'cap-band', mark: 50 }, themeRationale: 'Padma riverside plain with active char formation' },
  // Rajshahi: Padma riverside city on the dry Barind Tract; visual cue: Padma River, Barind Tract.
  'rajshahi': { gradientColors: ['#382919', '#525421', '#3A1F1D'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 11.7, opacity: 0.146, density: 3, angle: 70 }, characterAccent: { color: '#79B8D2', accessory: 'satchel', mark: 51 }, themeRationale: 'Padma riverside city on the dry Barind Tract' },
  // Sirajganj: Jamuna riverside district facing constant channel shifts; visual cue: Jamuna River.
  'sirajganj': { gradientColors: ['#2C221C', '#4E4E2C', '#362628'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 12.4, opacity: 0.164, density: 4, angle: 93 }, characterAccent: { color: '#66C7A0', accessory: 'notebook', mark: 52 }, themeRationale: 'Jamuna riverside district facing constant channel shifts' },
  // Dinajpur: Wide northern plain of open rice fields; visual cue: Northern plains farmland.
  'dinajpur': { gradientColors: ['#1E2F1D', '#254638', '#2E3423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 13.1, opacity: 0.182, density: 5, angle: 116 }, characterAccent: { color: '#D6CB66', accessory: 'pin', mark: 53 }, themeRationale: 'Wide northern plain of open rice fields' },
  // Gaibandha: Jamuna-Brahmaputra char lands reshaped every flood season; visual cue: Jamuna River chars.
  'gaibandha': { gradientColors: ['#322920', '#434828', '#362629'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 13.8, opacity: 0.2, density: 6, angle: 139 }, characterAccent: { color: '#D676B9', accessory: 'cuff', mark: 54 }, themeRationale: 'Jamuna-Brahmaputra char lands reshaped every flood season' },
  // Kurigram: Northern char district amid the braided Brahmaputra; visual cue: Brahmaputra River chars.
  'kurigram': { gradientColors: ['#2C251C', '#434B2A', '#332624'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 8.2, opacity: 0.11, density: 7, angle: 162 }, characterAccent: { color: '#627CCB', accessory: 'collar', mark: 55 }, themeRationale: 'Northern char district amid the braided Brahmaputra' },
  // Lalmonirhat: Teesta riverside plain with shifting sandy chars; visual cue: Teesta River chars.
  'lalmonirhat': { gradientColors: ['#2F281E', '#434E2C', '#362826'], ambientAnimationType: 'drift', ambientAnimationParams: { speed: 8.9, opacity: 0.128, density: 3, angle: 185 }, characterAccent: { color: '#9BCB72', accessory: 'lens', mark: 56 }, themeRationale: 'Teesta riverside plain with shifting sandy chars' },
  // Nilphamari: Northern plain near the Teesta barrage headworks; visual cue: Teesta Barrage.
  'nilphamari': { gradientColors: ['#382819', '#4C4D1E', '#3A231D'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 9.6, opacity: 0.146, density: 4, angle: 208 }, characterAccent: { color: '#DA8A72', accessory: 'ribbon', mark: 57 }, themeRationale: 'Northern plain near the Teesta barrage headworks' },
  // Panchagarh: Northernmost district with Himalayan foothill views; visual cue: Kanchenjunga viewpoint.
  'panchagarh': { gradientColors: ['#1D2F2B', '#293F4C', '#273A2F'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 10.3, opacity: 0.164, density: 5, angle: 231 }, characterAccent: { color: '#755ECF', accessory: 'badge', mark: 58 }, themeRationale: 'Northernmost district with Himalayan foothill views' },
  // Rangpur: Open northern plain beside the Ghaghot river; visual cue: Ghaghot River.
  'rangpur': { gradientColors: ['#1F2F1D', '#294C3C', '#2C3423'], ambientAnimationType: 'sway', ambientAnimationParams: { speed: 11.0, opacity: 0.182, density: 6, angle: 254 }, characterAccent: { color: '#6ECFC8', accessory: 'hat-stitch', mark: 59 }, themeRationale: 'Open northern plain beside the Ghaghot river' },
  // Thakurgaon: Quiet northwestern plain of the upper Tangon basin; visual cue: Tangon River.
  'thakurgaon': { gradientColors: ['#382C19', '#495822', '#3D211F'], ambientAnimationType: 'glow', ambientAnimationParams: { speed: 11.7, opacity: 0.2, density: 7, angle: 277 }, characterAccent: { color: '#CF7D9B', accessory: 'pocket', mark: 60 }, themeRationale: 'Quiet northwestern plain of the upper Tangon basin' },
  // Habiganj: Tea garden hills and haor wetlands combined; visual cue: Satchari hill forest.
  'habiganj': { gradientColors: ['#1D2F2E', '#273449', '#25372A'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 12.4, opacity: 0.11, density: 3, angle: 300 }, characterAccent: { color: '#C7D35A', accessory: 'scarf', mark: 61 }, themeRationale: 'Tea garden hills and haor wetlands combined' },
  // Moulvibazar: Rolling tea garden hills of greater Sylhet; visual cue: Lawachara rainforest.
  'moulvibazar': { gradientColors: ['#1F3332', '#29344C', '#273A2B'], ambientAnimationType: 'mist', ambientAnimationParams: { speed: 13.1, opacity: 0.128, density: 4, angle: 323 }, characterAccent: { color: '#BA6AD2', accessory: 'cap-band', mark: 62 }, themeRationale: 'Rolling tea garden hills of greater Sylhet' },
  // Sunamganj: Vast haor wetland flooding beneath the Meghalaya hills; visual cue: Tanguar Haor.
  'sunamganj': { gradientColors: ['#1B2D37', '#233752', '#1F382B'], ambientAnimationType: 'ripple', ambientAnimationParams: { speed: 13.8, opacity: 0.146, density: 5, angle: 346 }, characterAccent: { color: '#79A6D2', accessory: 'satchel', mark: 63 }, themeRationale: 'Vast haor wetland flooding beneath the Meghalaya hills' },
  // Sylhet: High-rainfall hill-fringed valley beside the Surma river; visual cue: Surma River valley.
  'sylhet': { gradientColors: ['#1A1C32', '#432857', '#24293D'], ambientAnimationType: 'rain', ambientAnimationParams: { speed: 8.2, opacity: 0.164, density: 6, angle: 9 }, characterAccent: { color: '#66C77A', accessory: 'notebook', mark: 64 }, themeRationale: 'High-rainfall hill-fringed valley beside the Surma river' },
} as const satisfies Record<string, DistrictTheme>;

export type DistrictThemeId = keyof typeof DISTRICT_THEMES;

export function getDistrictTheme(id: string): DistrictTheme {
  return DISTRICT_THEMES[id as DistrictThemeId] ?? DISTRICT_THEMES.dhaka;
}

const LANDSCAPE_BY_AMBIENT: Record<AmbientAnimationType, DistrictLandscape> = {
  wave: "coast",
  tide: "river",
  ripple: "wetland",
  mist: "hills",
  sway: "fields",
  glow: "dryland",
  rain: "forest",
  drift: "river",
};

const CHAT_STYLES: DistrictChatStyle[] = ["notebook", "river-glass", "canopy", "observatory", "field-note", "harbor", "rain-window", "lantern"];

/**
 * Turns each explicit district record into a unique scenic composition. The
 * configured mark is stable, so a district keeps the same horizon, framing,
 * lighting and conversation treatment across visits.
 */
export function getDistrictScene(id: string): DistrictScene {
  const theme = getDistrictTheme(id);
  const mark = theme.characterAccent.mark;
  const baseLandscape = LANDSCAPE_BY_AMBIENT[theme.ambientAnimationType];
  const landscape: DistrictLandscape = id === "dhaka" || id === "narayanganj"
    ? "city"
    : id === "gazipur" || id === "bagerhat" || id === "khulna"
      ? "forest"
      : baseLandscape;

  return {
    landscape,
    chatStyle: CHAT_STYLES[(mark - 1) % CHAT_STYLES.length] ?? "notebook",
    composition: ((mark - 1) % 16) + 1,
    horizon: 48 + ((mark * 7) % 18),
    sunPosition: 12 + ((mark * 13) % 72),
    foregroundScale: 88 + ((mark * 11) % 25),
  };
}
