/**
 * Geographic coordinate resolver for WAC Directory entities.
 *
 * Resolution priority:
 *   1. Stored exact lat/lng       (precision: "exact")
 *   2. City text lookup           (precision: "city")
 *   3. State / region lookup      (precision: "state")
 *   4. Country centroid           (precision: "country")
 *   5. null — entity cannot be mapped
 *
 * GeoJSON convention: coordinates are [longitude, latitude].
 * All lookups store [lat, lng]; conversion to [lng, lat] happens at the call site.
 */

export type GeoPrecision = "exact" | "city" | "state" | "country";

export interface ResolvedCoords {
  lat: number;
  lng: number;
  precision: GeoPrecision;
}

// ── Country centroids [lat, lng] ──────────────────────────────────────────────
// Sources: geographic centres of population mass

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  // Balkans & SE Europe
  "albania":               [41.1533,  20.1683],
  "shqipëri":              [41.1533,  20.1683],
  "shqiperi":              [41.1533,  20.1683],
  "shqipëria":             [41.1533,  20.1683],
  "shqiperia":             [41.1533,  20.1683],
  "kosovo":                [42.6026,  20.9030],
  "kosova":                [42.6026,  20.9030],
  "kosovë":                [42.6026,  20.9030],
  "kosove":                [42.6026,  20.9030],
  "north macedonia":       [41.6086,  21.7453],
  "macedonia":             [41.6086,  21.7453],
  "maqedonia":             [41.6086,  21.7453],
  "maqedonia e veriut":    [41.6086,  21.7453],
  "montenegro":            [42.7087,  19.3744],
  "mali i zi":             [42.7087,  19.3744],
  "serbia":                [44.0165,  21.0059],
  "croatia":               [45.1000,  15.2000],
  "slovenia":              [46.1512,  14.9955],
  "bosnia and herzegovina":[43.9159,  17.6791],
  "bosnia":                [43.9159,  17.6791],
  "bulgaria":              [42.7339,  25.4858],
  "romania":               [45.9432,  24.9668],
  "greece":                [39.0742,  21.8243],
  "greqi":                 [39.0742,  21.8243],
  "greqia":                [39.0742,  21.8243],

  // Western Europe
  "united kingdom":        [51.5074,  -0.1278],
  "uk":                    [51.5074,  -0.1278],
  "u.k.":                  [51.5074,  -0.1278],
  "great britain":         [51.5074,  -0.1278],
  "britain":               [51.5074,  -0.1278],
  "britania":              [51.5074,  -0.1278],
  "britania e madhe":      [51.5074,  -0.1278],
  "mbretëria e bashkuar":  [51.5074,  -0.1278],
  "mbreteria e bashkuar":  [51.5074,  -0.1278],
  "england":               [52.3555,  -1.1743],
  "scotland":              [56.4907,  -4.2026],
  "wales":                 [52.1307,  -3.7837],
  "ireland":               [53.4129,  -8.2439],
  "france":                [46.2276,   2.2137],
  "francë":                [46.2276,   2.2137],
  "franca":                [46.2276,   2.2137],
  "belgium":               [50.5039,   4.4699],
  "belgjikë":              [50.5039,   4.4699],
  "belgjika":              [50.5039,   4.4699],
  "netherlands":           [52.1326,   5.2913],
  "holland":               [52.1326,   5.2913],
  "holandë":               [52.1326,   5.2913],
  "holanda":               [52.1326,   5.2913],
  "luxembourg":            [49.8153,   6.1296],
  "germany":               [51.1657,  10.4515],
  "gjermani":              [51.1657,  10.4515],
  "gjermania":             [51.1657,  10.4515],
  "austria":               [47.5162,  14.5501],
  "switzerland":           [46.8182,   8.2275],
  "zvicër":                [46.8182,   8.2275],
  "zvicer":                [46.8182,   8.2275],
  "zvicra":                [46.8182,   8.2275],

  // Southern Europe
  "italy":                 [41.8719,  12.5674],
  "itali":                 [41.8719,  12.5674],
  "italia":                [41.8719,  12.5674],
  "spain":                 [40.4637,  -3.7492],
  "spanjë":                [40.4637,  -3.7492],
  "spanje":                [40.4637,  -3.7492],
  "portugal":              [39.3999,  -8.2245],
  "malta":                 [35.9375,  14.3754],
  "cyprus":                [35.1264,  33.4299],

  // Northern Europe
  "sweden":                [60.1282,  18.6435],
  "norway":                [60.4720,   8.4689],
  "denmark":               [56.2639,   9.5018],
  "finland":               [61.9241,  25.7482],
  "estonia":               [58.5953,  25.0136],
  "latvia":                [56.8796,  24.6032],
  "lithuania":             [55.1694,  23.8813],
  "iceland":               [64.9631, -19.0208],

  // Eastern Europe
  "poland":                [51.9194,  19.1451],
  "czech republic":        [49.8175,  15.4730],
  "czechia":               [49.8175,  15.4730],
  "slovakia":              [48.6690,  19.6990],
  "hungary":               [47.1625,  19.5033],
  "ukraine":               [48.3794,  31.1656],
  "russia":                [61.5240, 105.3188],
  "belarus":               [53.7098,  27.9534],

  // Middle East & Turkey
  "turkey":                [38.9637,  35.2433],
  "türkiye":               [38.9637,  35.2433],
  "turkiye":               [38.9637,  35.2433],
  "turqi":                 [38.9637,  35.2433],
  "turqia":                [38.9637,  35.2433],
  "uae":                   [23.4241,  53.8478],
  "united arab emirates":  [23.4241,  53.8478],
  "qatar":                 [25.3548,  51.1839],
  "saudi arabia":          [23.8859,  45.0792],
  "israel":                [31.0461,  34.8516],
  "jordan":                [30.5852,  36.2384],
  "lebanon":               [33.8547,  35.8623],
  "kuwait":                [29.3117,  47.4818],
  "bahrain":               [26.0667,  50.5577],

  // North America
  "united states":         [37.0902, -95.7129],
  "united states of america": [37.0902, -95.7129],
  "usa":                   [37.0902, -95.7129],
  "u.s.":                  [37.0902, -95.7129],
  "u.s":                   [37.0902, -95.7129],
  "us":                    [37.0902, -95.7129],
  "america":               [37.0902, -95.7129],
  "amerikë":               [37.0902, -95.7129],
  "amerike":               [37.0902, -95.7129],
  "shba":                  [37.0902, -95.7129],
  "shtetet e bashkuara":   [37.0902, -95.7129],
  "canada":                [56.1304,-106.3468],
  "kanada":                [56.1304,-106.3468],
  "kanadaja":              [56.1304,-106.3468],

  // Latin America
  "mexico":                [23.6345,-102.5528],
  "brazil":                [-14.235, -51.9253],
  "argentina":             [-38.416, -63.6167],
  "chile":                 [-35.675, -71.5430],
  "colombia":              [  4.571, -74.2973],
  "peru":                  [-9.1900, -75.0152],

  // Asia Pacific
  "australia":             [-25.274, 133.7751],
  "new zealand":           [-40.901, 174.8860],
  "japan":                 [36.2048, 138.2529],
  "china":                 [35.8617, 104.1954],
  "south korea":           [35.9078, 127.7669],
  "korea":                 [35.9078, 127.7669],
  "india":                 [20.5937,  78.9629],
  "singapore":             [ 1.3521, 103.8198],
  "hong kong":             [22.3193, 114.1694],
  "thailand":              [15.8700, 100.9925],
  "indonesia":             [-0.7893, 113.9213],
  "malaysia":              [ 4.2105, 101.9758],

  // Africa
  "south africa":          [-30.559,  22.9375],
  "rsa":                   [-30.559,  22.9375],
  "afrika e jugut":        [-30.559,  22.9375],
  "egypt":                 [26.8206,  30.8025],
  "misr":                  [26.8206,  30.8025],
  "egjipt":                [26.8206,  30.8025],
  "morocco":               [31.7917,  -7.0926],
  "tunisia":               [33.8869,   9.5375],
  "algeria":               [28.0339,   1.6596],
  "libya":                 [26.3351,  17.2283],
  "nigeria":               [ 9.0820,   8.6753],
  "kenya":                 [-0.0236,  37.9062],
  "ghana":                 [ 7.9465,  -1.0232],
  "ethiopia":              [ 9.1450,  40.4897],
  "tanzania":              [-6.3690,  34.8888],
  "uganda":                [ 1.3733,  32.2903],
  "senegal":               [14.4974, -14.4524],
  "cameroon":              [ 7.3697,  12.3547],
  "ivory coast":           [ 7.5400,  -5.5471],
  "cote d'ivoire":         [ 7.5400,  -5.5471],

  // Additional Europe
  "moldova":               [47.4116,  28.3699],
  "georgia":               [42.3154,  43.3569],
  "armenia":               [40.0691,  45.0382],
  "azerbaijan":            [40.1431,  47.5769],

  // Caribbean & Central America
  "jamaica":               [18.1096, -77.2975],
  "trinidad and tobago":   [10.6918, -61.2225],
  "bahamas":               [25.0343, -77.3963],
  "barbados":              [13.1939, -59.5432],
  "dominican republic":    [18.7357, -70.1627],
  "cuba":                  [21.5218, -77.7812],
  "haiti":                 [18.9712, -72.2852],
  "puerto rico":           [18.2208, -66.5901],
  "costa rica":            [ 9.7489, -83.7534],
  "panama":                [ 8.5380, -80.7821],
  "guatemala":             [15.7835, -90.2308],
  "honduras":              [15.2000, -86.2419],
  "el salvador":           [13.7942, -88.8965],
  "nicaragua":             [12.8654, -85.2072],

  // South America additions
  "venezuela":             [ 6.4238, -66.5897],
  "ecuador":               [-1.8312, -78.1834],
  "bolivia":               [-16.290, -63.5887],
  "paraguay":              [-23.442, -58.4438],
  "uruguay":               [-32.523, -55.7658],
  "uruguai":               [-32.523, -55.7658],

  // Central & South Asia
  "pakistan":               [30.3753,  69.3451],
  "bangladesh":            [23.6850,  90.3563],
  "sri lanka":             [ 7.8731,  80.7718],
  "nepal":                 [28.3949,  84.1240],
  "afghanistan":           [33.9391,  67.7100],
  "uzbekistan":            [41.3775,  64.5853],
  "kazakhstan":            [48.0196,  66.9237],
  "kyrgyzstan":            [41.2044,  74.7661],
  "tajikistan":            [38.8610,  71.2761],
  "turkmenistan":          [38.9697,  59.5563],

  // East & Southeast Asia additions
  "vietnam":               [14.0583, 108.2772],
  "philippines":           [12.8797, 121.7740],
  "myanmar":               [21.9162,  95.9560],
  "cambodia":              [12.5657, 104.9910],
  "laos":                  [19.8563, 102.4955],
  "taiwan":                [23.6978, 120.9605],
  "mongolia":              [46.8625, 103.8467],

  // Middle East additions
  "iraq":                  [33.2232,  43.6793],
  "iran":                  [32.4279,  53.6880],
  "oman":                  [21.4735,  55.9754],
  "yemen":                 [15.5527,  48.5164],
  "syria":                 [34.8021,  38.9968],
  "palestine":             [31.9522,  35.2332],

  // Pacific
  "fiji":                  [-17.713, 178.0650],
  "papua new guinea":      [-6.3150, 143.9555],
};

