# SU7 3D asset attribution

`su7-debadged.glb` is adapted from **SU7** by **s1657270997**.

- Original model: https://sketchfab.com/3d-models/su7-7296a91633d74c6eb113010e2ed75eda
- Creator: https://sketchfab.com/s1657270997
- License: **Creative Commons Attribution 4.0 International (CC BY 4.0)** — https://creativecommons.org/licenses/by/4.0/
- Downloaded from the openly redistributed copy in `rucsocial/su7-anatomy-studio`, pinned at commit `e67eac84a8f84db4458d900ce225ff77092c2914`:
  https://raw.githubusercontent.com/rucsocial/su7-anatomy-studio/e67eac84a8f84db4458d900ce225ff77092c2914/public/models/939243423__su7.glb
- Source-repository attribution: https://github.com/rucsocial/su7-anatomy-studio/blob/e67eac84a8f84db4458d900ce225ff77092c2914/README.md
- The original model's current public Sketchfab metadata and embedded GLB metadata both identify CC BY 4.0 and the same creator; checked on 2026-10-20.
  https://api.sketchfab.com/v3/models/7296a91633d74c6eb113010e2ed75eda

## Changes in this project

- Physically removed the independent front emblem and every rear lettering mesh: 12,240 triangles in total. These disconnected glyph meshes are not structural vehicle parts.
- Replaced triangles sampling visible wheel-cap, brake-label, door-speaker and cabin-screen branding with neutral PBR materials. The rest of the embedded texture atlases remain intact; branding pixels in unused atlas areas are not displayed.
- Changed both registration plates to blank neutral plates.
- Adjusted gulf-blue paint roughness and metalness for the web scene, retaining clear-coat shading, original geometry, cabin, four door groups, lights and wheels.
- Compacted unused badge accessors/materials/geometry out of the GLB. Exported geometry: **158,131 triangles**; all textures are embedded; no Draco decoder is required.
- The shared loader rotates the nose toward −X, preserves Y-up and original proportions, and normalizes the wheelbase to approximately 2.90 m. Resulting overall length is approximately 4.99 m, width including mirrors 2.10 m, height 1.40 m; the tire bottom sits at Y = 0.005 m.
- Split the source merged wheels into four independent pivots; centered the track on the body centerline and aligned the left/right members of each axle without changing tire or rim dimensions. Separated UV-identified tire faces into a dark nonmetallic rubber material with retained tread normals; reduced wheel-rim reflections.
- The loader uses silver-blue clear-coated physical paint, omits the obsolete baked badge AO footprint, and applies dark tinted glazing.
- The shell ignores picking rays so transparent bodywork cannot block interactive teaching components.

This is a community visual model used as a non-official teaching illustration. The vehicle shell does not imply that the project's fuel-cell, hybrid or range-extender teaching layouts describe a production SU7. No affiliation with or endorsement by Xiaomi is claimed. The CC BY license applies to the community 3D artwork and does not grant trademark rights.

Please retain the creator, source link, license link and modification notice when redistributing this adapted asset.

The web loader uses a silver-blue clear-coated paint material and darker glazing. The paint occlusion channel containing baked emblem shadows was also removed from the adapted GLB itself, so that the detached asset does not restore those marks in another viewer.

# XC60 Recharge PHEV visual shell

`xc60-recharge-debadged.glb` is adapted from **2023 Volvo XC60 Recharge** by **Nazh Design ✔**.

- Original model: https://sketchfab.com/3d-models/c35ef02fd38b48adadc17f117a4a518c
- Creator: https://sketchfab.com/NazhDesign
- License: **CC BY 4.0** — https://creativecommons.org/licenses/by/4.0/
- Public licensed redistribution: https://raw.githubusercontent.com/pedrosoandre/carros/0a56de377f02f2574d781f6920fed08d6423ec2f/assets/volvo-xc60.glb
- Source and license records: https://github.com/pedrosoandre/carros/blob/0a56de377f02f2574d781f6920fed08d6423ec2f/CREDITS.md and https://github.com/pedrosoandre/carros/blob/0a56de377f02f2574d781f6920fed08d6423ec2f/LICENSE-3D-MODELS.md
- Current author/license/downloadability independently checked using https://api.sketchfab.com/v3/models/c35ef02fd38b48adadc17f117a4a518c on 2026-10-20. The downloaded GLB embeds the same author, license and source.

