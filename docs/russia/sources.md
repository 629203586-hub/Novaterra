# Winter in Moscow — reference and design record

Rebuilt 2026-11-04. An artistically compressed, contemporary winter district inspired by historic central Moscow. Dimensions are proportional estimates, not surveyed measurements. West is -X; north is -Z. Kremlin on the west, GUM on the east, Saint Basil’s at the southern end. The river is a separate southern-edge section. No St Petersburg landmarks or American assets.

## Inspected visual evidence

| Source | Observations used | Model decision |
| --- | --- | --- |
| [Saint Basil’s museum / State Historical Museum](https://shm.ru/museum/hvb/) and [architecture](https://shm.ru/arkhitektura-i-zhivopis-pokrovskogo-sobora/) | Central tent church and surrounding chapels, white half-columns and arcaded decoration | Nine principal silhouettes, octagonal drums, stacked kokoshniki, stone arch surrounds |
| [Moscow photographic visit, May 2013](https://www.swisscastles.ch/moscou/basile.html) — inspected original photos `moscou_basile_060513_02.jpg`, `moscou_basile_060513_06.jpg` | Broad red plinth/gallery, asymmetrical blue-white and green-gold bulbs, covered entrance and staircase, separate tented bell tower | Complete chapel volumes, raised entrance, staircase/railings, separate east bell tower; inferred rear details remain consistent with these elevations |
| [Saint Basil’s roof detail](https://www.modlar.com/photos/9939/saint-basils-cathedral-roof/) — original 1920px image inspected | Raised diamond enamel, twisted ribs, thin gold finials, white panels on brick drums | Custom 96×44 onion surfaces, 12 curved ribs per dome, raised diamond tiles, gold crosses, layered facade trim |
| [Spasskaya clock photograph](https://moscowchronology.ru/Spasskaya.html) — `Spasskaya_bashnya_chasy.jpg` inspected | Dark clock face, gold Roman numerals, white stone cusp above the clock | Four legible canvas clock faces, gold rims, carved arches, green tiered tent and corner pinnacles |
| [GUM history](https://gum.ru/history/) | Neo-Russian department-store identity; historical street frontage | Limited but continuous east-side facade; historical photo is not treated as the present elevation |
| [Modern GUM facade photograph](https://horosho-tam.ru/rossiya/moskva/ekskursii/kreml-i-krasnaya-ploschad) — original [Tripster image](https://cdn.tripster.ru/thumbs2/aaa8f080-c338-11ed-a8af-1eadddfdf667.1000x1350.jpeg) inspected | Carved archivolts, projecting central entrance, repeated narrow windows, limestone bands, roof ornaments | Layered entrance arches, three levels of framed glazing, horizontal relief bands and roofline ornaments |

Images were used as modeling references only and are not embedded or redistributed with the world. Local working reference copies and baseline screenshots are retained in ignored `work/russia-rebuild/`. No interactive Street View was available/used. Capture date is known only for the Swisscastles May-2013 series; other dates unverified. Seasonal snow and the river edge are authored interpretation. The topology and street widths are deliberately compressed.

## Existing implementation audit

- Prior Russia: Three.js 0.169 CDN imports, toon/OutlineEffect, simple colorful onion shapes, generic timber village and skating pond. Limited facade depth, flat broad light, no close-inspection mode. This required new composition and architectural geometry, not recoloring.
- USA benchmark inspected both embedded source and real browser screenshot: Three.js 0.180, native JS modules, shared geometry/material batching, separate animated actors, controlled exposure/bloom, extensive local details and shared country shell. It is a quality benchmark; no USA geometry or cultural assets were copied.
- Russia now uses the same locally vendored Three.js 0.180 and compatible WebGL2/EffectComposer path. Experimental WebGPU migration was deliberately avoided: the site’s established postprocessing is WebGL and browser reliability matters. No incompatible pipeline or new runtime dependency is introduced.
- Explicit brief overrides the default toon surface treatment with PBR: MeshStandard/Physical materials, generated brick/cobble/roughness textures, ACES, PMREM environment and soft PCF shadows. No external models or runtime images. Contact atlas complements geometric/direct shadows; no claim of ray tracing, CSM or screen-space AO.

## Scale and safeguards

42×35 solid block. Cathedral centered at (2,2.2); Kremlin at x=-11; GUM at x=13.4; river at z≈15. Outside road at z≈10.4. Walking loops stay outside cathedral, walls and shops. Vehicles use a separate continuous exterior loop. Snow is assigned to ledges, curved dome shoulders, roofs, benches and branches; road and walked paving reveal compacted cobbles. Every exposed base edge is closed.

## Performance / interaction design

Static architecture merged by material; humans use instanced body parts; shared cloned wheel geometry, one snowfall point draw. Pixel-ratio caps 1.65 desktop / 1.25 mobile, 1024 mobile / 2048 desktop directional shadows, adaptive bloom/pixel-ratio downgrade. Visibility pause, reduced-motion defaults, manual orbit/zoom, smooth camera presets, keyboard Escape, context loss recovery, and resource disposal. Diagnostics distinguish total render calls (including shadows/postprocess) from static material batches. No physical-device or guaranteed 60 FPS claim.

## User revision, 2026-11-04
The user rejected the first rebuilt proportions and requested removal of the separate cathedral inspection. The inspection button and mode were removed. The cathedral now has a broader footprint, shorter chapel shafts, larger onion domes and a lower central tent. Surrounding generic plaster houses were replaced with Moscow-inspired brick architecture, carved surrounds, glazed medallions and green metal roofs. A Russian tricolor, a PAZ-inspired parked coach, a tea pavilion and a Minin/Pozharsky-inspired monument add place-specific identity. The snowfall now uses 1900 larger flakes (950 mobile) and more snow on ground/roofs. These are authored interpretations, not new measured claims.

## Validation completed
67 existing tests passed; build and Worker artifact validation passed. Real Chrome/WebGL browser checks covered eight rotating viewpoints, golden/blue lighting, animation and snow pause/resume, 390px and 320px layouts, reduced-motion defaults, and the exported self-contained HTML with HTTP(S) requests blocked. No page or console errors were observed. Country controls remain English; English/Russian title and Moscow clock remain integrated. All other country scene files and shared shell files are unchanged. Static architecture is 40 material batches; total renderer counters include shadow and postprocessing passes. Representative screenshots and full browser report are retained in the local work directory. Physical phone/GPU performance and exact measured architectural reconstruction are not claimed.