// ── City coordinates [lat, lng] ───────────────────────────────────────────────
// Albanian diaspora priority cities + major global metros

const CITY_COORDS: Record<string, [number, number]> = {
  // Albania
  "tirana":         [41.3275,  19.8187],
  "tiranë":         [41.3275,  19.8187],
  "durrës":         [41.3246,  19.4565],
  "durres":         [41.3246,  19.4565],
  "durresi":        [41.3246,  19.4565],
  "shkodër":        [42.0685,  19.5127],
  "shkoder":        [42.0685,  19.5127],
  "shkodra":        [42.0685,  19.5127],
  "vlorë":          [40.4667,  19.4833],
  "vlore":          [40.4667,  19.4833],
  "vlora":          [40.4667,  19.4833],
  "elbasan":        [41.1128,  20.0822],
  "korçë":          [40.6186,  20.7808],
  "korce":          [40.6186,  20.7808],
  "korça":          [40.6186,  20.7808],
  "gjirokastër":    [40.0750,  20.1392],
  "gjirokaster":    [40.0750,  20.1392],
  "gjirokstra":     [40.0750,  20.1392],
  "fier":           [40.7239,  19.5567],
  "berat":          [40.7058,  19.9522],
  "lushnjë":        [40.9418,  19.7050],
  "lushnje":        [40.9418,  19.7050],
  "pogradec":       [40.9025,  20.6552],
  "kavajë":         [41.1850,  19.5567],
  "kavaje":         [41.1850,  19.5567],
  "laç":            [41.6350,  19.7167],
  "lac":            [41.6350,  19.7167],
  "lezhë":          [41.7833,  19.6500],
  "lezhe":          [41.7833,  19.6500],
  "sarandë":        [39.8750,  20.0050],
  "sarande":        [39.8750,  20.0050],

  // Kosovo
  "prishtina":      [42.6629,  21.1655],
  "pristina":       [42.6629,  21.1655],
  "prishtinë":      [42.6629,  21.1655],
  "prizren":        [42.2139,  20.7397],
  "peja":           [42.6597,  20.2881],
  "peć":            [42.6597,  20.2881],
  "pec":            [42.6597,  20.2881],
  "mitrovicë":      [42.8914,  20.8659],
  "mitrovica":      [42.8914,  20.8659],
  "gjakova":        [42.3828,  20.4314],
  "đakovica":       [42.3828,  20.4314],
  "ferizaj":        [42.3714,  21.1483],
  "uroševac":       [42.3714,  21.1483],
  "gjilan":         [42.4636,  21.4694],
  "gnjilane":       [42.4636,  21.4694],

  // North Macedonia
  "skopje":         [41.9973,  21.4280],
  "tetovo":         [42.0106,  20.9715],
  "gostivar":       [41.7958,  20.9114],
  "ohrid":          [41.1172,  20.8019],
  "bitola":         [41.0298,  21.3291],
  "kumanovo":       [42.1322,  21.7144],

  // Montenegro
  "podgorica":      [42.4304,  19.2594],
  "nikšić":         [42.7733,  18.9447],
  "niksic":         [42.7733,  18.9447],
  "bar":            [42.0979,  19.1016],
  "ulcinj":         [41.9253,  19.2219],

  // Serbia
  "belgrade":       [44.7866,  20.4489],
  "beograd":        [44.7866,  20.4489],
  "novi sad":       [45.2671,  19.8335],
  "niš":            [43.3209,  21.8954],
  "nis":            [43.3209,  21.8954],

  // Italy
  "rome":           [41.9028,  12.4964],
  "roma":           [41.9028,  12.4964],
  "milan":          [45.4642,   9.1900],
  "milano":         [45.4642,   9.1900],
  "florence":       [43.7696,  11.2558],
  "firenze":        [43.7696,  11.2558],
  "bari":           [41.1171,  16.8719],
  "naples":         [40.8518,  14.2681],
  "napoli":         [40.8518,  14.2681],
  "bologna":        [44.4949,  11.3426],
  "turin":          [45.0703,   7.6869],
  "torino":         [45.0703,   7.6869],
  "genoa":          [44.4056,   8.9463],
  "genova":         [44.4056,   8.9463],
  "palermo":        [38.1157,  13.3615],
  "lecce":          [40.3516,  18.1750],
  "brindisi":       [40.6405,  17.9416],
  "venice":         [45.4408,  12.3155],
  "venezia":        [45.4408,  12.3155],
  "verona":         [45.4384,  10.9916],
  "catanzaro":      [38.9098,  16.5877],
  "cosenza":        [39.3000,  16.2500],
  "reggio calabria":[38.1111,  15.6617],

  // Germany
  "berlin":         [52.5200,  13.4050],
  "munich":         [48.1351,  11.5820],
  "münchen":        [48.1351,  11.5820],
  "hamburg":        [53.5753,  10.0153],
  "frankfurt":      [50.1109,   8.6821],
  "cologne":        [50.9333,   6.9500],
  "köln":           [50.9333,   6.9500],
  "koln":           [50.9333,   6.9500],
  "düsseldorf":     [51.2217,   6.7762],
  "dusseldorf":     [51.2217,   6.7762],
  "stuttgart":      [48.7758,   9.1829],
  "dortmund":       [51.5136,   7.4653],
  "essen":          [51.4556,   7.0116],
  "bremen":         [53.0793,   8.8017],
  "nuremberg":      [49.4521,  11.0767],
  "nürnberg":       [49.4521,  11.0767],
  "leipzig":        [51.3397,  12.3731],
  "hanover":        [52.3759,   9.7320],
  "hannover":       [52.3759,   9.7320],

  // Switzerland
  "zurich":         [47.3769,   8.5417],
  "zürich":         [47.3769,   8.5417],
  "zuerich":        [47.3769,   8.5417],
  "bern":           [46.9480,   7.4474],
  "geneva":         [46.2044,   6.1432],
  "genève":         [46.2044,   6.1432],
  "geneve":         [46.2044,   6.1432],
  "lausanne":       [46.5197,   6.6323],
  "basle":          [47.5596,   7.5886],
  "basel":          [47.5596,   7.5886],
  "lugano":         [46.0037,   8.9511],
  "winterthur":     [47.5001,   8.7238],

  // Austria
  "vienna":         [48.2082,  16.3738],
  "wien":           [48.2082,  16.3738],
  "graz":           [47.0707,  15.4395],
  "linz":           [48.3069,  14.2858],
  "salzburg":       [47.8095,  13.0550],
  "innsbruck":      [47.2692,  11.4041],

  // United Kingdom
  "london":         [51.5074,  -0.1278],
  "manchester":     [53.4808,  -2.2426],
  "birmingham":     [52.4862,  -1.8904],
  "glasgow":        [55.8642,  -4.2518],
  "leeds":          [53.8008,  -1.5491],
  "edinburgh":      [55.9533,  -3.1883],
  "bristol":        [51.4545,  -2.5879],
  "sheffield":      [53.3811,  -1.4701],
  "liverpool":      [53.4084,  -2.9916],
  "nottingham":     [52.9548,  -1.1581],
  "leicester":      [52.6369,  -1.1398],
  "coventry":       [52.4068,  -1.5197],
  "cardiff":        [51.4816,  -3.1791],
  "belfast":        [54.5973,  -5.9301],

  // France
  "paris":          [48.8566,   2.3522],
  "lyon":           [45.7640,   4.8357],
  "marseille":      [43.2965,   5.3698],
  "toulouse":       [43.6047,   1.4442],
  "nice":           [43.7102,   7.2620],
  "bordeaux":       [44.8378,  -0.5792],
  "nantes":         [47.2184,  -1.5536],
  "strasbourg":     [48.5734,   7.7521],

  // Belgium
  "brussels":       [50.8503,   4.3517],
  "bruxelles":      [50.8503,   4.3517],
  "antwerp":        [51.2194,   4.4025],
  "antwerpen":      [51.2194,   4.4025],
  "ghent":          [51.0543,   3.7174],
  "liège":          [50.6326,   5.5797],

  // Netherlands
  "amsterdam":      [52.3676,   4.9041],
  "rotterdam":      [51.9244,   4.4777],
  "the hague":      [52.0705,   4.3007],
  "den haag":       [52.0705,   4.3007],
  "utrecht":        [52.0907,   5.1214],
  "eindhoven":      [51.4416,   5.4697],

  // Sweden
  "stockholm":      [59.3293,  18.0686],
  "gothenburg":     [57.7089,  11.9746],
  "göteborg":       [57.7089,  11.9746],
  "malmö":          [55.6050,  13.0038],
  "malmo":          [55.6050,  13.0038],

  // Scandinavia
  "oslo":           [59.9139,  10.7522],
  "copenhagen":     [55.6761,  12.5683],
  "københavn":      [55.6761,  12.5683],
  "helsinki":       [60.1699,  24.9384],

  // Turkey
  "istanbul":       [41.0082,  28.9784],
  "ankara":         [39.9334,  32.8597],
  "izmir":          [38.4192,  27.1287],
  "antalya":        [36.8969,  30.7133],
  "bursa":          [40.1885,  29.0610],
  "konya":          [37.8746,  32.4932],
  "gaziantep":      [37.0662,  37.3833],
  "adana":          [37.0000,  35.3213],
  "kayseri":        [38.7312,  35.4787],
  "eskişehir":      [39.7767,  30.5206],
  "eskisehir":      [39.7767,  30.5206],

  // UAE / Gulf
  "dubai":          [25.2048,  55.2708],
  "abu dhabi":      [24.2992,  54.6973],
  "sharjah":        [25.3573,  55.4033],
  "doha":           [25.2854,  51.5310],
  "riyadh":         [24.7136,  46.6753],

  // Greece
  "athens":         [37.9838,  23.7275],
  "athinai":        [37.9838,  23.7275],
  "thessaloniki":   [40.6401,  22.9444],

  // USA
  "new york":       [40.7128, -74.0060],
  "new york city":  [40.7128, -74.0060],
  "nyc":            [40.7128, -74.0060],
  "los angeles":    [34.0522,-118.2437],
  "la":             [34.0522,-118.2437],
  "chicago":        [41.8781, -87.6298],
  "houston":        [29.7604, -95.3698],
  "phoenix":        [33.4484,-112.0740],
  "philadelphia":   [39.9526, -75.1652],
  "san antonio":    [29.4241, -98.4936],
  "dallas":         [32.7767, -96.7970],
  "san jose":       [37.3382,-121.8863],
  "austin":         [30.2672, -97.7431],
  "san francisco":  [37.7749,-122.4194],
  "sf":             [37.7749,-122.4194],
  "boston":         [42.3601, -71.0589],
  "seattle":        [47.6062,-122.3321],
  "denver":         [39.7392,-104.9903],
  "nashville":      [36.1627, -86.7816],
  "detroit":        [42.3314, -83.0458],
  "portland":       [45.5231,-122.6765],
  "las vegas":      [36.1699,-115.1398],
  "miami":          [25.7617, -80.1918],
  "atlanta":        [33.7490, -84.3880],
  "minneapolis":    [44.9778, -93.2650],
  "new jersey":     [40.0583, -74.4057],
  "brooklyn":       [40.6782, -73.9442],
  "bronx":          [40.8448, -73.8648],
  "queens":         [40.7282, -73.7949],
  "staten island":  [40.5795, -74.1502],
  "hartford":       [41.7637, -72.6851],
  "bridgeport":     [41.1865, -73.1952],
  "stamford":       [41.0534, -73.5387],
  "washington":     [38.9072, -77.0369],
  "washington dc":  [38.9072, -77.0369],
  "charlotte":      [35.2271, -80.8431],
  "indianapolis":   [39.7684, -86.1581],
  "jacksonville":   [30.3322, -81.6557],
  "columbus":       [39.9612, -82.9988],
  "san diego":      [32.7157,-117.1611],
  "memphis":        [35.1495, -90.0490],
  "louisville":     [38.2527, -85.7585],
  "baltimore":      [39.2904, -76.6122],
  "milwaukee":      [43.0389, -87.9065],
  "albuquerque":    [35.0844,-106.6504],
  "tucson":         [32.2226,-110.9747],
  "fresno":         [36.7378,-119.7871],
  "sacramento":     [38.5816,-121.4944],
  "cleveland":      [41.4993, -81.6944],
  "kansas city":    [39.0997, -94.5786],
  "mesa":           [33.4152,-111.8315],
  "omaha":          [41.2565, -95.9345],

  // Canada
  "toronto":        [43.6532, -79.3832],
  "vancouver":      [49.2827,-123.1207],
  "montreal":       [45.5017, -73.5673],
  "montréal":       [45.5017, -73.5673],
  "calgary":        [51.0447,-114.0719],
  "ottawa":         [45.4215, -75.6972],
  "edmonton":       [53.5461,-113.4938],
  "winnipeg":       [49.8951, -97.1384],

  // Australia
  "sydney":         [-33.8688, 151.2093],
  "melbourne":      [-37.8136, 144.9631],
  "brisbane":       [-27.4698, 153.0251],
  "perth":          [-31.9505, 115.8605],
  "adelaide":       [-34.9285, 138.6007],
};