The repository's copy was simplified and meshopt-compressed. This project decoded its geometry, removed 72 independent front/rear/wheel emblem and glyph components (3,720 triangles), and added unmarked wheel hub caps. It separates vertex-colored regions into physical paint, glazing, cabin, trim, lights, nonmetallic rough rubber and metal. Four wheel assemblies have independent pivots, symmetric tracks, matched tire sizes and aligned axles. The vehicle body retains its proportions; uniform scale 1.010483 normalizes the teaching wheelbase to 2.90 m. Tire bottoms are placed at Y = 0.005 m. The paint and glazing normals were rebuilt from the retained surface positions with a 50-degree crease threshold to correct shading discontinuities inherited from the simplified source. Paint metallic/clearcoat response was softened for the web lighting. Exported geometry: **174,824 triangles**, with no meshopt or Draco decoder needed at runtime. Transparent teaching views use consistent opacity across exterior panels, glazing and fittings while hiding the cabin; wheels remain opaque.

Volvo's official 2023 model description identifies XC60 Recharge T6/T8 as plug-in hybrids: https://www.volvocars.com/intl/media/models/xc60/2023/ . This community exterior illustrates a PHEV SUV; the internal component layouts remain generic teaching illustrations, not an OEM XC60 service model. No affiliation or endorsement is claimed. Retain the author, source, license and modification notice on redistribution.

# Generic teaching shells

`models/generic-shell.js` creates original, unbranded SUV and sedan envelopes from smooth longitudinal lofts. Their bodywork, glazing and window outlines are procedural teaching illustrations, not a production vehicle exterior. Neither source SU7 bodywork nor its cabin is displayed.

Only the four corrected, debadged wheel assemblies are reused from `su7-debadged.glb`; their author, CC BY 4.0 license, source and modification notices are retained in the SU7 section above. The wheel centers, 2.90 m wheelbase and Y = 0.005 m tire grounding remain unchanged. The generic shells use uniform translucent exterior opacity and never intercept picking rays for teaching components. Complete generic teaching cars additionally contain an original procedural seat/dashboard cabin built by this project. That cabin is faintly translucent and hides together with bodywork in the underbody view. Brand-vehicle exterior fallbacks omit it so generic cabin parts are not presented as corresponding brand interiors.

# Model 3 pre-facelift visual shell

`model3-2018-debadged.glb` is adapted from **Tesla 2018 Model 3** by **Ameer Studio**.

- Original model: https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f
- Creator: https://sketchfab.com/uchiha.321abc
- License: **CC BY 4.0** — https://creativecommons.org/licenses/by/4.0/
- Public licensed redistribution, pinned to commit `0a56de377f02f2574d781f6920fed08d6423ec2f`:
  https://raw.githubusercontent.com/pedrosoandre/carros/0a56de377f02f2574d781f6920fed08d6423ec2f/assets/tesla-model.glb
- Redistribution credits and processing notes: https://github.com/pedrosoandre/carros/blob/0a56de377f02f2574d781f6920fed08d6423ec2f/CREDITS.md and https://github.com/pedrosoandre/carros/blob/0a56de377f02f2574d781f6920fed08d6423ec2f/LICENSE-3D-MODELS.md
- Original public Sketchfab API metadata and the downloaded GLB metadata independently identify the same creator, model title and CC BY 4.0 license; verified on 2026-10-20:
  https://api.sketchfab.com/v3/models/5ef9b845aaf44203b6d04e2c677e444f

The original community model represents **2018**, before the Highland facelift. It is shown as a same-generation exterior reference beside the project's **2023 rear-wheel-drive architecture**. It does not assert exact 2023 trim, wheels, glazing, dimensions or OEM CAD fidelity.

Project modifications: decoded meshopt and normalized quantized attributes; removed 7,400 triangles belonging to independent front, rear, side and wheel emblem glyphs; omitted 95,233 cabin/interior triangles; removed every original texture; used neutral unmarked physical materials and blank registration plates; split the source's paired wheels into four independent pivots; matched tire radii, centered each axle, and made the track symmetric at 1.72 m with a 2.90 m teaching wheelbase. Tire bottoms are at Y = 0.005 m. Body proportions are preserved under uniform scale. Exported geometry: **119,916 triangles**, 20 meshes, no external textures and no runtime mesh decoder. The loader uses translucent bodywork, hides bodywork in the underbody view, leaves the wheels opaque, and does not intercept teaching-part picking rays. Please retain this author, source, license and modification notice when redistributing the adapted GLB. No affiliation or endorsement by Tesla is claimed.