// ── State / region centroids [lat, lng] ──────────────────────────────────────
// US states, Canadian provinces, and key international regions

const STATE_COORDS: Record<string, [number, number]> = {
  // US States
  "alabama":              [32.3182, -86.9023],
  "alaska":               [64.2008,-152.4937],
  "arizona":              [34.0489,-111.0937],
  "arkansas":             [35.2010, -91.8318],
  "california":           [36.7783,-119.4179],
  "colorado":             [39.5501,-105.7821],
  "connecticut":          [41.6032, -73.0877],
  "delaware":             [38.9108, -75.5277],
  "florida":              [27.6648, -81.5158],
  "georgia":              [32.1656, -82.9001],
  "hawaii":               [19.8968,-155.5828],
  "idaho":                [44.0682,-114.7420],
  "illinois":             [40.6331, -89.3985],
  "indiana":              [40.2672, -86.1349],
  "iowa":                 [41.8780, -93.0977],
  "kansas":               [39.0119, -98.4842],
  "kentucky":             [37.8393, -84.2700],
  "louisiana":            [30.9843, -91.9623],
  "maine":                [45.2538, -69.4455],
  "maryland":             [39.0458, -76.6413],
  "massachusetts":        [42.4072, -71.3824],
  "michigan":             [44.3148, -85.6024],
  "minnesota":            [46.7296, -94.6859],
  "mississippi":          [32.3547, -89.3985],
  "missouri":             [37.9643, -91.8318],
  "montana":              [46.8797,-110.3626],
  "nebraska":             [41.4925,-99.9018],
  "nevada":               [38.8026,-116.4194],
  "new hampshire":        [43.1939, -71.5724],
  "new jersey":           [40.0583, -74.4057],
  "new mexico":           [34.5199,-105.8701],
  "new york":             [40.7128, -74.0060],
  "north carolina":       [35.7596, -79.0193],
  "north dakota":         [47.5515,-101.0020],
  "ohio":                 [40.4173, -82.9071],
  "oklahoma":             [35.4676, -97.5164],
  "oregon":               [43.8041,-120.5542],
  "pennsylvania":         [41.2033, -77.1945],
  "rhode island":         [41.5801, -71.4774],
  "south carolina":       [33.8361, -81.1637],
  "south dakota":         [43.9695,-99.9018],
  "tennessee":            [35.5175, -86.5804],
  "texas":                [31.9686, -99.9018],
  "utah":                 [39.3210,-111.0937],
  "vermont":              [44.5588, -72.5778],
  "virginia":             [37.4316, -78.6569],
  "washington":           [47.7511,-120.7401],
  "washington state":     [47.7511,-120.7401],
  "west virginia":        [38.5976, -80.4549],
  "wisconsin":            [43.7844, -88.7879],
  "wyoming":              [43.0760,-107.2903],
  "district of columbia": [38.9072, -77.0369],
  "dc":                   [38.9072, -77.0369],
  "washington dc":        [38.9072, -77.0369],
  "washington d.c.":      [38.9072, -77.0369],

  // Canadian Provinces
  "ontario":              [51.2538, -85.3232],
  "quebec":               [52.9399, -73.5491],
  "québec":               [52.9399, -73.5491],
  "british columbia":     [53.7267,-127.6476],
  "alberta":              [53.9333,-116.5765],
  "manitoba":             [53.7609, -98.8139],
  "saskatchewan":         [52.9399,-106.4509],
  "nova scotia":          [44.6820, -63.7443],
  "new brunswick":        [46.5653, -66.4619],

  // German states (Bundesländer)
  "bayern":               [48.7904,  11.4979],
  "bavaria":              [48.7904,  11.4979],
  "baden-württemberg":    [48.6616,   9.3501],
  "baden-wurttemberg":    [48.6616,   9.3501],
  "nordrhein-westfalen":  [51.4332,   7.6616],
  "north rhine-westphalia":[51.4332,  7.6616],
  "hessen":               [50.6521,   9.1624],
  "niedersachsen":        [52.6367,   9.8451],
  "lower saxony":         [52.6367,   9.8451],

  // UK regions
  "england":              [52.3555,  -1.1743],
  "scotland":             [56.4907,  -4.2026],
  "wales":                [52.1307,  -3.7837],
  "northern ireland":     [54.7877,  -6.4923],

  // Italian regions
  "lombardy":             [45.4791,   9.8452],
  "lombardia":            [45.4791,   9.8452],
  "lazio":                [41.6552,  12.9890],
  "campania":             [40.8359,  14.2488],
  "sicily":               [37.5999,  14.0154],
  "sicilia":              [37.5999,  14.0154],

  // Swiss cantons
  "zürich":               [47.3769,   8.5417],
  "zurich":               [47.3769,   8.5417],
  "bern":                 [46.9480,   7.4474],
  "geneva":               [46.2044,   6.1432],
  "genève":               [46.2044,   6.1432],

  // Australian states
  "new south wales":      [-33.8688, 151.2093],
  "nsw":                  [-33.8688, 151.2093],
  "victoria":             [-37.4713, 144.7852],
  "queensland":           [-20.9176, 142.7028],
};

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Normalise a location string for lookup.
 */
function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Strip diacritics/accents from a string for fuzzy matching.
 * e.g. "Durrës" → "Durres", "Tiranë" → "Tirane"
 */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const __DEV__ = process.env.NODE_ENV === "development";

/**
 * Resolve entity coordinates from the most precise available source.
 *
 * Priority order:
 *   1. Stored exact lat/lng
 *   2. City lookup
 *   3. State / region lookup
 *   4. Country centroid
 *   5. null (unmappable)
 *
 * @param storedLat  - Pre-geocoded latitude (preferred)
 * @param storedLng  - Pre-geocoded longitude (preferred)
 * @param city       - City text field
 * @param state      - State / region text field
 * @param country    - Country text field
 * @param debugLabel - Optional label for dev logging (e.g. entity name)
 * @returns ResolvedCoords or null if unmappable
 */
export function resolveCoords(
  storedLat?: number | null,
  storedLng?: number | null,
  city?: string | null,
  state?: string | null,
  country?: string | null,
  debugLabel?: string,
  /** Server-resolved coords from wac_cities (set in app/directory/page.tsx) */
  serverGeo?: { lat: number; lng: number; precision: GeoPrecision } | null,
): ResolvedCoords | null {
  const log = __DEV__ && debugLabel
    ? (msg: string) => console.debug(`[geo] ${debugLabel}: ${msg}`)
    : undefined;

  // 1. Stored exact coordinates (from future geocoder backfill on the entity row)
  if (
    storedLat != null &&
    storedLng != null &&
    Math.abs(storedLat) > 0.001 &&
    Math.abs(storedLng) > 0.001
  ) {
    log?.(`exact → [${storedLat}, ${storedLng}]`);
    return { lat: storedLat, lng: storedLng, precision: "exact" };
  }

  // 1b. Server-resolved coordinates from wac_cities (154K city DB)
  if (serverGeo && Math.abs(serverGeo.lat) > 0.001 && Math.abs(serverGeo.lng) > 0.001) {
    log?.(`wac_cities → [${serverGeo.lat.toFixed(4)}, ${serverGeo.lng.toFixed(4)}] (${serverGeo.precision})`);
    return serverGeo;
  }

  // 2. Local city lookup table (fallback for entries not in wac_cities)
  if (city) {
    const key = normalise(city);
    // Try exact match, then diacritics-stripped match
    const c = CITY_COORDS[key] ?? CITY_COORDS[stripDiacritics(key)];
    if (c) {
      log?.(`city "${city}" → [${c[0]}, ${c[1]}]`);
      return { lat: c[0], lng: c[1], precision: "city" };
    }
    log?.(`city "${city}" → not in lookup table`);
  }

  // 3. State / region lookup
  if (state) {
    const key = normalise(state);
    const c = STATE_COORDS[key];
    if (c) {
      log?.(`state "${state}" → [${c[0]}, ${c[1]}]`);
      return { lat: c[0], lng: c[1], precision: "state" };
    }
    log?.(`state "${state}" → not in lookup table`);
  }

  // 4. Country centroid
  if (country) {
    const key = normalise(country);
    const c = COUNTRY_CENTROIDS[key];
    if (c) {
      log?.(`country "${country}" → centroid [${c[0]}, ${c[1]}] (city=${city || "null"}, state=${state || "null"} were not resolvable)`);
      return { lat: c[0], lng: c[1], precision: "country" };
    }
    log?.(`country "${country}" → not in lookup table`);
  }

  log?.(`unmappable (city=${city || "null"}, state=${state || "null"}, country=${country || "null"})`);
  return null;
}

/**
 * Convert a ResolvedCoords to a GeoJSON-compatible [longitude, latitude] tuple.
 */
export function toGeoJSONCoords(coords: ResolvedCoords): [number, number] {
  return [coords.lng, coords.lat];
}

// ── Mapbox forward geocoding fallback ─────────────────────────────────────────
// Used when the local city lookup misses. Results are cached in-memory so each
// unique (city, state, country) tuple only hits the API once per session.

const GEOCODE_CACHE = new Map<string, ResolvedCoords | null>();

/**
 * Geocode a city via the Mapbox Forward Geocoding API.
 *
 * Only called when the local lookup table doesn't contain the city. Results are
 * cached in a module-level Map, so repeated calls for the same city are free.
 *
 * @returns ResolvedCoords at "city" precision, or null if geocoding fails.
 */
export async function geocodeWithMapbox(
  city: string,
  state?: string | null,
  country?: string | null,
  mapboxToken?: string,
  debugLabel?: string,
): Promise<ResolvedCoords | null> {
  if (!mapboxToken || !city?.trim()) return null;

  const queryParts = [city.trim(), state?.trim(), country?.trim()].filter(Boolean);
  const query      = queryParts.join(", ");
  const cacheKey   = normalise(query);

  // Return cached result (including cached nulls — "we already tried and failed")
  if (GEOCODE_CACHE.has(cacheKey)) {
    const cached = GEOCODE_CACHE.get(cacheKey) ?? null;
    if (__DEV__ && debugLabel) {
      console.debug(`[geo:mapbox] ${debugLabel}: cache ${cached ? "HIT" : "MISS(null)"} for "${query}"`);
    }
    return cached;
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set("access_token", mapboxToken);
    url.searchParams.set("limit", "1");
    url.searchParams.set("types", "place,locality");

    const res = await fetch(url.toString());
    if (!res.ok) {
      if (__DEV__ && debugLabel) {
        console.debug(`[geo:mapbox] ${debugLabel}: HTTP ${res.status} for "${query}"`);
      }
      GEOCODE_CACHE.set(cacheKey, null);
      return null;
    }

    const data = await res.json();

    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center as [number, number];
      const result: ResolvedCoords = { lat, lng, precision: "city" };
      GEOCODE_CACHE.set(cacheKey, result);

      if (__DEV__ && debugLabel) {
        console.debug(
          `[geo:mapbox] ${debugLabel}: "${query}" → [${lat.toFixed(4)}, ${lng.toFixed(4)}] (city) — ${data.features[0].place_name}`,
        );
      }
      return result;
    }

    if (__DEV__ && debugLabel) {
      console.debug(`[geo:mapbox] ${debugLabel}: "${query}" → 0 results`);
    }
  } catch (err) {
    if (__DEV__ && debugLabel) {
      console.debug(`[geo:mapbox] ${debugLabel}: error for "${query}"`, err);
    }
  }

  GEOCODE_CACHE.set(cacheKey, null);
  return null;
}

// ── Country name → ISO 2-letter code ──────────────────────────────────────────
// wac_cities uses ISO codes; profiles/businesses/orgs use full names.

const COUNTRY_TO_ISO: Record<string, string> = {
  "albania":               "AL",
  "shqipëri":              "AL",
  "shqiperi":              "AL",
  "shqipëria":             "AL",
  "shqiperia":             "AL",
  "kosovo":                "XK",
  "kosova":                "XK",
  "kosovë":                "XK",
  "kosove":                "XK",
  "north macedonia":       "MK",
  "macedonia":             "MK",
  "maqedonia":             "MK",
  "maqedonia e veriut":    "MK",
  "montenegro":            "ME",
  "mali i zi":             "ME",
  "serbia":                "RS",
  "serbi":                 "RS",
  "srbija":                "RS",
  "croatia":               "HR",
  "hrvatska":              "HR",
  "kroaci":                "HR",
  "slovenia":              "SI",
  "slovenija":             "SI",
  "slloveni":              "SI",
  "bosnia and herzegovina":"BA",
  "bosnia":                "BA",
  "bulgaria":              "BG",
  "bullgari":              "BG",
  "bullgaria":             "BG",
  "romania":               "RO",
  "rumani":                "RO",
  "rumania":               "RO",
  "greece":                "GR",
  "greqi":                 "GR",
  "greqia":                "GR",
  "hellas":                "GR",
  "yunanistan":            "GR",
  "turkey":                "TR",
  "türkiye":               "TR",
  "turkiye":               "TR",
  "turqi":                 "TR",
  "turqia":                "TR",
  "united states":         "US",
  "united states of america": "US",
  "usa":                   "US",
  "u.s.":                  "US",
  "u.s":                   "US",
  "us":                    "US",
  "america":               "US",
  "amerikë":               "US",
  "amerike":               "US",
  "shba":                  "US",
  "shtetet e bashkuara":   "US",
  "canada":                "CA",
  "kanada":                "CA",
  "kanadaja":              "CA",
  "mexico":                "MX",
  "méxico":                "MX",
  "meksikë":               "MX",
  "meksike":               "MX",
  "brazil":                "BR",
  "brasil":                "BR",
  "brazili":               "BR",
  "argentina":             "AR",
  "argjentina":            "AR",
  "chile":                 "CL",
  "kili":                  "CL",
  "colombia":              "CO",
  "peru":                  "PE",
  "united kingdom":        "GB",
  "uk":                    "GB",
  "u.k.":                  "GB",
  "great britain":         "GB",
  "britain":               "GB",
  "england":               "GB",
  "britania":              "GB",
  "britania e madhe":      "GB",
  "mbretëria e bashkuar":  "GB",
  "mbreteria e bashkuar":  "GB",
  "ireland":               "IE",
  "éire":                  "IE",
  "irlandë":               "IE",
  "irlanda":               "IE",
  "france":                "FR",
  "francë":                "FR",
  "franca":                "FR",
  "belgium":               "BE",
  "belgjikë":              "BE",
  "belgjika":              "BE",
  "netherlands":           "NL",
  "holland":               "NL",
  "holandë":               "NL",
  "holanda":               "NL",
  "luxembourg":            "LU",
  "luxemburg":             "LU",
  "luksemburg":            "LU",
  "germany":               "DE",
  "gjermani":              "DE",
  "gjermania":             "DE",
  "austria":               "AT",
  "österreich":            "AT",
  "austri":                "AT",
  "switzerland":           "CH",
  "suisse":                "CH",
  "schweiz":               "CH",
  "svizzera":              "CH",
  "svizra":                "CH",
  "zvicër":                "CH",
  "zvicer":                "CH",
  "zvicra":                "CH",
  "italy":                 "IT",
  "itali":                 "IT",
  "italia":                "IT",
  "spain":                 "ES",
  "españa":                "ES",
  "portugal":              "PT",
  "portugali":             "PT",
  "malta":                 "MT",
  "cyprus":                "CY",
  "sweden":                "SE",
  "sverige":               "SE",
  "suedi":                 "SE",
  "suedia":                "SE",
  "norway":                "NO",
  "norge":                 "NO",
  "norvegji":              "NO",
  "denmark":               "DK",
  "danmark":               "DK",
  "danimarkë":             "DK",
  "danimarke":             "DK",
  "finland":               "FI",
  "suomi":                 "FI",
  "finlandë":              "FI",
  "finlande":              "FI",
  "iceland":               "IS",
  "estonia":               "EE",
  "latvia":                "LV",
  "lithuania":             "LT",
  "poland":                "PL",
  "polska":                "PL",
  "poloni":                "PL",
  "czech republic":        "CZ",
  "czechia":               "CZ",
  "çeki":                  "CZ",
  "ceki":                  "CZ",
  "slovakia":              "SK",
  "hungary":               "HU",
  "magyarország":          "HU",
  "hungari":               "HU",
  "ukraine":               "UA",
  "russia":                "RU",
  "belarus":               "BY",
  "uae":                   "AE",
  "united arab emirates":  "AE",
  "emiratet e bashkuara arabe": "AE",
  "qatar":                 "QA",
  "katar":                 "QA",
  "saudi arabia":          "SA",
  "israel":                "IL",
  "jordan":                "JO",
  "lebanon":               "LB",
  "kuwait":                "KW",
  "bahrain":               "BH",
  "australia":             "AU",
  "australi":              "AU",
  "new zealand":           "NZ",
  "nz":                    "NZ",
  "zelandë e re":          "NZ",
  "zelanda e re":          "NZ",
  "japan":                 "JP",
  "china":                 "CN",
  "south korea":           "KR",
  "korea":                 "KR",
  "india":                 "IN",
  "singapore":             "SG",
  "hong kong":             "HK",
  "thailand":              "TH",
  "indonesia":             "ID",
  "malaysia":              "MY",
  "south africa":          "ZA",
  "rsa":                   "ZA",
  "afrika e jugut":        "ZA",
  "egypt":                 "EG",
  "misr":                  "EG",
  "egjipt":                "EG",
  "morocco":               "MA",
  "tunisia":               "TN",
  "algeria":               "DZ",
  "libya":                 "LY",
  "nigeria":               "NG",
  "kenya":                 "KE",
  "ghana":                 "GH",
  "ethiopia":              "ET",
  "tanzania":              "TZ",
  "uganda":                "UG",
  "senegal":               "SN",
  "cameroon":              "CM",
  "ivory coast":           "CI",
  "cote d'ivoire":         "CI",

  // Additional Europe
  "moldova":               "MD",
  "georgia":               "GE",
  "armenia":               "AM",
  "azerbaijan":            "AZ",
  "scotland":              "GB",
  "wales":                 "GB",
  "northern ireland":      "GB",

  // Caribbean & Central America
  "jamaica":               "JM",
  "trinidad and tobago":   "TT",
  "bahamas":               "BS",
  "barbados":              "BB",
  "dominican republic":    "DO",
  "cuba":                  "CU",
  "haiti":                 "HT",
  "puerto rico":           "PR",
  "costa rica":            "CR",
  "panama":                "PA",
  "guatemala":             "GT",
  "honduras":              "HN",
  "el salvador":           "SV",
  "nicaragua":             "NI",

  // South America additions
  "venezuela":             "VE",
  "ecuador":               "EC",
  "bolivia":               "BO",
  "paraguay":              "PY",
  "uruguay":               "UY",
  "uruguai":               "UY",

  // Central & South Asia
  "pakistan":               "PK",
  "bangladesh":            "BD",
  "sri lanka":             "LK",
  "nepal":                 "NP",
  "afghanistan":           "AF",
  "uzbekistan":            "UZ",
  "kazakhstan":            "KZ",
  "kyrgyzstan":            "KG",
  "tajikistan":            "TJ",
  "turkmenistan":          "TM",

  // East & Southeast Asia additions
  "vietnam":               "VN",
  "philippines":           "PH",
  "myanmar":               "MM",
  "cambodia":              "KH",
  "laos":                  "LA",
  "taiwan":                "TW",
  "mongolia":              "MN",

  // Middle East additions
  "iraq":                  "IQ",
  "iran":                  "IR",
  "oman":                  "OM",
  "yemen":                 "YE",
  "syria":                 "SY",
  "palestine":             "PS",

  // Pacific
  "fiji":                  "FJ",
  "papua new guinea":      "PG",
};

// ── US state name → abbreviation ──────────────────────────────────────────────

const STATE_NAME_TO_CODE: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "district of columbia": "DC", "florida": "FL", "georgia": "GA", "hawaii": "HI",
  "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME",
  "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
  "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
  "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
  "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX",
  "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
  "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
  // Territories
  "puerto rico": "PR", "guam": "GU", "us virgin islands": "VI",
  "american samoa": "AS", "northern mariana islands": "MP",
};

/**
 * Convert a full US state name to its 2-letter abbreviation.
 * If the input is already a 2-letter code, returns it uppercased.
 */
export function stateNameToCode(state: string): string {
  const trimmed = state.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_CODE[normalise(trimmed)] ?? trimmed.toUpperCase();
}

/**
 * Convert a full country name to an ISO 2-letter code.
 * Returns the input uppercased if it already looks like an ISO code (2 chars).
 */
export function countryToISO(country: string): string | null {
  const trimmed = country.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return COUNTRY_TO_ISO[normalise(trimmed)] ?? null;
}

// ── Server-side batch city resolution via wac_cities ──────────────────────────
// Called in the server component (app/directory/page.tsx) to attach lat/lng to
// entities BEFORE they reach the client.  Zero API calls — reads directly from
// the 154K-row wac_cities table in Supabase.

import { supabase } from "@/lib/supabase";

export type CityCoordResult = {
  lat: number;
  lng: number;
};

/**
 * Haversine distance in km between two [lat, lng] points.
 * Used to pick the closest wac_cities match when a city name is ambiguous
 * (e.g. "Riverdale" appears in GA, IL, NJ, NY, CA).
 */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Batch-resolve city coordinates from the wac_cities table.
 *
 * Accepts an array of { city, state, country } (profile-style full names).
 * Returns a Map keyed by `"city_lower|state_lower|country_iso"` with lat/lng.
 *
 * Resolution strategy:
 *   Tier 1a: US cities — direct query with state_name filter (letter codes match)
 *   Tier 1b: Non-US cities — `resolve_city_batch` RPC with accent-insensitive
 *            matching + prefix fallback (handles diacritics: ë↔e, truncation,
 *            Albanian/international spelling variants)
 *   Tier 2:  Mapbox Forward Geocoding — only for cities with zero local match
 */
export async function batchResolveCities(
  entries: Array<{ city?: string | null; state?: string | null; country?: string | null }>,
): Promise<Map<string, CityCoordResult>> {
  const results = new Map<string, CityCoordResult>();

  // Collect unique (city, state, country) triples
  type CityTriple = {
    cityLower: string;
    stateLower: string;
    stateCode: string;
    iso: string;
    rawCity: string;
    rawState: string | null;
    rawCountry: string | null;
  };
  const uniqueTriples = new Map<string, CityTriple>();
  for (const e of entries) {
    if (!e.city?.trim() || !e.country?.trim()) continue;
    const cityLower  = normalise(e.city);
    const stateLower = e.state ? normalise(e.state) : "";
    const iso = countryToISO(e.country);
    if (!iso) continue;
    const stateCode = e.state ? stateNameToCode(e.state) : "";
    const key = `${cityLower}|${stateLower}|${iso}`;
    if (!uniqueTriples.has(key)) {
      uniqueTriples.set(key, {
        cityLower, stateLower, stateCode, iso,
        rawCity: e.city!.trim(),
        rawState: e.state?.trim() || null,
        rawCountry: e.country!.trim(),
      });
    }
  }

  if (uniqueTriples.size === 0) return results;

  const triplesArr = [...uniqueTriples.entries()];

  // ── Split US vs non-US cities ──────────────────────────────────────────────
  // US cities use direct query with state filter (letter codes work).
  // Non-US cities use the accent-insensitive batch RPC.
  const usTriples:    typeof triplesArr = [];
  const nonUsTriples: typeof triplesArr = [];
  for (const entry of triplesArr) {
    if (entry[1].iso === "US") usTriples.push(entry);
    else nonUsTriples.push(entry);
  }

  // ── Tier 1a: US cities — direct query with state filter ────────────────────
  const usQueries = usTriples.map(async ([key, t]) => {
    let query = supabase
      .from("wac_cities")
      .select("lat, lng")
      .ilike("city_name", t.cityLower)
      .eq("country_name", "US");

    if (t.stateCode) {
      query = query.eq("state_name", t.stateCode);
    }

    const { data, error } = await query.limit(1);
    if (error) {
      if (__DEV__) console.debug(`[geo:wac_cities] error "${t.cityLower}" (US, ${t.stateCode || "—"}):`, error.message);
      return;
    }
    if (data?.[0]) {
      const lat = typeof data[0].lat === "string" ? parseFloat(data[0].lat) : data[0].lat;
      const lng = typeof data[0].lng === "string" ? parseFloat(data[0].lng) : data[0].lng;
      results.set(key, { lat, lng });
      if (__DEV__) console.debug(`[geo:wac_cities] "${t.cityLower}" (US, ${t.stateCode || "—"}) → [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    }
  });

  // ── Tier 1b: Non-US cities — batch RPC with accent-insensitive matching ────
  // resolve_city_batch uses unaccent() + prefix fallback to handle:
  //   "Durres"  → matches "Durrës"  (diacritics)
  //   "Sarand"  → matches "Sarandë" (truncation)
  //   "Tiranë"  → matches "Tirana"  (variant suffix ë→a)
  let rpcPromise: Promise<void> = Promise.resolve();
  if (nonUsTriples.length > 0) {
    const cities    = nonUsTriples.map(([, t]) => t.rawCity);
    const countries = nonUsTriples.map(([, t]) => t.iso);

    rpcPromise = (async () => {
      const { data, error } = await supabase.rpc("resolve_city_batch", {
        p_cities: cities,
        p_countries: countries,
      });

      if (error) {
        if (__DEV__) console.debug("[geo:resolve_city_batch] RPC error:", error.message);
        return;
      }

      if (data) {
        for (const row of data as Array<{ idx: number; lat: string | number; lng: string | number }>) {
          // idx is 1-based from the PL/pgSQL function
          const tripleEntry = nonUsTriples[row.idx - 1];
          if (!tripleEntry) continue;
          const [key] = tripleEntry;
          const lat = typeof row.lat === "string" ? parseFloat(row.lat) : row.lat;
          const lng = typeof row.lng === "string" ? parseFloat(row.lng) : row.lng;
          results.set(key, { lat, lng });
          if (__DEV__) {
            const t = tripleEntry[1];
            console.debug(`[geo:wac_cities] "${t.rawCity}" (${t.iso}) → [${lat.toFixed(4)}, ${lng.toFixed(4)}] (accent-safe)`);
          }
        }
      }
    })();
  }

  // Run US queries and non-US RPC in parallel
  await Promise.all([...usQueries, rpcPromise]);

  // ── Tier 2a: Query Geo Cache for unresolved cities ──────────────────────────
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    const unresolvedInitially = triplesArr.filter(([key]) => !results.has(key));
    if (unresolvedInitially.length > 0) {
      const keysToLookup = unresolvedInitially.map(([key]) => key);
      
      const { data: cached } = await supabase
        .from('geo_cache')
        .select('lookup_key, lat, lng')
        .in('lookup_key', keysToLookup);
        
      if (cached && cached.length > 0) {
        for (const c of cached) {
          results.set(c.lookup_key, { lat: Number(c.lat), lng: Number(c.lng) });
          if (__DEV__) console.debug(`[geo:cache] "${c.lookup_key}" → [${c.lat}, ${c.lng}]`);
        }
      }

      // ── Tier 2b: Final Mapbox Fallback ───────────────────────────────────────
      const stillUnresolved = unresolvedInitially.filter(([key]) => !results.has(key));
      if (stillUnresolved.length > 0) {
        await Promise.all(stillUnresolved.map(async ([key, t]) => {
          const geo = await geocodeWithMapbox(
            t.rawCity, t.rawState, t.rawCountry,
            mapboxToken, `${t.rawCity} (fallback)`,
          );
          if (geo) {
            results.set(key, { lat: geo.lat, lng: geo.lng });
            // Cache the successful Mapbox hit without blocking the request
            supabase.from('geo_cache').upsert(
              { lookup_key: key, lat: geo.lat, lng: geo.lng },
              { onConflict: 'lookup_key' }
            ).then(({ error }) => {
              if (error && __DEV__) console.warn("[geo:cache] write error:", error.message);
            });
          }
        }));
      }
    }
  }

  if (__DEV__) {
    console.debug(`[geo:wac_cities] resolved ${results.size}/${uniqueTriples.size} cities`);
  }

  return results;
}

/**
 * Build the lookup key for a batchResolveCities result map.
 * Must match the key format used inside batchResolveCities:
 *   "city_lower|state_lower|country_iso"
 */
export function cityLookupKey(
  city: string,
  state: string | null | undefined,
  country: string,
): string | null {
  const iso = countryToISO(country);
  if (!iso) return null;
  const stateLower = state ? normalise(state) : "";
  return `${normalise(city)}|${stateLower}|${iso}`;
}
